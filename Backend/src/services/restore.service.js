const { spawn } = require("child_process");
const fs = require("fs");
const fsPromises = require("fs/promises");
const os = require("os");
const path = require("path");
const unzipper = require("unzipper");
const cloudinary = require("cloudinary").v2;

// ==================== Constants ====================

const SUPPORTED_BACKUP_VERSION = 1;

const CLOUDINARY_BACKUP_FOLDER = "lsa";
const CLOUDINARY_BACKUP_PREFIX = `${CLOUDINARY_BACKUP_FOLDER}/`;

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
  if (!process.env.MONGODB_URL) {
    throw createServiceError(
      "MongoDB connection string is not configured",
      500,
      "RESTORE_MONGODB_URL_MISSING",
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
  if (!directoryPath) {
    return;
  }

  try {
    await fsPromises.rm(directoryPath, {
      recursive: true,
      force: true,
    });
  } catch (error) {
    console.error(
      "[Restore] Failed to remove temporary restore directory:",
      error,
    );
  }
};

// ==================== Remove File Safely ====================

const removeFileSafely = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fsPromises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(
        "[Restore] Failed to remove temporary restore file:",
        error,
      );
    }
  }
};

// ==================== Check Path Inside Directory ====================

const isPathInsideDirectory = (
  parentDirectory,
  childPath,
) => {
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

const readJsonFile = async (
  filePath,
  errorCode,
) => {
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

// ==================== Validate Cloudinary Public ID ====================

const isCloudinaryAssetInsideLSAFolder = (
  asset,
) => {
  const publicId = asset?.publicId;

  if (typeof publicId !== "string") {
    return false;
  }

  return publicId.startsWith(
    CLOUDINARY_BACKUP_PREFIX,
  );
};

// ==================== Extract Backup Archive ====================

const extractBackupArchive = async (
  zipFilePath,
) => {
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

  if (fileStats.size === 0) {
    throw createServiceError(
      "Backup ZIP file is empty",
      400,
      "RESTORE_FILE_EMPTY",
    );
  }

  const restoreDirectory =
    await fsPromises.mkdtemp(
      path.join(
        os.tmpdir(),
        "lsa-restore-",
      ),
    );

  try {
    const archive =
      await unzipper.Open.file(
        zipFilePath,
      );

    if (!archive.files.length) {
      throw createServiceError(
        "Backup ZIP archive is empty",
        400,
        "RESTORE_EMPTY_ARCHIVE",
      );
    }

    for (
      const entry of archive.files
    ) {
      const normalizedPath =
        entry.path
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");

      if (!normalizedPath) {
        continue;
      }

      const destinationPath =
        path.resolve(
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

      if (
        entry.type === "Directory"
      ) {
        await fsPromises.mkdir(
          destinationPath,
          {
            recursive: true,
          },
        );

        continue;
      }

      await fsPromises.mkdir(
        path.dirname(
          destinationPath,
        ),
        {
          recursive: true,
        },
      );

      await new Promise(
        (resolve, reject) => {
          const input =
            entry.stream();

          const output =
            fs.createWriteStream(
              destinationPath,
            );

          input.on(
            "error",
            reject,
          );

          output.on(
            "error",
            reject,
          );

          output.on(
            "finish",
            resolve,
          );

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

// ==================== Validate Required Backup Files ====================

const validateRequiredBackupFiles =
  async (
    restoreDirectory,
  ) => {
    for (
      const relativePath of
      REQUIRED_BACKUP_FILES
    ) {
      const filePath =
        path.join(
          restoreDirectory,
          relativePath,
        );

      const stats =
        await fsPromises
          .stat(filePath)
          .catch(() => null);

      if (!stats?.isFile()) {
        throw createServiceError(
          `Backup is missing required file: ${relativePath}`,
          400,
          "RESTORE_BACKUP_FILE_MISSING",
        );
      }

      if (stats.size === 0) {
        throw createServiceError(
          `Backup file is empty: ${relativePath}`,
          400,
          "RESTORE_BACKUP_FILE_EMPTY",
        );
      }
    }
  };

// ==================== Validate Backup Information ====================

const validateBackupInformation =
  async (
    restoreDirectory,
  ) => {
    const filePath =
      path.join(
        restoreDirectory,
        "backup-info.json",
      );

    const backupInfo =
      await readJsonFile(
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
      backupInfo.application !==
        "LSA"
    ) {
      throw createServiceError(
        "This backup does not belong to the LSA application",
        400,
        "RESTORE_INVALID_APPLICATION",
      );
    }

    if (
      !backupInfo.database?.included
    ) {
      throw createServiceError(
        "Backup does not contain MongoDB data",
        400,
        "RESTORE_DATABASE_NOT_INCLUDED",
      );
    }

    if (
      !backupInfo.cloudinary?.included
    ) {
      throw createServiceError(
        "Backup does not contain Cloudinary assets",
        400,
        "RESTORE_CLOUDINARY_NOT_INCLUDED",
      );
    }

    /*
     * إذا كان ملف الباكب الجديد يحتوي على
     * cloudinary.folder
     * نتأكد أنه lsa.
     *
     * تركنا الشرط اختياريًا حتى لا نكسر
     * الباكبات القديمة Version 1.
     */
    if (
      backupInfo.cloudinary.folder &&
      backupInfo.cloudinary.folder !==
        CLOUDINARY_BACKUP_FOLDER
    ) {
      throw createServiceError(
        `Cloudinary backup folder must be "${CLOUDINARY_BACKUP_FOLDER}"`,
        400,
        "RESTORE_INVALID_CLOUDINARY_FOLDER",
      );
    }

    return backupInfo;
  };

// ==================== Validate MongoDB Archive ====================

const validateMongoArchive = async (
  restoreDirectory,
) => {
  const archivePath =
    path.join(
      restoreDirectory,
      "database",
      "mongodb.archive.gz",
    );

  const stats =
    await fsPromises
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

const validateCloudinaryManifest =
  async (
    restoreDirectory,
  ) => {
    const manifestPath =
      path.join(
        restoreDirectory,
        "cloudinary",
        "manifest.json",
      );

    const manifest =
      await readJsonFile(
        manifestPath,
        "RESTORE_INVALID_CLOUDINARY_MANIFEST",
      );

    if (
      !Array.isArray(
        manifest.resources,
      )
    ) {
      throw createServiceError(
        "Cloudinary manifest resources are invalid",
        400,
        "RESTORE_INVALID_CLOUDINARY_RESOURCES",
      );
    }

    /*
     * الباكب الجديد يحتوي على backupFolder.
     */
    if (
      manifest.backupFolder &&
      manifest.backupFolder !==
        CLOUDINARY_BACKUP_FOLDER
    ) {
      throw createServiceError(
        `Cloudinary manifest folder must be "${CLOUDINARY_BACKUP_FOLDER}"`,
        400,
        "RESTORE_INVALID_CLOUDINARY_MANIFEST_FOLDER",
      );
    }

    const assetsDirectory =
      path.resolve(
        restoreDirectory,
        "cloudinary",
        "assets",
      );

    for (
      const asset of
      manifest.resources
    ) {
      if (!asset.publicId) {
        throw createServiceError(
          "Cloudinary manifest contains an asset without publicId",
          400,
          "RESTORE_CLOUDINARY_PUBLIC_ID_MISSING",
        );
      }

      /*
       * أهم حماية:
       *
       * لا نسمح للـ Restore برفع أي Asset
       * لا يبدأ بـ lsa/
       */
      if (
        !isCloudinaryAssetInsideLSAFolder(
          asset,
        )
      ) {
        throw createServiceError(
          `Cloudinary asset is outside "${CLOUDINARY_BACKUP_FOLDER}" folder: ${asset.publicId}`,
          400,
          "RESTORE_CLOUDINARY_ASSET_OUTSIDE_LSA_FOLDER",
        );
      }

      if (!asset.backupFile) {
        throw createServiceError(
          `Backup file reference is missing for ${asset.publicId}`,
          400,
          "RESTORE_CLOUDINARY_FILE_REFERENCE_MISSING",
        );
      }

      const assetPath =
        path.resolve(
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

      const stats =
        await fsPromises
          .stat(assetPath)
          .catch(() => null);

      if (!stats?.isFile()) {
        throw createServiceError(
          `Backup file is missing for ${asset.publicId}`,
          400,
          "RESTORE_CLOUDINARY_ASSET_MISSING",
        );
      }

      if (stats.size === 0) {
        throw createServiceError(
          `Backup file is empty for ${asset.publicId}`,
          400,
          "RESTORE_CLOUDINARY_ASSET_EMPTY",
        );
      }
    }

    return manifest;
  };

// ==================== Validate Backup Package ====================

const validateBackupPackage =
  async (
    zipFilePath,
  ) => {
    let restoreDirectory =
      null;

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
  args = [],
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
          stdout +=
            data.toString();
        },
      );

      child.stderr.on(
        "data",
        (data) => {
          stderr +=
            data.toString();
        },
      );

      child.on(
        "error",
        (error) => {
          if (settled) {
            return;
          }

          settled = true;

          if (
            error.code ===
            "ENOENT"
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
          if (settled) {
            return;
          }

          settled = true;

          if (code !== 0) {
            reject(
              createServiceError(
                stderr.trim() ||
                  errorMessage ||
                  `${command} failed`,
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

const restoreMongoDatabase =
  async ({
    databaseArchivePath,
    dropExisting = true,
  }) => {
    console.log(
      "[Restore] Starting MongoDB restore...",
    );

    const args = [
      `--uri=${process.env.MONGODB_URL}`,
      `--archive=${databaseArchivePath}`,
      "--gzip",
      "--stopOnError",
    ];

    if (dropExisting) {
      args.push("--drop");
    }

    await runCommand({
      command:
        "mongorestore",

      args,

      errorMessage:
        "Failed to restore MongoDB database",

      errorCode:
        "MONGODB_RESTORE_FAILED",
    });

    console.log(
      "[Restore] MongoDB restore completed successfully",
    );

    return {
      restored: true,
      dropExisting,
    };
  };

// ==================== Build Cloudinary Upload Options ====================

const buildCloudinaryUploadOptions = (
  asset,
) => {
  if (
    !isCloudinaryAssetInsideLSAFolder(
      asset,
    )
  ) {
    throw createServiceError(
      `Cloudinary asset is outside "${CLOUDINARY_BACKUP_FOLDER}" folder: ${asset.publicId}`,
      400,
      "RESTORE_CLOUDINARY_ASSET_OUTSIDE_LSA_FOLDER",
    );
  }

  const options = {
    /*
     * نحافظ على نفس public_id:
     *
     * lsa/projects/...
     * lsa/services/...
     * lsa/equipment/...
     */
    public_id:
      asset.publicId,

    resource_type:
      asset.resourceType ||
      "image",

    type:
      asset.deliveryType ||
      "upload",

    overwrite: true,

    /*
     * لا نريد public_id عشوائي.
     */
    unique_filename:
      false,

    use_filename:
      false,

    /*
     * مهم عند overwrite.
     */
    invalidate:
      true,
  };

  if (
    Array.isArray(
      asset.tags,
    ) &&
    asset.tags.length > 0
  ) {
    options.tags =
      asset.tags;
  }

  if (
    asset.context &&
    typeof asset.context ===
      "object"
  ) {
    options.context =
      asset.context.custom ||
      asset.context;
  }

  if (
    asset.metadata &&
    typeof asset.metadata ===
      "object"
  ) {
    options.metadata =
      asset.metadata;
  }

  /*
   * display_name لا تدعمه جميع الحالات
   * بنفس الشكل، لذلك نرسله فقط إذا كان موجودًا.
   */
  if (asset.displayName) {
    options.display_name =
      asset.displayName;
  }

  return options;
};

// ==================== Restore Single Cloudinary Asset ====================

const restoreCloudinaryAsset =
  async ({
    asset,
    restoreDirectory,
  }) => {
    /*
     * حماية ثانية قبل الرفع.
     */
    if (
      !isCloudinaryAssetInsideLSAFolder(
        asset,
      )
    ) {
      throw createServiceError(
        `Refusing to restore asset outside "${CLOUDINARY_BACKUP_FOLDER}" folder: ${asset.publicId}`,
        400,
        "RESTORE_CLOUDINARY_ASSET_OUTSIDE_LSA_FOLDER",
      );
    }

    const assetsDirectory =
      path.resolve(
        restoreDirectory,
        "cloudinary",
        "assets",
      );

    const assetFilePath =
      path.resolve(
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

    const fileStats =
      await fsPromises
        .stat(assetFilePath)
        .catch(() => null);

    if (
      !fileStats?.isFile() ||
      fileStats.size === 0
    ) {
      throw createServiceError(
        `Backup asset file is missing or empty for ${asset.publicId}`,
        400,
        "RESTORE_CLOUDINARY_ASSET_MISSING",
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

    /*
     * حماية أخيرة:
     * نتأكد أن Cloudinary رجع نفس public_id المتوقع.
     */
    if (
      !result.public_id?.startsWith(
        CLOUDINARY_BACKUP_PREFIX,
      )
    ) {
      throw createServiceError(
        `Cloudinary restored asset outside "${CLOUDINARY_BACKUP_FOLDER}" folder`,
        500,
        "RESTORE_CLOUDINARY_INVALID_RESULT_PATH",
      );
    }

    return {
      publicId:
        result.public_id,

      resourceType:
        result.resource_type,

      deliveryType:
        result.type,

      format:
        result.format ||
        null,

      secureUrl:
        result.secure_url ||
        null,

      version:
        result.version ||
        null,

      bytes:
        result.bytes ||
        null,
    };
  };

// ==================== Restore Cloudinary Assets ====================

const restoreCloudinaryAssets =
  async ({
    manifest,
    restoreDirectory,
    onProgress,
  }) => {
    configureCloudinary();

    const allResources =
      Array.isArray(
        manifest.resources,
      )
        ? manifest.resources
        : [];

    /*
     * حتى لو تم التلاعب بالـ manifest،
     * نأخذ lsa فقط.
     */
    const resources =
      allResources.filter(
        isCloudinaryAssetInsideLSAFolder,
      );

    if (
      resources.length !==
      allResources.length
    ) {
      throw createServiceError(
        `Backup contains Cloudinary assets outside "${CLOUDINARY_BACKUP_FOLDER}" folder`,
        400,
        "RESTORE_CLOUDINARY_INVALID_FOLDER_CONTENT",
      );
    }

    console.log(
      `[Restore] Starting Cloudinary restore for folder "${CLOUDINARY_BACKUP_FOLDER}"...`,
    );

    console.log(
      `[Restore] Assets to restore: ${resources.length}`,
    );

    const restoredAssets =
      [];

    const failedAssets =
      [];

    for (
      let index = 0;
      index < resources.length;
      index += 1
    ) {
      const asset =
        resources[index];

      try {
        console.log(
          `[Restore] Cloudinary ${index + 1}/${resources.length}: ${asset.publicId}`,
        );

        const result =
          await restoreCloudinaryAsset({
            asset,
            restoreDirectory,
          });

        restoredAssets.push(
          result,
        );

        if (onProgress) {
          onProgress({
            stage:
              "cloudinary",

            status:
              "restoring",

            current:
              index + 1,

            total:
              resources.length,

            publicId:
              asset.publicId,
          });
        }
      } catch (error) {
        console.error(
          `[Restore] Failed Cloudinary asset: ${asset.publicId}`,
          error.message,
        );

        failedAssets.push({
          publicId:
            asset.publicId ||
            null,

          resourceType:
            asset.resourceType ||
            null,

          message:
            error.message,
        });
      }
    }

    if (
      failedAssets.length > 0
    ) {
      const error =
        createServiceError(
          `Cloudinary restore incomplete. ${failedAssets.length} asset(s) failed to restore.`,
          500,
          "CLOUDINARY_RESTORE_INCOMPLETE",
        );

      error.failures =
        failedAssets;

      throw error;
    }

    console.log(
      `[Restore] Cloudinary folder "${CLOUDINARY_BACKUP_FOLDER}" restored successfully: ${restoredAssets.length} assets`,
    );

    return {
      folder:
        CLOUDINARY_BACKUP_FOLDER,

      totalAssets:
        resources.length,

      restoredAssets:
        restoredAssets.length,

      failedAssets: 0,
    };
  };

// ==================== Restore Full Backup ====================

const restoreFullBackup =
  async ({
    zipFilePath,
    dropExisting = true,
    onProgress,
  }) => {
    validateRestoreConfiguration();

    let packageData =
      null;

    try {
      console.log(
        "====================================",
      );

      console.log(
        "[Restore] Starting full restore...",
      );

      console.log(
        "[Restore] Backup file:",
        zipFilePath,
      );

      // ==================== Validate Backup ====================

      console.log(
        "[Restore] Validating backup package...",
      );

      if (onProgress) {
        onProgress({
          stage:
            "validation",

          status:
            "started",
        });
      }

      packageData =
        await validateBackupPackage(
          zipFilePath,
        );

      if (onProgress) {
        onProgress({
          stage:
            "validation",

          status:
            "completed",
        });
      }

      console.log(
        "[Restore] Backup validation completed",
      );

      console.log(
        "[Restore] Backup created at:",
        packageData.backupInfo
          .createdAt ||
          "unknown",
      );

      console.log(
        "[Restore] Cloudinary folder:",
        packageData.backupInfo
          .cloudinary?.folder ||
          CLOUDINARY_BACKUP_FOLDER,
      );

      console.log(
        "[Restore] Cloudinary assets:",
        packageData
          .cloudinaryManifest
          .resources.length,
      );

      // ==================== Restore MongoDB ====================

      if (onProgress) {
        onProgress({
          stage:
            "mongodb",

          status:
            "started",
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
          stage:
            "mongodb",

          status:
            "completed",
        });
      }

      // ==================== Restore Cloudinary ====================

      if (onProgress) {
        onProgress({
          stage:
            "cloudinary",

          status:
            "started",

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
          stage:
            "cloudinary",

          status:
            "completed",

          total:
            cloudinaryResult.totalAssets,
        });
      }

      // ==================== Result ====================

      console.log(
        "[Restore] Full restore completed successfully",
      );

      console.log(
        "[Restore] MongoDB: restored",
      );

      console.log(
        `[Restore] Cloudinary "${CLOUDINARY_BACKUP_FOLDER}": ${cloudinaryResult.restoredAssets} assets restored`,
      );

      console.log(
        "====================================",
      );

      return {
        success: true,

        restoredAt:
          new Date().toISOString(),

        backup: {
          version:
            packageData.backupInfo
              .version,

          application:
            packageData.backupInfo
              .application ||
            "LSA",

          createdAt:
            packageData.backupInfo
              .createdAt ||
            null,
        },

        mongodb: {
          restored:
            mongoResult.restored,

          dropExisting:
            mongoResult.dropExisting,
        },

        cloudinary: {
          folder:
            CLOUDINARY_BACKUP_FOLDER,

          totalAssets:
            cloudinaryResult.totalAssets,

          restoredAssets:
            cloudinaryResult.restoredAssets,

          failedAssets:
            cloudinaryResult.failedAssets,
        },
      };
    } catch (error) {
      console.error(
        "====================================",
      );

      console.error(
        "[Restore] FAILED",
      );

      console.error(
        "Message:",
        error.message,
      );

      console.error(
        "Code:",
        error.code,
      );

      console.error(
        "Status:",
        error.statusCode,
      );

      console.error(
        "Stack:",
        error.stack,
      );

      if (error.failures) {
        console.error(
          "Cloudinary failures:",
          JSON.stringify(
            error.failures,
            null,
            2,
          ),
        );
      }

      console.error(
        "====================================",
      );

      throw error;
    } finally {
      if (
        packageData
          ?.restoreDirectory
      ) {
        console.log(
          "[Restore] Cleaning temporary restore directory...",
        );

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
  let packageData =
    null;

  try {
    packageData =
      await validateBackupPackage(
        zipFilePath,
      );

    const resources =
      packageData
        .cloudinaryManifest
        .resources;

    return {
      valid: true,

      version:
        packageData.backupInfo
          .version,

      application:
        packageData.backupInfo
          .application ||
        "LSA",

      createdAt:
        packageData.backupInfo
          .createdAt ||
        null,

      database: {
        included: true,
      },

      cloudinary: {
        included: true,

        folder:
          CLOUDINARY_BACKUP_FOLDER,

        assetCount:
          resources.length,

        allAssetsInsideFolder:
          resources.every(
            isCloudinaryAssetInsideLSAFolder,
          ),
      },
    };
  } finally {
    if (
      packageData
        ?.restoreDirectory
    ) {
      await removeDirectorySafely(
        packageData.restoreDirectory,
      );
    }
  }
};

// ==================== Cleanup Restore Upload ====================

const cleanupRestoreUpload =
  async (
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