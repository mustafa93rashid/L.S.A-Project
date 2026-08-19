const { spawn } = require("child_process");
const fs = require("fs");
const fsPromises = require("fs/promises");
const os = require("os");
const path = require("path");
const unzipper = require("unzipper");
const cloudinary = require("cloudinary").v2;

// ==================== Constants ====================

const SUPPORTED_BACKUP_VERSION = 1;

const REQUIRED_BACKUP_FILES = [
  "backup-info.json",
  "database/mongodb.archive.gz",
  "cloudinary/manifest.json",
];

// ==================== Create Service Error ====================

const createServiceError = (
  message,
  statusCode = 500,
  code = "RESTORE_ERROR",
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

// ==================== Validate Configuration ====================

const validateRestoreConfiguration = () => {
  if (!process.env.MONGODB_URI) {
    throw createServiceError(
      "MongoDB connection string is not configured",
      500,
      "RESTORE_MONGODB_URI_MISSING",
    );
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw createServiceError(
      "Cloudinary cloud name is not configured",
      500,
      "RESTORE_CLOUDINARY_CLOUD_NAME_MISSING",
    );
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    throw createServiceError(
      "Cloudinary API key is not configured",
      500,
      "RESTORE_CLOUDINARY_API_KEY_MISSING",
    );
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    throw createServiceError(
      "Cloudinary API secret is not configured",
      500,
      "RESTORE_CLOUDINARY_API_SECRET_MISSING",
    );
  }
};

// ==================== Configure Cloudinary ====================

const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
};

// ==================== Remove Directory Safely ====================

const removeDirectorySafely = async (directoryPath) => {
  if (!directoryPath) return;

  try {
    await fsPromises.rm(directoryPath, {
      recursive: true,
      force: true,
    });
  } catch (error) {
    console.error(
      "Failed to remove temporary restore directory:",
      error,
    );
  }
};

// ==================== Remove File Safely ====================

const removeFileSafely = async (filePath) => {
  if (!filePath) return;

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "Failed to remove temporary restore file:",
        error,
      );
    }
  }
};

// ==================== Check Path Inside Directory ====================

const isPathInsideDirectory = (parentDirectory, childPath) => {
  const relativePath = path.relative(
    parentDirectory,
    childPath,
  );

  return (
    relativePath !== "" &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  );
};

// ==================== Read JSON File ====================

const readJsonFile = async (filePath, errorCode) => {
  try {
    const content = await fsPromises.readFile(
      filePath,
      "utf8",
    );

    return JSON.parse(content);
  } catch {
    throw createServiceError(
      `Failed to read ${path.basename(filePath)}`,
      400,
      errorCode,
    );
  }
};

// ==================== Extract Backup Archive ====================

const extractBackupArchive = async (zipFilePath) => {
  if (!zipFilePath) {
    throw createServiceError(
      "Backup ZIP file is required",
      400,
      "RESTORE_FILE_REQUIRED",
    );
  }

  const fileStats = await fsPromises
    .stat(zipFilePath)
    .catch(() => null);

  if (!fileStats?.isFile()) {
    throw createServiceError(
      "Backup ZIP file was not found",
      400,
      "RESTORE_FILE_NOT_FOUND",
    );
  }

  const restoreDirectory = await fsPromises.mkdtemp(
    path.join(
      os.tmpdir(),
      "lsa-restore-",
    ),
  );

  try {
    const archive = await unzipper.Open.file(
      zipFilePath,
    );

    for (const entry of archive.files) {
      const normalizedPath = entry.path
        .replace(/\\/g, "/")
        .replace(/^\/+/, "");

      if (!normalizedPath) continue;

      const destinationPath = path.resolve(
        restoreDirectory,
        normalizedPath,
      );

      if (
        !isPathInsideDirectory(
          restoreDirectory,
          destinationPath,
        )
      ) {
        throw createServiceError(
          "Backup archive contains an unsafe file path",
          400,
          "RESTORE_UNSAFE_ARCHIVE_PATH",
        );
      }

      if (entry.type === "Directory") {
        await fsPromises.mkdir(
          destinationPath,
          {
            recursive: true,
          },
        );

        continue;
      }

      await fsPromises.mkdir(
        path.dirname(destinationPath),
        {
          recursive: true,
        },
      );

      await new Promise(
        (resolve, reject) => {
          const input = entry.stream();

          const output =
            fs.createWriteStream(
              destinationPath,
            );

          input.on("error", reject);
          output.on("error", reject);
          output.on("finish", resolve);

          input.pipe(output);
        },
      );
    }

    return restoreDirectory;
  } catch (error) {
    await removeDirectorySafely(
      restoreDirectory,
    );

    throw error;
  }
};

