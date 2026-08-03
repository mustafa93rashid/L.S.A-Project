const {
  sendEquipmentRequestReceivedEmail,
  sendEquipmentRequestStatusEmail,
} = require("../services/email.service");

const {
  createEquipmentRequestNotification,
} = require("../services/notification.service");

// ==================== Constants ====================

const REQUEST_POPULATE_FIELDS = [
  {
    path: "equipment",
    select:
      "title slug image primarySpecification location availableUnits isActive",
  },

  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

const STATUS_EMAILS = ["approved", "rejected", "completed"];

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

  if (query.equipment) {
    filter.equipment = query.equipment;
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
        company: {
          $regex: searchTerm,
          $options: "i",
        },
      },

      {
        workLocation: {
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

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
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

const sendReceivedEmailSafely = async ({ request, equipment }) => {
  try {
    await sendEquipmentRequestReceivedEmail({
      to: request.email,
      fullName: request.fullName,
      requestId: request._id,
      equipmentTitle: equipment.title,
      company: request.company,
      workLocation: request.workLocation,
      estimatedRequiredDays: request.estimatedRequiredDays,
    });

    request.customerEmailSent = true;
    request.customerEmailSentAt = new Date();

    await request.save({
      validateBeforeSave: false,
    });
  } catch (error) {
    console.error("Equipment request confirmation email failed:", {
      requestId: request._id,
      email: request.email,
      message: error.message,
    });
  }
};

// ==================== Create Notification Safely ====================

const createNotificationSafely = async ({ request, equipment }) => {
  try {
    await createEquipmentRequestNotification({
      equipmentRequest: request,
      equipment,
    });

    request.dashboardNotificationCreated = true;

    request.dashboardNotificationCreatedAt = new Date();

    await request.save({
      validateBeforeSave: false,
    });
  } catch (error) {
    console.error("Equipment request dashboard notification failed:", {
      requestId: request._id,
      message: error.message,
    });
  }
};

// ==================== Process Request Side Effects ====================

const processRequestSideEffects = async ({ request, equipment }) => {
  await Promise.allSettled([
    sendReceivedEmailSafely({
      request,
      equipment,
    }),

    createNotificationSafely({
      request,
      equipment,
    }),
  ]);
};

// ==================== Update Request Timeline ====================

const updateRequestTimeline = (request, newStatus) => {
  const previousStatus = request.status;

  request.status = newStatus;

  if (newStatus === "contacted" && !request.contactedAt) {
    request.contactedAt = new Date();
  }

  if (newStatus === "completed") {
    request.completedAt = new Date();
  } else if (previousStatus === "completed") {
    request.completedAt = null;
  }
};

// ==================== Send Status Email Safely ====================

const sendStatusEmailSafely = async ({ request, status }) => {
  if (!STATUS_EMAILS.includes(status)) {
    return;
  }

  try {
    await sendEquipmentRequestStatusEmail({
      to: request.email,
      fullName: request.fullName,
      equipmentTitle: request.equipment.title,
      status,
    });
  } catch (error) {
    console.error("Equipment request status email failed:", {
      requestId: request._id,
      email: request.email,
      status,
      message: error.message,
    });
  }
};

// ==================== Build Statistics ====================

const buildRequestStatistics = async (EquipmentRequest) => {
  const statuses = [
    "new",
    "contacted",
    "quoted",
    "approved",
    "rejected",
    "completed",
  ];

  const [total, ...statusCounts] = await Promise.all([
    EquipmentRequest.countDocuments(),

    ...statuses.map((status) =>
      EquipmentRequest.countDocuments({
        status,
      }),
    ),
  ]);

  return {
    total,
    new: statusCounts[0],
    contacted: statusCounts[1],
    quoted: statusCounts[2],
    approved: statusCounts[3],
    rejected: statusCounts[4],
    completed: statusCounts[5],
  };
};

// ==================== Exports ====================

module.exports = {
  REQUEST_POPULATE_FIELDS,
  STATUS_EMAILS,

  getCurrentUserId,
  escapeRegex,

  buildDashboardFilter,
  buildPagination,
  buildPaginationResponse,

  processRequestSideEffects,
  updateRequestTimeline,
  sendStatusEmailSafely,

  buildRequestStatistics,
};
