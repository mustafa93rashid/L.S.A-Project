const mongoose = require("mongoose");

const { Notification } = require("../models/notification.model");

// ==================== Get Notifications ====================

const getNotifications = async (req, res) => {
  const userId = req.user._id;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  const skip = (page - 1) * limit;

  const filter = {
    recipient: userId,
  };

  if (req.query.isRead === "true") {
    filter.isRead = true;
  }

  if (req.query.isRead === "false") {
    filter.isRead = false;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(limit)
      .lean(),

    Notification.countDocuments(filter),

    Notification.countDocuments({
      recipient: userId,
      isRead: false,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,

    data: {
      notifications,

      unreadCount,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  });
};

// ==================== Get Unread Count ====================

const getUnreadNotificationsCount = async (req, res) => {
  const userId = req.user._id;

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  return res.status(200).json({
    success: true,

    data: {
      unreadCount,
    },
  });
};

// ==================== Mark Notification As Read ====================

const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user._id;

  const readAt = new Date();

const expiresAt = new Date(
  readAt.getTime() + 24 * 60 * 60 * 1000,
);

  const result = await Notification.updateMany(
    {
      recipient: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt,
        expiresAt,
      },
    },
  );

  return res.status(200).json({
    success: true,
    message: "All notifications marked as read.",
    data: {
      modifiedCount: result.modifiedCount,
    },
  });
};

// ==================== Mark All Notifications As Read ====================

const markNotificationAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  const readAt = new Date();

  const expiresAt = new Date(
    readAt.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  const notification =
    await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: userId,
      },
      {
        $set: {
          isRead: true,
          readAt,
          expiresAt,
        },
      },
      {
        new: true,
      },
    );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Notification marked as read.",
    data: notification,
  });
};

// ==================== Delete Notification ====================

const deleteNotification = async (req, res) => {
  const { id } = req.params;

  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID.",
    });
  }

  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipient: userId,
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Notification deleted successfully.",
  });
};

// ==================== Delete All Read Notifications ====================

const deleteReadNotifications = async (req, res) => {
  const userId = req.user._id;

  const result = await Notification.deleteMany({
    recipient: userId,
    isRead: true,
  });

  return res.status(200).json({
    success: true,
    message: "Read notifications deleted successfully.",

    data: {
      deletedCount: result.deletedCount,
    },
  });
};

// ==================== Exports ====================

module.exports = {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteReadNotifications,
};