// ==================== Validate Required Files ====================

const validateRequiredBackupFiles = async (
  restoreDirectory,
) => {
  for (const relativePath of REQUIRED_BACKUP_FILES) {
    const filePath = path.join(
      restoreDirectory,
      relativePath,
    );

    const stats = await fsPromises
      .stat(filePath)
      .catch(() => null);

    if (!stats?.isFile()) {
      throw createServiceError(
        `Backup is missing required file: ${relativePath}`,
        400,
        "RESTORE_BACKUP_FILE_MISSING",
      );
    }
  }
};

// ==================== Validate Backup Information ====================

const validateBackupInformation = async (
  restoreDirectory,
) => {
  const filePath = path.join(
    restoreDirectory,
    "backup-info.json",
  );

  const backupInfo = await readJsonFile(
    filePath,
    "RESTORE_INVALID_BACKUP_INFO",
  );

  if (
    backupInfo.version !==
    SUPPORTED_BACKUP_VERSION
  ) {
    throw createServiceError(
      `Unsupported backup version: ${backupInfo.version}`,
      400,
      "RESTORE_UNSUPPORTED_BACKUP_VERSION",
    );
  }

  if (
    backupInfo.application &&
    backupInfo.application !== "LSA"
  ) {
    throw createServiceError(
      "This backup does not belong to the LSA application",
      400,
      "RESTORE_INVALID_APPLICATION",
    );
  }

  if (!backupInfo.database?.included) {
    throw createServiceError(
      "Backup does not contain MongoDB data",
      400,
      "RESTORE_DATABASE_NOT_INCLUDED",
    );
  }

  if (!backupInfo.cloudinary?.included) {
    throw createServiceError(
      "Backup does not contain Cloudinary assets",
      400,
      "RESTORE_CLOUDINARY_NOT_INCLUDED",
    );
  }

  return backupInfo;
};

// ==================== Validate MongoDB Archive ====================

const validateMongoArchive = async (
  restoreDirectory,
) => {
  const archivePath = path.join(
    restoreDirectory,
    "database",
    "mongodb.archive.gz",
  );

  const stats = await fsPromises
    .stat(archivePath)
    .catch(() => null);

  if (
    !stats?.isFile() ||
    stats.size === 0
  ) {
    throw createServiceError(
      "MongoDB backup archive is invalid or empty",
      400,
      "RESTORE_INVALID_MONGODB_ARCHIVE",
    );
  }

  return archivePath;
};

// ==================== Validate Cloudinary Manifest ====================

const validateCloudinaryManifest = async (
  restoreDirectory,
) => {
  const manifestPath = path.join(
    restoreDirectory,
    "cloudinary",
    "manifest.json",
  );

  const manifest = await readJsonFile(
    manifestPath,
    "RESTORE_INVALID_CLOUDINARY_MANIFEST",
  );

  if (!Array.isArray(manifest.resources)) {
    throw createServiceError(
      "Cloudinary manifest resources are invalid",
      400,
      "RESTORE_INVALID_CLOUDINARY_RESOURCES",
    );
  }

  const assetsDirectory = path.resolve(
    restoreDirectory,
    "cloudinary",
    "assets",
  );

  for (const asset of manifest.resources) {
    if (!asset.publicId) {
      throw createServiceError(
        "Cloudinary manifest contains an asset without publicId",
        400,
        "RESTORE_CLOUDINARY_PUBLIC_ID_MISSING",
      );
    }

    if (!asset.backupFile) {
      throw createServiceError(
        `Backup file reference is missing for ${asset.publicId}`,
        400,
        "RESTORE_CLOUDINARY_FILE_REFERENCE_MISSING",
      );
    }

    const assetPath = path.resolve(
      assetsDirectory,
      asset.backupFile,
    );

    if (
      !isPathInsideDirectory(
        assetsDirectory,
        assetPath,
      )
    ) {
      throw createServiceError(
        `Unsafe asset path detected for ${asset.publicId}`,
        400,
        "RESTORE_UNSAFE_CLOUDINARY_PATH",
      );
    }

    const stats = await fsPromises
      .stat(assetPath)
      .catch(() => null);

    if (!stats?.isFile()) {
      throw createServiceError(
        `Backup file is missing for ${asset.publicId}`,
        400,
        "RESTORE_CLOUDINARY_ASSET_MISSING",
      );
    }
  }

  return manifest;
};

// ==================== Validate Backup Package ====================

