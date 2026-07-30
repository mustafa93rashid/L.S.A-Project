const express = require("express");
const router = express.Router();

const partnerController = require("../controllers/partner.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const asyncHandler = require("../utils/asyncHandler");
const { uploadSingle } = require("../middlewares/upload.middleware");

const {
  createPartnerValidation,
  updatePartnerValidation,
  partnerIdValidation,
} = require("../validation/partner.validate");

// ==================== Public ====================

router.get("/public", asyncHandler(partnerController.getPublicPartners));

// ==================== Dashboard ====================

router.get("/", [auth, role(["superadmin", "contentManager"])], asyncHandler(partnerController.getAllPartners));

router.post("/", [auth, role(["superadmin", "contentManager"]), uploadSingle("logo"), ...createPartnerValidation], asyncHandler(partnerController.createPartner));

router.patch("/:id", [auth, role(["superadmin", "contentManager"]), uploadSingle("logo"), ...updatePartnerValidation], asyncHandler(partnerController.updatePartner));

router.delete("/:id", [auth, role(["superadmin", "contentManager"]), ...partnerIdValidation], asyncHandler(partnerController.deletePartner));

module.exports = router;