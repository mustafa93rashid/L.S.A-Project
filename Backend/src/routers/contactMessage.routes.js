const express = require("express");

const router = express.Router();

const contactMessageController = require("../controllers/contactMessage.controller");

const auth = require("../middlewares/auth");
const role = require("../middlewares/role");

const asyncHandler = require("../utils/asyncHandler");

const {createContactMessageValidation,updateContactMessageStatusValidation,contactMessageIdValidation,contactMessageQueryValidation} = require("../validation/contactMessage.validate");

// ==================== Public Routes ====================

router.post("/", [...createContactMessageValidation], asyncHandler(contactMessageController.createContactMessage));

// ==================== Dashboard Routes ====================

router.get("/statistics", [auth, role(["superadmin", "manager", "contentManager"])], asyncHandler(contactMessageController.getContactMessageStatistics));

router.get("/", [auth, role(["superadmin", "manager", "contentManager"]), ...contactMessageQueryValidation], asyncHandler(contactMessageController.getAllContactMessages));

router.get("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...contactMessageIdValidation], asyncHandler(contactMessageController.getContactMessageById));

router.patch("/:id/status", [auth, role(["superadmin", "manager", "contentManager"]), ...contactMessageIdValidation, ...updateContactMessageStatusValidation], asyncHandler(contactMessageController.updateContactMessageStatus));

router.delete("/:id", [auth, role(["superadmin"]) , ...contactMessageIdValidation], asyncHandler(contactMessageController.deleteContactMessage));

module.exports = router;