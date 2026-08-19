const { spawn } = require("child_process");
const fs = require("fs");
const fsPromises = require("fs/promises");
const os = require("os");
const path = require("path");
const { Readable } = require("stream");

const archiverModule = require("archiver");
const cloudinary = require("cloudinary").v2;

// ==================== Create ZIP Archiver ====================

const createZipArchiver = (options = {}) => {
  // archiver <= 7
  if (typeof archiverModule === "function") {
    return archiverModule("zip", options);
  }

  // CommonJS / ESM compatibility
  if (typeof archiverModule.default === "function") {
    return archiverModule.default("zip", options);
  }

  // archiver >= 8
  if (typeof archiverModule.ZipArchive === "function") {
    return new archiverModule.ZipArchive(options);
  }

  throw new TypeError(
    "Unsupported archiver export. Expected a factory function or ZipArchive class.",
  );
};

// ==================== Constants ====================

const BACKUP_VERSION = 1;

/**
 * Only assets whose public_id begins with:
 *
 * lsa/
 *
 * will be included in the Cloudinary backup.
 */
const CLOUDINARY_BACKUP_FOLDER = "lsa";

const CLOUDINARY_RESOURCE_TYPES = [
  "image",
  "video",
  "raw",
];

const CLOUDINARY_DELIVERY_TYPES = [
  "upload",
];

const CLOUDINARY_PAGE_SIZE = 500;

// ==================== Create Service Error ====================

