const express = require("express");
const router = express.Router();

const notificationController = require("../controllers/notification.controller");
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");

// ==================== Notification Routes ====================

router.get("/", auth, asyncHandler(notificationController.getNotifications));
router.get("/unread-count", auth, asyncHandler(notificationController.getUnreadNotificationsCount));
router.patch("/read-all", auth, asyncHandler(notificationController.markAllNotificationsAsRead));
router.patch("/:id/read", auth, asyncHandler(notificationController.markNotificationAsRead));
router.delete("/read", auth, asyncHandler(notificationController.deleteReadNotifications));
router.delete("/:id", auth, asyncHandler(notificationController.deleteNotification));


module.exports = router;