const express = require("express");
const router = express.Router();

const partnerController = require("../controllers/partner.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const { uploadPartnerLogo } = require("../middlewares/upload.middleware");

const asyncHandler = require("../utils/asyncHandler");

const { createPartnerValidation, updatePartnerValidation, partnerIdValidation } = require("../validation/partner.validate");

// ==================== Public ====================

router.get("/public", asyncHandler(partnerController.getPublicPartners));

// ==================== Dashboard ====================

router.get("/", [auth, role(["superadmin", "manager", "contentManager"])], asyncHandler(partnerController.getAllPartners));

router.post("/", [auth, role(["superadmin", "manager", "contentManager"]), uploadPartnerLogo(), ...createPartnerValidation], asyncHandler(partnerController.createPartner));

router.patch("/:id", [auth, role(["superadmin", "manager", "contentManager"]), uploadPartnerLogo(), ...partnerIdValidation, ...updatePartnerValidation], asyncHandler(partnerController.updatePartner));

router.delete("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...partnerIdValidation], asyncHandler(partnerController.deletePartner));

module.exports = router;