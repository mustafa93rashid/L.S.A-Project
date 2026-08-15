const express = require("express");

const router = express.Router();

const companyProfileController = require("../controllers/companyProfile.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const { uploadCompanyProfile,} = require("../middlewares/upload.middleware");

const { validateCompanyProfileUpload } = require("../validation/companyProfile.validation");

// ==================== Public Routes ====================

router.get("/download", asyncHandler(companyProfileController.downloadCompanyProfile));

// ==================== Dashboard Routes ====================

router.get("/", auth, asyncHandler(companyProfileController.getCompanyProfile));

router.put("/", auth, role(["superadmin", "manager", "contentManager"]), uploadCompanyProfile(), validateCompanyProfileUpload, asyncHandler(companyProfileController.updateCompanyProfile));

router.delete("/", auth, role(["superadmin", "manager", "contentManager"]), asyncHandler(companyProfileController.deleteCompanyProfile));

module.exports = router;