const validateBackupPackage = async (
  zipFilePath,
) => {
  let restoreDirectory = null;

  try {
    restoreDirectory =
      await extractBackupArchive(
        zipFilePath,
      );

    await validateRequiredBackupFiles(
      restoreDirectory,
    );

    const backupInfo =
      await validateBackupInformation(
        restoreDirectory,
      );

    const databaseArchivePath =
      await validateMongoArchive(
        restoreDirectory,
      );

    const cloudinaryManifest =
      await validateCloudinaryManifest(
        restoreDirectory,
      );

    return {
      restoreDirectory,
      backupInfo,
      databaseArchivePath,
      cloudinaryManifest,
    };
  } catch (error) {
    if (restoreDirectory) {
      await removeDirectorySafely(
        restoreDirectory,
      );
    }

    throw error;
  }
};

// ==================== Run Command ====================

const runCommand = ({
  command,
  args,
  errorMessage,
  errorCode,
}) => {
  return new Promise(
    (resolve, reject) => {
      const child = spawn(
        command,
        args,
        {
          windowsHide: true,
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
        },
      );

      let stdout = "";
      let stderr = "";
      let settled = false;

      child.stdout.on(
        "data",
        (data) => {
          stdout += data.toString();
        },
      );

      child.stderr.on(
        "data",
        (data) => {
          stderr += data.toString();
        },
      );

      child.on(
        "error",
        (error) => {
          if (settled) return;

          settled = true;

          if (
            error.code === "ENOENT"
          ) {
            reject(
              createServiceError(
                `${command} is not installed or is not available in PATH`,
                500,
                `${errorCode}_COMMAND_NOT_FOUND`,
              ),
            );

            return;
          }

          reject(error);
        },
      );

      child.on(
        "close",
        (code) => {
          if (settled) return;

          settled = true;

          if (code !== 0) {
            reject(
              createServiceError(
                stderr.trim() ||
                  errorMessage,
                500,
                errorCode,
              ),
            );

            return;
          }

          resolve({
            stdout,
            stderr,
          });
        },
      );
    },
  );
};

// ==================== Restore MongoDB ====================

const restoreMongoDatabase = async ({
  databaseArchivePath,
  dropExisting = true,
}) => {
  const args = [
    `--uri=${process.env.MONGODB_URI}`,
    `--archive=${databaseArchivePath}`,
    "--gzip",
    "--stopOnError",
  ];

  if (dropExisting) {
    args.push("--drop");
  }

  await runCommand({
    command: "mongorestore",
    args,
    errorMessage:
      "Failed to restore MongoDB database",
    errorCode:
      "MONGODB_RESTORE_FAILED",
  });

  return {
    restored: true,
  };
};

// ==================== Build Cloudinary Upload Options ====================

const buildCloudinaryUploadOptions = (
  asset,
) => {
  const options = {
    public_id: asset.publicId,
    resource_type:
      asset.resourceType || "image",
    type:
      asset.deliveryType || "upload",
    overwrite: true,
  };

  if (
    Array.isArray(asset.tags) &&
    asset.tags.length > 0
  ) {
    options.tags = asset.tags;
  }

  if (
    asset.context &&
    typeof asset.context === "object"
  ) {
    options.context =
      asset.context.custom ||
      asset.context;
  }

  if (
    asset.metadata &&
    typeof asset.metadata === "object"
  ) {
    options.metadata =
      asset.metadata;
  }

  if (asset.displayName) {
    options.display_name =
      asset.displayName;
  }

  return options;
};

// ==================== Restore Cloudinary Asset ====================

const restoreCloudinaryAsset = async ({
  asset,
  restoreDirectory,
}) => {
  const assetsDirectory = path.resolve(
    restoreDirectory,
    "cloudinary",
    "assets",
  );

  const assetFilePath = path.resolve(
    assetsDirectory,
    asset.backupFile,
  );

  if (
    !isPathInsideDirectory(
      assetsDirectory,
      assetFilePath,
    )
  ) {
    throw createServiceError(
      `Unsafe asset path detected for ${asset.publicId}`,
      400,
      "RESTORE_UNSAFE_CLOUDINARY_PATH",
    );
  }

  const options =
    buildCloudinaryUploadOptions(
      asset,
    );

  const result =
    await cloudinary.uploader.upload(
      assetFilePath,
      options,
    );

  return {
    publicId:
      result.public_id,

    resourceType:
      result.resource_type,

    deliveryType:
      result.type,

    format:
      result.format || null,

    secureUrl:
      result.secure_url || null,

    version:
      result.version || null,

    bytes:
      result.bytes || null,
  };
};

// ==================== Restore Cloudinary Assets ====================

