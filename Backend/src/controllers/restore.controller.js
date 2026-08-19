const {
  inspectBackup,
  restoreFullBackup,
  cleanupRestoreUpload,
} = require("../services/restore.service");

// ==================== Validate Restore File ====================

const validateRestoreFile = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Backup ZIP file is required",
      code: "RESTORE_FILE_REQUIRED",
    });
  }

  try {
    const backupInfo = await inspectBackup(
      file.path,
    );

    return res.status(200).json({
      success: true,
      message: "Backup file is valid",
      data: backupInfo,
    });
  } finally {
    await cleanupRestoreUpload(
      file.path,
    );
  }
};

// ==================== Restore Full Backup ====================

const restoreBackup = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Backup ZIP file is required",
      code: "RESTORE_FILE_REQUIRED",
    });
  }

  const dropExisting =
    req.body.dropExisting !== "false";

  try {
    const result = await restoreFullBackup({
      zipFilePath: file.path,
      dropExisting,
    });

    return res.status(200).json({
      success: true,
      message: "Backup restored successfully",
      data: result,
    });
  } finally {
    await cleanupRestoreUpload(
      file.path,
    );
  }
};

// ==================== Exports ====================

module.exports = {
  validateRestoreFile,
  restoreBackup,
};