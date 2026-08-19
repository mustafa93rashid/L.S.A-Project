const express = require("express");

const router = express.Router();

const backupController = require("../controllers/backup.controller");
const restoreController = require("../controllers/restore.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const {
  uploadRestoreBackup,
  handleRestoreUploadError,
} = require("../middlewares/restore.middleware");

// ==================== Backup Information ====================

router.get(
  "/",
  auth,
  role(["superadmin"]),
  asyncHandler(
    backupController.getBackupInformation,
  ),
);

// ==================== Download Full Backup ====================

router.post(
  "/download",
  auth,
  role(["superadmin"]),
  asyncHandler(
    backupController.downloadFullBackup,
  ),
);

// ==================== Validate Backup File ====================

router.post(
  "/validate",
  auth,
  role(["superadmin"]),
  uploadRestoreBackup(),
  handleRestoreUploadError,
  asyncHandler(
    restoreController.validateRestoreFile,
  ),
);

// ==================== Restore Full Backup ====================

router.post(
  "/restore",
  auth,
  role(["superadmin"]),
  uploadRestoreBackup(),
  handleRestoreUploadError,
  asyncHandler(
    restoreController.restoreBackup,
  ),
);

// ==================== Exports ====================

module.exports = router;