const express = require("express");
const router = express.Router();

const jobRequestController = require("../controllers/jobRequest.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const { uploadJobRequestCv } = require("../middlewares/upload.middleware");

const {validateCvFile,createJobRequestValidation,updateJobRequestStatusValidation,jobRequestIdValidation,jobRequestQueryValidation} = require("../validation/jobRequest.validate");

// ==================== Public Routes ====================

router.post("/", [uploadJobRequestCv(), validateCvFile, ...createJobRequestValidation], asyncHandler(jobRequestController.createJobRequest));

// ==================== Dashboard Routes ====================

router.get("/statistics", [auth, role(["superadmin", "manager", "hrManager"])], asyncHandler(jobRequestController.getJobRequestStatistics));

router.get("/", [auth, role(["superadmin", "manager", "hrManager"]), ...jobRequestQueryValidation], asyncHandler(jobRequestController.getAllJobRequests));

router.get("/:id", [auth, role(["superadmin", "manager", "hrManager"]), ...jobRequestIdValidation], asyncHandler(jobRequestController.getJobRequestById));

router.patch("/:id/status", [auth, role(["superadmin", "manager", "hrManager"]), ...jobRequestIdValidation, ...updateJobRequestStatusValidation], asyncHandler(jobRequestController.updateJobRequestStatus));

router.delete("/:id", [auth, role(["superadmin"]), ...jobRequestIdValidation], asyncHandler(jobRequestController.deleteJobRequest));

module.exports = router;