const restoreCloudinaryAssets = async ({
  manifest,
  restoreDirectory,
  onProgress,
}) => {
  configureCloudinary();

  const resources =
    manifest.resources || [];

  const restoredAssets = [];
  const failedAssets = [];

  for (
    let index = 0;
    index < resources.length;
    index += 1
  ) {
    const asset = resources[index];

    try {
      const result =
        await restoreCloudinaryAsset({
          asset,
          restoreDirectory,
        });

      restoredAssets.push(result);

      if (onProgress) {
        onProgress({
          stage: "cloudinary",
          status: "restoring",
          current: index + 1,
          total: resources.length,
          publicId: asset.publicId,
        });
      }
    } catch (error) {
      failedAssets.push({
        publicId:
          asset.publicId,

        resourceType:
          asset.resourceType,

        message:
          error.message,
      });
    }
  }

  if (failedAssets.length > 0) {
    const error = createServiceError(
      `Cloudinary restore incomplete. ${failedAssets.length} asset(s) failed to restore.`,
      500,
      "CLOUDINARY_RESTORE_INCOMPLETE",
    );

    error.failures =
      failedAssets;

    throw error;
  }

  return {
    totalAssets:
      resources.length,

    restoredAssets:
      restoredAssets.length,

    failedAssets: 0,
  };
};

// ==================== Restore Full Backup ====================

const restoreFullBackup = async ({
  zipFilePath,
  dropExisting = true,
  onProgress,
}) => {
  validateRestoreConfiguration();

  let packageData = null;

  try {
    // ==================== Validate Backup ====================

    if (onProgress) {
      onProgress({
        stage: "validation",
        status: "started",
      });
    }

    packageData =
      await validateBackupPackage(
        zipFilePath,
      );

    if (onProgress) {
      onProgress({
        stage: "validation",
        status: "completed",
      });
    }

    // ==================== Restore MongoDB ====================

    if (onProgress) {
      onProgress({
        stage: "mongodb",
        status: "started",
      });
    }

    const mongoResult =
      await restoreMongoDatabase({
        databaseArchivePath:
          packageData.databaseArchivePath,
        dropExisting,
      });

    if (onProgress) {
      onProgress({
        stage: "mongodb",
        status: "completed",
      });
    }

    // ==================== Restore Cloudinary ====================

    if (onProgress) {
      onProgress({
        stage: "cloudinary",
        status: "started",
        total:
          packageData
            .cloudinaryManifest
            .resources.length,
      });
    }

    const cloudinaryResult =
      await restoreCloudinaryAssets({
        manifest:
          packageData.cloudinaryManifest,

        restoreDirectory:
          packageData.restoreDirectory,

        onProgress,
      });

    if (onProgress) {
      onProgress({
        stage: "cloudinary",
        status: "completed",
      });
    }

    // ==================== Result ====================

    return {
      success: true,

      restoredAt:
        new Date().toISOString(),

      backup: {
        version:
          packageData.backupInfo.version,

        application:
          packageData.backupInfo
            .application || "LSA",

        createdAt:
          packageData.backupInfo
            .createdAt || null,
      },

      mongodb: {
        restored:
          mongoResult.restored,
      },

      cloudinary: {
        totalAssets:
          cloudinaryResult.totalAssets,

        restoredAssets:
          cloudinaryResult
            .restoredAssets,

        failedAssets:
          cloudinaryResult
            .failedAssets,
      },
    };
  } finally {
    if (
      packageData?.restoreDirectory
    ) {
      await removeDirectorySafely(
        packageData.restoreDirectory,
      );
    }
  }
};

// ==================== Inspect Backup ====================

const inspectBackup = async (
  zipFilePath,
) => {
  let packageData = null;

  try {
    packageData =
      await validateBackupPackage(
        zipFilePath,
      );

    return {
      valid: true,

      version:
        packageData.backupInfo.version,

      application:
        packageData.backupInfo
          .application || "LSA",

      createdAt:
        packageData.backupInfo
          .createdAt || null,

      database: {
        included: true,
      },

      cloudinary: {
        included: true,

        assetCount:
          packageData
            .cloudinaryManifest
            .resources.length,
      },
    };
  } finally {
    if (
      packageData?.restoreDirectory
    ) {
      await removeDirectorySafely(
        packageData.restoreDirectory,
      );
    }
  }
};

// ==================== Cleanup Restore Upload ====================

const cleanupRestoreUpload = async (
  filePath,
) => {
  await removeFileSafely(
    filePath,
  );
};

// ==================== Exports ====================

module.exports = {
  validateBackupPackage,
  inspectBackup,
  restoreMongoDatabase,
  restoreCloudinaryAssets,
  restoreFullBackup,
  cleanupRestoreUpload,
};