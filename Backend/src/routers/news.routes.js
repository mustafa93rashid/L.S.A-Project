const express = require("express");
const newsController = require("../controllers/news.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const { uploadNewsImage } = require("../middlewares/upload.middleware");
const asyncHandler = require("../utils/asyncHandler");
const { validateNewsId, validateCreateNews, validateUpdateNews, validateNewsQuery, validatePublicNewsQuery } = require("../validation/news.validate");

const router = express.Router();

// ==================== Public ====================

router.get("/public", [...validatePublicNewsQuery], asyncHandler(newsController.getPublicNews));
router.get("/public/:id", [...validateNewsId], asyncHandler(newsController.getPublicNewsById));

// ==================== Dashboard ====================

router.get("/", [auth, role(["superadmin", "manager", "contentManager"]), ...validateNewsQuery], asyncHandler(newsController.getAllNews));
router.get("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...validateNewsId], asyncHandler(newsController.getNewsById));
router.post("/", [auth, role(["superadmin", "manager", "contentManager"]), uploadNewsImage("image"), ...validateCreateNews], asyncHandler(newsController.createNews));
router.patch("/:id", [auth, role(["superadmin", "manager", "contentManager"]), uploadNewsImage("image"), ...validateNewsId, ...validateUpdateNews], asyncHandler(newsController.updateNews));
router.delete("/:id", [auth, role(["superadmin", "manager", "contentManager"]), ...validateNewsId], asyncHandler(newsController.deleteNews));

module.exports = router;