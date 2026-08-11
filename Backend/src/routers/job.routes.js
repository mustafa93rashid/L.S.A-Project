const express = require("express");

const router = express.Router();

const jobController = require("../controllers/job.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const {
  createJobValidation,
  updateJobValidation,
  jobIdValidation,
  jobQueryValidation,
} = require("../validation/job.validate");

// ==================== Public Routes ====================

router.get("/public", ...jobQueryValidation, asyncHandler(jobController.getPublicJobs));

// ==================== Dashboard Routes ====================

router.post("/", auth, role(["superadmin", "hrManager"]), ...createJobValidation, asyncHandler(jobController.createJob));

router.get("/", auth, role(["superadmin", "hrManager"]), ...jobQueryValidation, asyncHandler(jobController.getAllJobs));

router.get("/statistics", auth, role(["superadmin", "manager", "hrManager"]), asyncHandler(jobController.getJobStatistics));

router.get("/:id", auth, role(["superadmin", "hrManager"]), ...jobIdValidation, asyncHandler(jobController.getJobById));

router.put("/:id", auth, role(["superadmin", "hrManager"]), ...jobIdValidation, ...updateJobValidation, asyncHandler(jobController.updateJob));

router.delete("/:id", auth, role(["superadmin"]), ...jobIdValidation, asyncHandler(jobController.deleteJob));

module.exports = router;