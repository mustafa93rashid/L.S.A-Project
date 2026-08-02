const express = require("express");
const router = express.Router();

const jobRequestController = require("../controllers/jobRequest.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");
const { uploadJobRequestCv } = require("../middlewares/upload.middleware");

const { validateCvFile, createJobRequestValidation, updateJobRequestStatusValidation, jobRequestIdValidation, jobRequestQueryValidation } = require("../validation/jobRequest.validate");

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

// Submit a job application from the popup
router.post("/", uploadJobRequestCv(), validateCvFile, ...createJobRequestValidation, asyncHandler(jobRequestController.createJobRequest));

/*
|--------------------------------------------------------------------------
| Dashboard Routes
|--------------------------------------------------------------------------
*/

// Statistics must be placed before /:id
router.get("/statistics", auth, role(["superadmin", "hrManager"]), asyncHandler(jobRequestController.getJobRequestStatistics));

// Get all job requests
router.get("/", auth, role(["superadmin", "hrManager"]), ...jobRequestQueryValidation, asyncHandler(jobRequestController.getAllJobRequests));

// Get one job request
router.get("/:id", auth, role(["superadmin", "hrManager"]), ...jobRequestIdValidation, asyncHandler(jobRequestController.getJobRequestById));

// Update request status
router.patch("/:id/status", auth, role(["superadmin", "hrManager"]), ...jobRequestIdValidation, ...updateJobRequestStatusValidation, asyncHandler(jobRequestController.updateJobRequestStatus));

// Delete request
router.delete("/:id", auth, role(["superadmin"]), ...jobRequestIdValidation, asyncHandler(jobRequestController.deleteJobRequest));

module.exports = router;