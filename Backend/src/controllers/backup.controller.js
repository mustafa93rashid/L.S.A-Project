const fs = require("fs");

const {
  createFullBackup,
  cleanupBackup,
} = require("../services/backup.service");

// ==================== Download Full Backup ====================

const downloadFullBackup = async (req, res) => {
  let backup = null;

  try {
    backup = await createFullBackup();

    if (
      !backup?.filePath ||
      !fs.existsSync(backup.filePath)
    ) {
      const error = new Error(
        "Backup file was not created",
      );

      error.statusCode = 500;
      error.code = "BACKUP_FILE_NOT_FOUND";

      throw error;
    }

    res.setHeader(
      "Content-Type",
      "application/zip",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${backup.fileName}"`,
    );

    res.setHeader(
      "X-Backup-Cloudinary-Assets",
      String(
        backup.cloudinary?.assetCount ?? 0,
      ),
    );

    res.setHeader(
      "X-Backup-Size",
      String(
        backup.size ?? 0,
      ),
    );

    return res.download(
      backup.filePath,
      backup.fileName,
      async (error) => {
        try {
          await cleanupBackup({
            filePath: backup.filePath,
            temporaryDirectory:
              backup.temporaryDirectory,
          });
        } catch (cleanupError) {
          console.error(
            "Backup cleanup failed:",
            cleanupError,
          );
        }

        if (error) {
          console.error(
            "Backup download failed:",
            error,
          );

          if (!res.headersSent) {
            return res.status(500).json({
              success: false,
              message:
                "Failed to download backup file",
              code:
                "BACKUP_DOWNLOAD_FAILED",
            });
          }
        }
      },
    );
  } catch (error) {
    if (backup) {
      await cleanupBackup({
        filePath:
          backup.filePath,
        temporaryDirectory:
          backup.temporaryDirectory,
      });
    }

    throw error;
  }
};

// ==================== Create Backup Information ====================

const getBackupInformation = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      type: "full",
      includes: {
        mongodb: true,
        cloudinary: true,
      },
      formats: {
        database:
          "MongoDB archive with gzip compression",
        media:
          "Original Cloudinary assets",
        package:
          "ZIP",
      },
    },
  });
};

// ==================== Exports ====================

module.exports = {
  downloadFullBackup,
  getBackupInformation,
};