const createServiceError = (
  message,
  statusCode = 500,
  code = "BACKUP_ERROR",
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

// ==================== Validate Backup Configuration ====================

const validateBackupConfiguration = () => {
  if (!process.env.MONGODB_URL) {
    throw createServiceError(
      "MongoDB connection string is not configured",
      500,
      "BACKUP_MONGODB_URL_MISSING",
    );
  }

  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw createServiceError(
      "Cloudinary cloud name is not configured",
      500,
      "BACKUP_CLOUDINARY_CLOUD_NAME_MISSING",
    );
  }

  if (!process.env.CLOUDINARY_API_KEY) {
    throw createServiceError(
      "Cloudinary API key is not configured",
      500,
      "BACKUP_CLOUDINARY_API_KEY_MISSING",
    );
  }

  if (!process.env.CLOUDINARY_API_SECRET) {
    throw createServiceError(
      "Cloudinary API secret is not configured",
      500,
      "BACKUP_CLOUDINARY_API_SECRET_MISSING",
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

// ==================== Create Backup Timestamp ====================

const createBackupTimestamp = () => {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
};

// ==================== Create Temporary Backup Directory ====================

const createTemporaryBackupDirectory = async () => {
  const timestamp = createBackupTimestamp();

  const rootDirectory =
    await fsPromises.mkdtemp(
      path.join(
        os.tmpdir(),
        `lsa-backup-${timestamp}-`,
      ),
    );

  const databaseDirectory = path.join(
    rootDirectory,
    "database",
  );

  const cloudinaryDirectory = path.join(
    rootDirectory,
    "cloudinary",
  );

  const assetsDirectory = path.join(
    cloudinaryDirectory,
    "assets",
  );

  await fsPromises.mkdir(
    databaseDirectory,
    {
      recursive: true,
    },
  );

  await fsPromises.mkdir(
    assetsDirectory,
    {
      recursive: true,
    },
  );

  return {
    timestamp,
    rootDirectory,
    databaseDirectory,
    cloudinaryDirectory,
    assetsDirectory,
  };
};

// ==================== Run System Command ====================

const runCommand = ({
  command,
  args = [],
  errorMessage,
  errorCode,
}) => {
  return new Promise((resolve, reject) => {
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

        if (error.code === "ENOENT") {
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
  });
};

// ==================== Create MongoDB Backup ====================

const createMongoBackup = async ({
  databaseDirectory,
}) => {
  const mongoArchivePath = path.join(
    databaseDirectory,
    "mongodb.archive.gz",
  );

  await runCommand({
    command: "mongodump",

    args: [
      `--uri=${process.env.MONGODB_URL}`,
      `--archive=${mongoArchivePath}`,
      "--gzip",
    ],

    errorMessage:
      "Failed to create MongoDB backup",

    errorCode:
      "MONGODB_BACKUP_FAILED",
  });

  const stats = await fsPromises
    .stat(mongoArchivePath)
    .catch(() => null);

  if (
    !stats?.isFile() ||
    stats.size === 0
  ) {
    throw createServiceError(
      "MongoDB backup file is empty or was not created",
      500,
      "MONGODB_BACKUP_EMPTY",
    );
  }

  return {
    fileName:
      "mongodb.archive.gz",

    filePath:
      mongoArchivePath,

    size:
      stats.size,
  };
};

// ==================== Get Cloudinary Folder Prefix ====================

const getCloudinaryFolderPrefix = () => {
  return `${CLOUDINARY_BACKUP_FOLDER}/`;
};

// ==================== Get Cloudinary Resources Page ====================

const getCloudinaryResourcesPage = async ({
  resourceType,
  deliveryType,
  nextCursor,
}) => {
  const folderPrefix =
    getCloudinaryFolderPrefix();

  const options = {
    resource_type:
      resourceType,

    type:
      deliveryType,

    /*
     * IMPORTANT:
     *
     * Only request files whose public_id
     * starts with:
     *
     * lsa/
     */
    prefix:
      folderPrefix,

    max_results:
      CLOUDINARY_PAGE_SIZE,

    tags:
      true,

    context:
      true,
  };

  if (nextCursor) {
    options.next_cursor =
      nextCursor;
  }

  return cloudinary.api.resources(
    options,
  );
};

// ==================== Validate Resource Belongs To LSA Folder ====================

const isResourceInsideBackupFolder = (
  resource,
) => {
  const folderPrefix =
    getCloudinaryFolderPrefix();

  const publicId =
    resource?.public_id;

  if (
    typeof publicId !== "string"
  ) {
    return false;
  }

  return publicId.startsWith(
    folderPrefix,
  );
};

// ==================== Get All Cloudinary Resources ====================

const getAllCloudinaryResources =
  async () => {
    const resources = [];

    for (
      const resourceType of
      CLOUDINARY_RESOURCE_TYPES
    ) {
      for (
        const deliveryType of
        CLOUDINARY_DELIVERY_TYPES
      ) {
        let nextCursor = null;

        do {
          const response =
            await getCloudinaryResourcesPage({
              resourceType,
              deliveryType,
              nextCursor,
            });

          if (
            Array.isArray(
              response.resources,
            )
          ) {
            /*
             * Extra safety filter.
             *
             * Even though Cloudinary was already
             * queried using prefix: "lsa/",
             * we filter again before backing up.
             */
            const folderResources =
              response.resources.filter(
                isResourceInsideBackupFolder,
              );

            resources.push(
              ...folderResources,
            );
          }

          nextCursor =
            response.next_cursor ||
            null;
        } while (nextCursor);
      }
    }

    return resources;
  };

// ==================== Sanitize Path Segment ====================

const sanitizePathSegment = (
  value,
) => {
  return String(value || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_",
        )
        .replace(
          /^\.+$/,
          "_",
        ),
    )
    .join("/");
};

// ==================== Get Asset Extension ====================

const getCloudinaryAssetExtension = (
  resource,
) => {
  if (
    resource.resource_type ===
    "raw"
  ) {
    const existingExtension =
      path.extname(
        resource.public_id ||
          "",
      );

    if (existingExtension) {
      return "";
    }
  }

  if (resource.format) {
    return `.${resource.format}`;
  }

  try {
    const assetUrl =
      new URL(
        resource.secure_url ||
          resource.url,
      );

    return path.extname(
      assetUrl.pathname,
    );
  } catch {
    return "";
  }
};

// ==================== Generate Asset Backup Path ====================

const generateCloudinaryAssetFilePath =
  ({
    resource,
    assetsDirectory,
  }) => {
    const resourceType =
      sanitizePathSegment(
        resource.resource_type ||
          "unknown",
      );

    const deliveryType =
      sanitizePathSegment(
        resource.type ||
          "upload",
      );

    let publicId =
      sanitizePathSegment(
        resource.public_id ||
          resource.asset_id ||
          "asset",
      );

    const extension =
      getCloudinaryAssetExtension(
        resource,
      );

    if (
      extension &&
      !publicId
        .toLowerCase()
        .endsWith(
          extension.toLowerCase(),
        )
    ) {
      publicId += extension;
    }

    const relativePath =
      path.join(
        resourceType,
        deliveryType,
        publicId,
      );

    const absolutePath =
      path.join(
        assetsDirectory,
        relativePath,
      );

    return {
      relativePath,
      absolutePath,
    };
  };

// ==================== Download File ====================

const downloadFile = async ({
  url,
  destination,
}) => {
  const response =
    await fetch(url);

  if (!response.ok) {
    throw createServiceError(
      `Failed to download Cloudinary asset: ${response.status} ${response.statusText}`,
      502,
      "CLOUDINARY_ASSET_DOWNLOAD_FAILED",
    );
  }

  if (!response.body) {
    throw createServiceError(
      "Cloudinary asset response body is empty",
      502,
      "CLOUDINARY_ASSET_EMPTY_RESPONSE",
    );
  }

  await fsPromises.mkdir(
    path.dirname(destination),
    {
      recursive: true,
    },
  );

  const fileStream =
    fs.createWriteStream(
      destination,
    );

  const readable =
    Readable.fromWeb(
      response.body,
    );

  await new Promise(
    (resolve, reject) => {
      readable.on(
        "error",
        reject,
      );

      fileStream.on(
        "error",
        reject,
      );

      fileStream.on(
        "finish",
        resolve,
      );

      readable.pipe(
        fileStream,
      );
    },
  );
};

// ==================== Create Manifest Item ====================

const createCloudinaryManifestItem =
  ({
    resource,
    relativePath,
    fileSize,
  }) => {
    return {
      assetId:
        resource.asset_id ||
        null,

      publicId:
        resource.public_id,

      resourceType:
        resource.resource_type,

      deliveryType:
        resource.type ||
        "upload",

      format:
        resource.format ||
        null,

      version:
        resource.version ||
        null,

      width:
        resource.width ??
        null,

      height:
        resource.height ??
        null,

      bytes:
        resource.bytes ??
        fileSize ??
        null,

      createdAt:
        resource.created_at ||
        null,

      secureUrl:
        resource.secure_url ||
        null,

      originalFilename:
        resource.original_filename ||
        null,

      folder:
        resource.folder ||
        null,

      assetFolder:
        resource.asset_folder ||
        null,

      displayName:
        resource.display_name ||
        null,

      tags:
        Array.isArray(
          resource.tags,
        )
          ? resource.tags
          : [],

      context:
        resource.context ||
        null,

      metadata:
        resource.metadata ||
        null,

      backupFile:
        relativePath
          .split(path.sep)
          .join("/"),
    };
  };

// ==================== Backup Single Cloudinary Asset ====================

const backupCloudinaryAsset =
  async ({
    resource,
    assetsDirectory,
  }) => {
    if (
      !isResourceInsideBackupFolder(
        resource,
      )
    ) {
      throw createServiceError(
        `Cloudinary asset ${resource.public_id} is outside the allowed backup folder`,
        500,
        "CLOUDINARY_ASSET_OUTSIDE_BACKUP_FOLDER",
      );
    }

    const sourceUrl =
      resource.secure_url ||
      resource.url;

    if (!sourceUrl) {
      throw createServiceError(
        `Cloudinary asset ${resource.public_id} does not have a downloadable URL`,
        500,
        "CLOUDINARY_ASSET_URL_MISSING",
      );
    }

    const {
      relativePath,
      absolutePath,
    } =
      generateCloudinaryAssetFilePath({
        resource,
        assetsDirectory,
      });

    await downloadFile({
      url: sourceUrl,
      destination:
        absolutePath,
    });

    const stats =
      await fsPromises.stat(
        absolutePath,
      );

    return createCloudinaryManifestItem({
      resource,
      relativePath,
      fileSize:
        stats.size,
    });
  };

// ==================== Create Cloudinary Backup ====================

const createCloudinaryBackup =
  async ({
    cloudinaryDirectory,
    assetsDirectory,
    onProgress,
  }) => {
    configureCloudinary();

    console.log(
      `[Backup] Searching Cloudinary folder: ${CLOUDINARY_BACKUP_FOLDER}`,
    );

    const resources =
      await getAllCloudinaryResources();

    console.log(
      `[Backup] Found ${resources.length} asset(s) inside Cloudinary folder "${CLOUDINARY_BACKUP_FOLDER}"`,
    );

    const manifestItems = [];
    const failedAssets = [];

    for (
      let index = 0;
      index < resources.length;
      index += 1
    ) {
      const resource =
        resources[index];

      try {
        const manifestItem =
          await backupCloudinaryAsset({
            resource,
            assetsDirectory,
          });

        manifestItems.push(
          manifestItem,
        );

        console.log(
          `[Backup] Cloudinary ${index + 1}/${resources.length}: ${resource.public_id}`,
        );

        if (onProgress) {
          onProgress({
            stage:
              "cloudinary",

            status:
              "downloading",

            current:
              index + 1,

            total:
              resources.length,

            publicId:
              resource.public_id,
          });
        }
      } catch (error) {
        failedAssets.push({
          publicId:
            resource.public_id ||
            null,

          resourceType:
            resource.resource_type ||
            null,

          deliveryType:
            resource.type ||
            null,

          message:
            error.message,
        });
      }
    }

    const manifest = {
      version:
        BACKUP_VERSION,

      generatedAt:
        new Date().toISOString(),

      backupFolder:
        CLOUDINARY_BACKUP_FOLDER,

      totalAssets:
        resources.length,

      backedUpAssets:
        manifestItems.length,

      failedAssets:
        failedAssets.length,

      resources:
        manifestItems,

      failures:
        failedAssets,
    };

    const manifestPath =
      path.join(
        cloudinaryDirectory,
        "manifest.json",
      );

    await fsPromises.writeFile(
      manifestPath,

      JSON.stringify(
        manifest,
        null,
        2,
      ),

      "utf8",
    );

    if (
      failedAssets.length > 0
    ) {
      const error =
        createServiceError(
          `Cloudinary backup incomplete. ${failedAssets.length} asset(s) failed to download.`,
          500,
          "CLOUDINARY_BACKUP_INCOMPLETE",
        );

      error.failures =
        failedAssets;

      throw error;
    }

    return {
      folder:
        CLOUDINARY_BACKUP_FOLDER,

      totalAssets:
        resources.length,

      backedUpAssets:
        manifestItems.length,

      manifestPath,

      resources:
        manifestItems,
    };
  };

// ==================== Create Backup Information ====================

const createBackupInformation =
  async ({
    rootDirectory,
    mongoBackup,
    cloudinaryBackup,
  }) => {
    const backupInfo = {
      version:
        BACKUP_VERSION,

      application:
        "LSA",

      createdAt:
        new Date().toISOString(),

      database: {
        included:
          true,

        archive:
          "database/mongodb.archive.gz",

        size:
          mongoBackup.size,
      },

      cloudinary: {
        included:
          true,

        folder:
          CLOUDINARY_BACKUP_FOLDER,

        manifest:
          "cloudinary/manifest.json",

        assetCount:
          cloudinaryBackup.totalAssets,
      },
    };

    const backupInfoPath =
      path.join(
        rootDirectory,
        "backup-info.json",
      );

    await fsPromises.writeFile(
      backupInfoPath,

      JSON.stringify(
        backupInfo,
        null,
        2,
      ),

      "utf8",
    );

    return {
      backupInfo,
      backupInfoPath,
    };
  };

// ==================== Create ZIP Archive ====================

const createZipArchive =
  async ({
    sourceDirectory,
    destinationPath,
  }) => {
    await fsPromises.mkdir(
      path.dirname(
        destinationPath,
      ),
      {
        recursive: true,
      },
    );

    return new Promise(
      (resolve, reject) => {
        const output =
          fs.createWriteStream(
            destinationPath,
          );

        const archive =
          createZipArchiver({
            zlib: {
              level: 9,
            },
          });

        let settled = false;

        output.on(
          "close",
          () => {
            if (settled) return;

            settled = true;

            resolve({
              bytes:
                archive.pointer(),
            });
          },
        );

        output.on(
          "error",
          (error) => {
            if (settled) return;

            settled = true;

            reject(error);
          },
        );

        archive.on(
          "warning",
          (error) => {
            if (
              error.code ===
              "ENOENT"
            ) {
              console.warn(
                "Backup archive warning:",
                error,
              );

              return;
            }

            if (!settled) {
              settled = true;

              reject(error);
            }
          },
        );

        archive.on(
          "error",
          (error) => {
            if (settled) return;

            settled = true;

            reject(error);
          },
        );

        archive.pipe(
          output,
        );

        archive.directory(
          sourceDirectory,
          false,
        );

        archive.finalize();
      },
    );
  };

// ==================== Remove Directory Safely ====================

const removeDirectorySafely =
  async (
    directoryPath,
  ) => {
    if (!directoryPath) {
      return;
    }

    try {
      await fsPromises.rm(
        directoryPath,
        {
          recursive: true,
          force: true,
        },
      );
    } catch (error) {
      console.error(
        "Failed to remove temporary backup directory:",
        error,
      );
    }
  };

// ==================== Remove File Safely ====================

const removeFileSafely =
  async (filePath) => {
    if (!filePath) {
      return;
    }

    try {
      await fsPromises.unlink(
        filePath,
      );
    } catch (error) {
      if (
        error.code !==
        "ENOENT"
      ) {
        console.error(
          "Failed to remove temporary backup file:",
          error,
        );
      }
    }
  };

// ==================== Cleanup Backup ====================

const cleanupBackup =
  async ({
    filePath,
    temporaryDirectory,
  }) => {
    await Promise.all([
      removeFileSafely(
        filePath,
      ),

      removeDirectorySafely(
        temporaryDirectory,
      ),
    ]);
  };

// ==================== Create Full Backup ====================

const createFullBackup =
  async ({
    onProgress,
  } = {}) => {
    validateBackupConfiguration();

    let directories = null;
    let finalFilePath = null;

    try {
      console.log(
        "[Backup] Starting full backup...",
      );

      // ==================== Prepare Directories ====================

      directories =
        await createTemporaryBackupDirectory();

      console.log(
        "[Backup] Temporary directory:",
        directories.rootDirectory,
      );

      // ==================== MongoDB Backup ====================

      console.log(
        "[Backup] Starting MongoDB backup...",
      );

      const mongoBackup =
        await createMongoBackup({
          databaseDirectory:
            directories.databaseDirectory,
        });

      console.log(
        "[Backup] MongoDB backup completed:",
        mongoBackup.size,
        "bytes",
      );

      // ==================== Cloudinary Backup ====================

      console.log(
        `[Backup] Starting Cloudinary backup for folder "${CLOUDINARY_BACKUP_FOLDER}"...`,
      );

      const cloudinaryBackup =
        await createCloudinaryBackup({
          cloudinaryDirectory:
            directories.cloudinaryDirectory,

          assetsDirectory:
            directories.assetsDirectory,

          onProgress,
        });

      console.log(
        `[Backup] Cloudinary folder "${CLOUDINARY_BACKUP_FOLDER}" backup completed:`,
        cloudinaryBackup.totalAssets,
        "assets",
      );

      // ==================== Backup Information ====================

      console.log(
        "[Backup] Creating backup info...",
      );

      await createBackupInformation({
        rootDirectory:
          directories.rootDirectory,

        mongoBackup,

        cloudinaryBackup,
      });

      // ==================== Create Final ZIP ====================

      console.log(
        "[Backup] Creating ZIP archive...",
      );

      const fileName =
        `lsa-full-backup-${directories.timestamp}.zip`;

      finalFilePath =
        path.join(
          os.tmpdir(),
          fileName,
        );

      const archiveResult =
        await createZipArchive({
          sourceDirectory:
            directories.rootDirectory,

          destinationPath:
            finalFilePath,
        });

      console.log(
        "[Backup] ZIP completed:",
        archiveResult.bytes,
        "bytes",
      );

      // ==================== Result ====================

      return {
        fileName,

        filePath:
          finalFilePath,

        size:
          archiveResult.bytes,

        temporaryDirectory:
          directories.rootDirectory,

        mongo: {
          size:
            mongoBackup.size,
        },

        cloudinary: {
          folder:
            CLOUDINARY_BACKUP_FOLDER,

          assetCount:
            cloudinaryBackup.totalAssets,
        },
      };
    } catch (error) {
      console.error(
        "====================================",
      );

      console.error(
        "[Backup] FAILED",
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

      if (finalFilePath) {
        await removeFileSafely(
          finalFilePath,
        );
      }

      if (
        directories?.rootDirectory
      ) {
        await removeDirectorySafely(
          directories.rootDirectory,
        );
      }

      throw error;
    }
  };

// ==================== Exports ====================

module.exports = {
  createFullBackup,
  createMongoBackup,
  createCloudinaryBackup,
  cleanupBackup,
  removeFileSafely,
  removeDirectorySafely,
};

// const { spawn } = require("child_process");
// const fs = require("fs");
// const fsPromises = require("fs/promises");
// const os = require("os");
// const path = require("path");
// const { Readable } = require("stream");
// const archiver = require("archiver");
// const cloudinary = require("cloudinary").v2;

// // ==================== Constants ====================

// const BACKUP_VERSION = 1;
// const CLOUDINARY_RESOURCE_TYPES = ["image", "video", "raw"];
// const CLOUDINARY_DELIVERY_TYPES = ["upload"];
// const CLOUDINARY_PAGE_SIZE = 500;

// // ==================== Create Service Error ====================

// const createServiceError = (
//   message,
//   statusCode = 500,
//   code = "BACKUP_ERROR",
// ) => {
//   const error = new Error(message);

//   error.statusCode = statusCode;
//   error.code = code;

//   return error;
// };

// // ==================== Validate Backup Configuration ====================

// const validateBackupConfiguration = () => {
//   if (!process.env.MONGODB_URL) {
//     throw createServiceError(
//       "MongoDB connection string is not configured",
//       500,
//       "BACKUP_MONGODB_URL_MISSING",
//     );
//   }

//   if (!process.env.CLOUDINARY_CLOUD_NAME) {
//     throw createServiceError(
//       "Cloudinary cloud name is not configured",
//       500,
//       "BACKUP_CLOUDINARY_CLOUD_NAME_MISSING",
//     );
//   }

//   if (!process.env.CLOUDINARY_API_KEY) {
//     throw createServiceError(
//       "Cloudinary API key is not configured",
//       500,
//       "BACKUP_CLOUDINARY_API_KEY_MISSING",
//     );
//   }

//   if (!process.env.CLOUDINARY_API_SECRET) {
//     throw createServiceError(
//       "Cloudinary API secret is not configured",
//       500,
//       "BACKUP_CLOUDINARY_API_SECRET_MISSING",
//     );
//   }
// };

// // ==================== Configure Cloudinary ====================

// const configureCloudinary = () => {
//   cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
//     secure: true,
//   });
// };

// // ==================== Create Backup Timestamp ====================

// const createBackupTimestamp = () => {
//   return new Date().toISOString().replace(/[:.]/g, "-");
// };

// // ==================== Create Temporary Backup Directory ====================

// const createTemporaryBackupDirectory = async () => {
//   const timestamp = createBackupTimestamp();

//   const rootDirectory = await fsPromises.mkdtemp(
//     path.join(os.tmpdir(), `lsa-backup-${timestamp}-`),
//   );

//   const databaseDirectory = path.join(rootDirectory, "database");
//   const cloudinaryDirectory = path.join(rootDirectory, "cloudinary");
//   const assetsDirectory = path.join(cloudinaryDirectory, "assets");

//   await fsPromises.mkdir(databaseDirectory, {
//     recursive: true,
//   });

//   await fsPromises.mkdir(assetsDirectory, {
//     recursive: true,
//   });

//   return {
//     timestamp,
//     rootDirectory,
//     databaseDirectory,
//     cloudinaryDirectory,
//     assetsDirectory,
//   };
// };

// // ==================== Run System Command ====================

// const runCommand = ({
//   command,
//   args = [],
//   errorMessage,
//   errorCode,
// }) => {
//   return new Promise((resolve, reject) => {
//     const child = spawn(command, args, {
//       windowsHide: true,
//       stdio: ["ignore", "pipe", "pipe"],
//     });

//     let stdout = "";
//     let stderr = "";
//     let settled = false;

//     child.stdout.on("data", (data) => {
//       stdout += data.toString();
//     });

//     child.stderr.on("data", (data) => {
//       stderr += data.toString();
//     });

//     child.on("error", (error) => {
//       if (settled) return;

//       settled = true;

//       if (error.code === "ENOENT") {
//         reject(
//           createServiceError(
//             `${command} is not installed or is not available in PATH`,
//             500,
//             `${errorCode}_COMMAND_NOT_FOUND`,
//           ),
//         );

//         return;
//       }

//       reject(error);
//     });

//     child.on("close", (code) => {
//       if (settled) return;

//       settled = true;

//       if (code !== 0) {
//         reject(
//           createServiceError(
//             stderr.trim() || errorMessage || `${command} failed`,
//             500,
//             errorCode,
//           ),
//         );

//         return;
//       }

//       resolve({
//         stdout,
//         stderr,
//       });
//     });
//   });
// };

// // ==================== Create MongoDB Backup ====================

// const createMongoBackup = async ({ databaseDirectory }) => {
//   const mongoArchivePath = path.join(
//     databaseDirectory,
//     "mongodb.archive.gz",
//   );

//   await runCommand({
//     command: "mongodump",
//     args: [
//       `--uri=${process.env.MONGODB_URL}`,
//       `--archive=${mongoArchivePath}`,
//       "--gzip",
//     ],
//     errorMessage: "Failed to create MongoDB backup",
//     errorCode: "MONGODB_BACKUP_FAILED",
//   });

//   const stats = await fsPromises
//     .stat(mongoArchivePath)
//     .catch(() => null);

//   if (!stats?.isFile() || stats.size === 0) {
//     throw createServiceError(
//       "MongoDB backup file is empty or was not created",
//       500,
//       "MONGODB_BACKUP_EMPTY",
//     );
//   }

//   return {
//     fileName: "mongodb.archive.gz",
//     filePath: mongoArchivePath,
//     size: stats.size,
//   };
// };

// // ==================== Get Cloudinary Resources Page ====================

// const getCloudinaryResourcesPage = async ({
//   resourceType,
//   deliveryType,
//   nextCursor,
// }) => {
//   const options = {
//     resource_type: resourceType,
//     type: deliveryType,
//     max_results: CLOUDINARY_PAGE_SIZE,
//     tags: true,
//     context: true,
//   };

//   if (nextCursor) {
//     options.next_cursor = nextCursor;
//   }

//   return cloudinary.api.resources(options);
// };

// // ==================== Get All Cloudinary Resources ====================

// const getAllCloudinaryResources = async () => {
//   const resources = [];

//   for (const resourceType of CLOUDINARY_RESOURCE_TYPES) {
//     for (const deliveryType of CLOUDINARY_DELIVERY_TYPES) {
//       let nextCursor = null;

//       do {
//         const response = await getCloudinaryResourcesPage({
//           resourceType,
//           deliveryType,
//           nextCursor,
//         });

//         if (Array.isArray(response.resources)) {
//           resources.push(...response.resources);
//         }

//         nextCursor = response.next_cursor || null;
//       } while (nextCursor);
//     }
//   }

//   return resources;
// };

// // ==================== Sanitize Path Segment ====================

// const sanitizePathSegment = (value) => {
//   return String(value || "")
//     .replace(/\\/g, "/")
//     .split("/")
//     .filter(Boolean)
//     .map((segment) =>
//       segment
//         .replace(/[^a-zA-Z0-9._-]/g, "_")
//         .replace(/^\.+$/, "_"),
//     )
//     .join("/");
// };

// // ==================== Get Asset Extension ====================

// const getCloudinaryAssetExtension = (resource) => {
//   if (resource.resource_type === "raw") {
//     const existingExtension = path.extname(
//       resource.public_id || "",
//     );

//     if (existingExtension) {
//       return "";
//     }
//   }

//   if (resource.format) {
//     return `.${resource.format}`;
//   }

//   try {
//     const assetUrl = new URL(
//       resource.secure_url || resource.url,
//     );

//     return path.extname(assetUrl.pathname);
//   } catch {
//     return "";
//   }
// };

// // ==================== Generate Asset Backup Path ====================

// const generateCloudinaryAssetFilePath = ({
//   resource,
//   assetsDirectory,
// }) => {
//   const resourceType = sanitizePathSegment(
//     resource.resource_type || "unknown",
//   );

//   const deliveryType = sanitizePathSegment(
//     resource.type || "upload",
//   );

//   let publicId = sanitizePathSegment(
//     resource.public_id ||
//       resource.asset_id ||
//       "asset",
//   );

//   const extension = getCloudinaryAssetExtension(
//     resource,
//   );

//   if (
//     extension &&
//     !publicId
//       .toLowerCase()
//       .endsWith(extension.toLowerCase())
//   ) {
//     publicId += extension;
//   }

//   const relativePath = path.join(
//     resourceType,
//     deliveryType,
//     publicId,
//   );

//   const absolutePath = path.join(
//     assetsDirectory,
//     relativePath,
//   );

//   return {
//     relativePath,
//     absolutePath,
//   };
// };

// // ==================== Download File ====================

// const downloadFile = async ({
//   url,
//   destination,
// }) => {
//   const response = await fetch(url);

//   if (!response.ok) {
//     throw createServiceError(
//       `Failed to download Cloudinary asset: ${response.status} ${response.statusText}`,
//       502,
//       "CLOUDINARY_ASSET_DOWNLOAD_FAILED",
//     );
//   }

//   if (!response.body) {
//     throw createServiceError(
//       "Cloudinary asset response body is empty",
//       502,
//       "CLOUDINARY_ASSET_EMPTY_RESPONSE",
//     );
//   }

//   await fsPromises.mkdir(
//     path.dirname(destination),
//     {
//       recursive: true,
//     },
//   );

//   const fileStream = fs.createWriteStream(
//     destination,
//   );

//   const readable = Readable.fromWeb(
//     response.body,
//   );

//   await new Promise((resolve, reject) => {
//     readable.on("error", reject);
//     fileStream.on("error", reject);
//     fileStream.on("finish", resolve);

//     readable.pipe(fileStream);
//   });
// };

// // ==================== Create Manifest Item ====================

// const createCloudinaryManifestItem = ({
//   resource,
//   relativePath,
//   fileSize,
// }) => {
//   return {
//     assetId: resource.asset_id || null,
//     publicId: resource.public_id,
//     resourceType: resource.resource_type,
//     deliveryType: resource.type || "upload",
//     format: resource.format || null,
//     version: resource.version || null,
//     width: resource.width ?? null,
//     height: resource.height ?? null,
//     bytes: resource.bytes ?? fileSize ?? null,
//     createdAt: resource.created_at || null,
//     secureUrl: resource.secure_url || null,
//     originalFilename:
//       resource.original_filename || null,
//     folder: resource.folder || null,
//     assetFolder: resource.asset_folder || null,
//     displayName: resource.display_name || null,
//     tags: Array.isArray(resource.tags)
//       ? resource.tags
//       : [],
//     context: resource.context || null,
//     metadata: resource.metadata || null,
//     backupFile: relativePath
//       .split(path.sep)
//       .join("/"),
//   };
// };

// // ==================== Backup Single Cloudinary Asset ====================

// const backupCloudinaryAsset = async ({
//   resource,
//   assetsDirectory,
// }) => {
//   const sourceUrl =
//     resource.secure_url ||
//     resource.url;

//   if (!sourceUrl) {
//     throw createServiceError(
//       `Cloudinary asset ${resource.public_id} does not have a downloadable URL`,
//       500,
//       "CLOUDINARY_ASSET_URL_MISSING",
//     );
//   }

//   const {
//     relativePath,
//     absolutePath,
//   } = generateCloudinaryAssetFilePath({
//     resource,
//     assetsDirectory,
//   });

//   await downloadFile({
//     url: sourceUrl,
//     destination: absolutePath,
//   });

//   const stats = await fsPromises.stat(
//     absolutePath,
//   );

//   return createCloudinaryManifestItem({
//     resource,
//     relativePath,
//     fileSize: stats.size,
//   });
// };

// // ==================== Create Cloudinary Backup ====================

// const createCloudinaryBackup = async ({
//   cloudinaryDirectory,
//   assetsDirectory,
//   onProgress,
// }) => {
//   configureCloudinary();

//   const resources =
//     await getAllCloudinaryResources();

//   const manifestItems = [];
//   const failedAssets = [];

//   for (
//     let index = 0;
//     index < resources.length;
//     index += 1
//   ) {
//     const resource = resources[index];

//     try {
//       const manifestItem =
//         await backupCloudinaryAsset({
//           resource,
//           assetsDirectory,
//         });

//       manifestItems.push(manifestItem);

//       if (onProgress) {
//         onProgress({
//           stage: "cloudinary",
//           status: "downloading",
//           current: index + 1,
//           total: resources.length,
//           publicId: resource.public_id,
//         });
//       }
//     } catch (error) {
//       failedAssets.push({
//         publicId: resource.public_id || null,
//         resourceType:
//           resource.resource_type || null,
//         deliveryType:
//           resource.type || null,
//         message:
//           error.message,
//       });
//     }
//   }

//   const manifest = {
//     version: BACKUP_VERSION,
//     generatedAt: new Date().toISOString(),
//     totalAssets: resources.length,
//     backedUpAssets: manifestItems.length,
//     failedAssets: failedAssets.length,
//     resources: manifestItems,
//     failures: failedAssets,
//   };

//   const manifestPath = path.join(
//     cloudinaryDirectory,
//     "manifest.json",
//   );

//   await fsPromises.writeFile(
//     manifestPath,
//     JSON.stringify(
//       manifest,
//       null,
//       2,
//     ),
//     "utf8",
//   );

//   if (failedAssets.length > 0) {
//     const error = createServiceError(
//       `Cloudinary backup incomplete. ${failedAssets.length} asset(s) failed to download.`,
//       500,
//       "CLOUDINARY_BACKUP_INCOMPLETE",
//     );

//     error.failures = failedAssets;

//     throw error;
//   }

//   return {
//     totalAssets: resources.length,
//     backedUpAssets: manifestItems.length,
//     manifestPath,
//     resources: manifestItems,
//   };
// };

// // ==================== Create Backup Information ====================

// const createBackupInformation = async ({
//   rootDirectory,
//   mongoBackup,
//   cloudinaryBackup,
// }) => {
//   const backupInfo = {
//     version: BACKUP_VERSION,
//     application: "LSA",
//     createdAt: new Date().toISOString(),

//     database: {
//       included: true,
//       archive:
//         "database/mongodb.archive.gz",
//       size: mongoBackup.size,
//     },

//     cloudinary: {
//       included: true,
//       manifest:
//         "cloudinary/manifest.json",
//       assetCount:
//         cloudinaryBackup.totalAssets,
//     },
//   };

//   const backupInfoPath = path.join(
//     rootDirectory,
//     "backup-info.json",
//   );

//   await fsPromises.writeFile(
//     backupInfoPath,
//     JSON.stringify(
//       backupInfo,
//       null,
//       2,
//     ),
//     "utf8",
//   );

//   return {
//     backupInfo,
//     backupInfoPath,
//   };
// };

// // ==================== Create Zip Archive ====================

// const createZipArchive = async ({
//   sourceDirectory,
//   destinationPath,
// }) => {
//   await fsPromises.mkdir(
//     path.dirname(destinationPath),
//     {
//       recursive: true,
//     },
//   );

//   return new Promise((resolve, reject) => {
//     const output = fs.createWriteStream(
//       destinationPath,
//     );

//     const archive = archiver("zip", {
//       zlib: {
//         level: 9,
//       },
//     });

//     let settled = false;

//     output.on("close", () => {
//       if (settled) return;

//       settled = true;

//       resolve({
//         bytes: archive.pointer(),
//       });
//     });

//     output.on("error", (error) => {
//       if (settled) return;

//       settled = true;
//       reject(error);
//     });

//     archive.on("warning", (error) => {
//       if (error.code === "ENOENT") {
//         console.warn(
//           "Backup archive warning:",
//           error,
//         );

//         return;
//       }

//       if (!settled) {
//         settled = true;
//         reject(error);
//       }
//     });

//     archive.on("error", (error) => {
//       if (settled) return;

//       settled = true;
//       reject(error);
//     });

//     archive.pipe(output);

//     archive.directory(
//       sourceDirectory,
//       false,
//     );

//     archive.finalize();
//   });
// };

// // ==================== Remove Directory Safely ====================

// const removeDirectorySafely = async (
//   directoryPath,
// ) => {
//   if (!directoryPath) return;

//   try {
//     await fsPromises.rm(
//       directoryPath,
//       {
//         recursive: true,
//         force: true,
//       },
//     );
//   } catch (error) {
//     console.error(
//       "Failed to remove temporary backup directory:",
//       error,
//     );
//   }
// };

// // ==================== Remove File Safely ====================

// const removeFileSafely = async (filePath) => {
//   if (!filePath) return;

//   try {
//     await fsPromises.unlink(filePath);
//   } catch (error) {
//     if (error.code !== "ENOENT") {
//       console.error(
//         "Failed to remove temporary backup file:",
//         error,
//       );
//     }
//   }
// };

// // ==================== Cleanup Backup ====================

// const cleanupBackup = async ({
//   filePath,
//   temporaryDirectory,
// }) => {
//   await Promise.all([
//     removeFileSafely(filePath),
//     removeDirectorySafely(
//       temporaryDirectory,
//     ),
//   ]);
// };

// // ==================== Create Full Backup ====================

// const createFullBackup = async ({
//   onProgress,
// } = {}) => {
//   validateBackupConfiguration();

//   let directories = null;
//   let finalFilePath = null;

//   try {
//     // ==================== Prepare Directories ====================

//     directories =
//       await createTemporaryBackupDirectory();

//     // ==================== MongoDB Backup ====================

//     if (onProgress) {
//       onProgress({
//         stage: "mongodb",
//         status: "started",
//       });
//     }

//     const mongoBackup =
//       await createMongoBackup({
//         databaseDirectory:
//           directories.databaseDirectory,
//       });

//     if (onProgress) {
//       onProgress({
//         stage: "mongodb",
//         status: "completed",
//       });
//     }

//     // ==================== Cloudinary Backup ====================

//     if (onProgress) {
//       onProgress({
//         stage: "cloudinary",
//         status: "started",
//       });
//     }

//     const cloudinaryBackup =
//       await createCloudinaryBackup({
//         cloudinaryDirectory:
//           directories.cloudinaryDirectory,
//         assetsDirectory:
//           directories.assetsDirectory,
//         onProgress,
//       });

//     if (onProgress) {
//       onProgress({
//         stage: "cloudinary",
//         status: "completed",
//       });
//     }

//     // ==================== Backup Information ====================

//     await createBackupInformation({
//       rootDirectory:
//         directories.rootDirectory,
//       mongoBackup,
//       cloudinaryBackup,
//     });

//     // ==================== Create Final ZIP ====================

//     if (onProgress) {
//       onProgress({
//         stage: "archive",
//         status: "started",
//       });
//     }

//     const fileName =
//       `lsa-full-backup-${directories.timestamp}.zip`;

//     finalFilePath = path.join(
//       os.tmpdir(),
//       fileName,
//     );

//     const archiveResult =
//       await createZipArchive({
//         sourceDirectory:
//           directories.rootDirectory,
//         destinationPath:
//           finalFilePath,
//       });

//     const finalStats =
//       await fsPromises
//         .stat(finalFilePath)
//         .catch(() => null);

//     if (
//       !finalStats?.isFile() ||
//       finalStats.size === 0
//     ) {
//       throw createServiceError(
//         "Final backup ZIP file was not created correctly",
//         500,
//         "BACKUP_ARCHIVE_EMPTY",
//       );
//     }

//     if (onProgress) {
//       onProgress({
//         stage: "archive",
//         status: "completed",
//       });
//     }

//     // ==================== Result ====================

//     return {
//       fileName,
//       filePath: finalFilePath,
//       size:
//         archiveResult.bytes ||
//         finalStats.size,
//       temporaryDirectory:
//         directories.rootDirectory,

//       mongo: {
//         size:
//           mongoBackup.size,
//       },

//       cloudinary: {
//         assetCount:
//           cloudinaryBackup.totalAssets,
//       },
//     };
//   } catch (error) {
//     if (finalFilePath) {
//       await removeFileSafely(
//         finalFilePath,
//       );
//     }

//     if (
//       directories?.rootDirectory
//     ) {
//       await removeDirectorySafely(
//         directories.rootDirectory,
//       );
//     }

//     throw error;
//   }
// };

// // ==================== Exports ====================

// module.exports = {
//   createFullBackup,
//   createMongoBackup,
//   createCloudinaryBackup,
//   cleanupBackup,
//   removeFileSafely,
//   removeDirectorySafely,
// };