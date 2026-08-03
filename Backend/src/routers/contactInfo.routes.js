const express = require("express");

const router = express.Router();

const contactInfoController = require("../controllers/contactInfo.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const asyncHandler = require("../utils/asyncHandler");

const {saveContactInfoValidation} = require("../validation/contactInfo.validate");

// ==================== Public Routes ====================

router.get("/public", asyncHandler(contactInfoController.getPublicContactInfo));

// ==================== Dashboard Routes ====================

router.get("/", [auth, role(["superadmin", "manager", "contentManager"])], asyncHandler(contactInfoController.getContactInfo));

router.put("/", [auth, role(["superadmin", "manager", "contentManager"]), ...saveContactInfoValidation], asyncHandler(contactInfoController.saveContactInfo));

module.exports = router;