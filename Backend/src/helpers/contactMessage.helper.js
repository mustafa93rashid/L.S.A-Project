const {
  ContactMessage,
  CONTACT_MESSAGE_STATUSES,
} = require("../models/contactMessage.model");

const {
  sendContactMessageReceivedEmail,
} = require("../services/email.service");

const {
  createContactMessageNotification,
} = require("../services/notification.service");

// ==================== Constants ====================

const CONTACT_MESSAGE_POPULATE_FIELDS = [
  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

const STATUS_DATE_FIELDS = {
  read: "readAt",
  replied: "repliedAt",
  archived: "archivedAt",
};

// ==================== Get Current User ID ====================

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

// ==================== Escape Regular Expression ====================

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==================== Build Dashboard Filter ====================

const buildDashboardFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.service) {
    filter.service = query.service;
  }

  if (query.search) {
    const searchTerm = escapeRegex(query.search.trim());

    filter.$or = [
      {
        fullName: {
          $regex: searchTerm,
          $options: "i",
        },
      },

      {
        email: {
          $regex: searchTerm,
          $options: "i",
        },
      },

      {
        phone: {
          $regex: searchTerm,
          $options: "i",
        },
      },

      {
        projectDescription: {
          $regex: searchTerm,
          $options: "i",
        },
      },
    ];
  }

  return filter;
};

// ==================== Build Pagination ====================

const buildPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// ==================== Build Pagination Response ====================

const buildPaginationResponse = ({ page, limit, total }) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

// ==================== Send Received Email Safely ====================

const sendReceivedEmailSafely = async ({ contactMessage }) => {
  if (contactMessage.customerEmailSent) {
    return;
  }

  try {
    await sendContactMessageReceivedEmail({
      to: contactMessage.email,
      fullName: contactMessage.fullName,
      service: contactMessage.service,
      messageId: contactMessage._id,
    });

    const sentAt = new Date();

    await ContactMessage.findByIdAndUpdate(
      contactMessage._id,
      {
        customerEmailSent: true,
        customerEmailSentAt: sentAt,
      },
      {
        runValidators: false,
      },
    );

    contactMessage.customerEmailSent = true;
    contactMessage.customerEmailSentAt = sentAt;
  } catch (error) {
    console.error("Contact message received email failed:", {
      contactMessageId: contactMessage._id,
      email: contactMessage.email,
      message: error.message,
    });
  }
};

// ==================== Create Notification Safely ====================

const createNotificationSafely = async ({ contactMessage }) => {
  if (contactMessage.dashboardNotificationCreated) {
    return;
  }

  try {
    await createContactMessageNotification({
      contactMessage,
    });

    const createdAt = new Date();

    await ContactMessage.findByIdAndUpdate(
      contactMessage._id,
      {
        dashboardNotificationCreated: true,
        dashboardNotificationCreatedAt: createdAt,
      },
      {
        runValidators: false,
      },
    );

    contactMessage.dashboardNotificationCreated = true;
    contactMessage.dashboardNotificationCreatedAt = createdAt;
  } catch (error) {
    console.error("Contact message notification failed:", {
      contactMessageId: contactMessage._id,
      message: error.message,
    });
  }
};

// ==================== Process Contact Message Side Effects ====================

const processContactMessageSideEffects = async ({ contactMessage }) => {
  await Promise.allSettled([
    sendReceivedEmailSafely({
      contactMessage,
    }),

    createNotificationSafely({
      contactMessage,
    }),
  ]);
};

// ==================== Apply Contact Message Status ====================

const applyContactMessageStatus = (contactMessage, status) => {
  if (contactMessage.status === status) {
    return false;
  }

  contactMessage.status = status;

  const dateField = STATUS_DATE_FIELDS[status];

  if (dateField && !contactMessage[dateField]) {
    contactMessage[dateField] = new Date();
  }

  return true;
};

// ==================== Build Contact Message Statistics ====================

const buildContactMessageStatistics = async () => {
  const groupedStatuses = await ContactMessage.aggregate([
    {
      $group: {
        _id: "$status",

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const statusCounts = CONTACT_MESSAGE_STATUSES.reduce((result, status) => {
    result[status] = 0;

    return result;
  }, {});

  groupedStatuses.forEach((item) => {
    if (Object.prototype.hasOwnProperty.call(statusCounts, item._id)) {
      statusCounts[item._id] = item.count;
    }
  });

  const total = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  return {
    total,
    ...statusCounts,
  };
};

// ==================== Exports ====================

module.exports = {
  CONTACT_MESSAGE_POPULATE_FIELDS,
  STATUS_DATE_FIELDS,

  getCurrentUserId,

  buildDashboardFilter,
  buildPagination,
  buildPaginationResponse,

  processContactMessageSideEffects,

  applyContactMessageStatus,

  buildContactMessageStatistics,
};
