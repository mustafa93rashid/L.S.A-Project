const { EquipmentRequest } = require("../models/equipmentRequest.model");

const Equipment = require("../models/equipment.model");

const {
  sendEquipmentRequestReceivedEmail,
  sendEquipmentRequestStatusEmail,
} = require("../services/email.service");

const {
  createEquipmentRequestNotification,
} = require("../services/notification.service");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const REQUEST_POPULATE_FIELDS = [
  {
    path: "equipment",
    select:
      "title slug image primarySpecification location availableUnits isActive",
  },
  {
    path: "assignedTo",
    select: "fullName email role",
  },
  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

// ==================================================
// Get Current User ID
// ==================================================

const getCurrentUserId = (req) => {
  return req.user?._id || req.user?.id || null;
};

// ==================================================
// Escape Regular Expression
// ==================================================

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ==================================================
// Build Dashboard Filter
// ==================================================

const buildDashboardFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.equipment) {
    filter.equipment = query.equipment;
  }

  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
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

// ==================================================
// Build Pagination
// ==================================================

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

// ==================================================
// Send Customer Email Safely
// ==================================================

const sendCustomerEmailSafely = async ({ request, equipment }) => {
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

    await request.save();
  } catch (error) {
    console.error("Equipment request confirmation email failed:", {
      requestId: request._id,
      email: request.email,
      message: error.message,
    });
  }
};

// ==================================================
// Create Dashboard Notification Safely
// ==================================================

const createNotificationSafely = async ({ request, equipment }) => {
  try {
    await createEquipmentRequestNotification({
      equipmentRequest: request,
      equipment,
    });

    request.dashboardNotificationCreated = true;

    request.dashboardNotificationCreatedAt = new Date();

    await request.save();
  } catch (error) {
    console.error("Equipment request dashboard notification failed:", {
      requestId: request._id,
      message: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| Equipment Request Controller
|--------------------------------------------------------------------------
*/

class EquipmentRequestController {
  /*
  |--------------------------------------------------------------------------
  | Public
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Create Equipment Request
  // ==================================================

  createEquipmentRequest = async (req, res) => {
    const {
      equipment: equipmentId,
      fullName,
      email,
      phone,
      company,
      workLocation,
      estimatedRequiredDays,
      workDescription,
    } = req.body;

    const equipment = await Equipment.findOne({
      _id: equipmentId,
      isActive: true,
    })
      .select(
        "title slug image primarySpecification location availableUnits isActive",
      )
      .lean();

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "The selected equipment is not available.",
      });
    }

    const request = await EquipmentRequest.create({
      equipment: equipment._id,
      fullName,
      email,
      phone,
      company,
      workLocation,
      estimatedRequiredDays,
      workDescription,
    });

    await request.populate(
      "equipment",
      "title slug image primarySpecification location availableUnits",
    );

    /*
    |--------------------------------------------------------------------------
    | Side Effects
    |--------------------------------------------------------------------------
    |
    | فشل البريد أو الإشعار لا يلغي الطلب بعد حفظه.
    |
    */

    await Promise.allSettled([
      sendCustomerEmailSafely({
        request,
        equipment,
      }),

      createNotificationSafely({
        request,
        equipment,
      }),
    ]);

    return res.status(201).json({
      success: true,

      message:
        "Your equipment request has been received successfully. Our team will contact you soon.",

      data: {
        request: {
          _id: request._id,

          equipment: request.equipment,

          fullName: request.fullName,

          email: request.email,

          company: request.company,

          workLocation: request.workLocation,

          estimatedRequiredDays: request.estimatedRequiredDays,

          status: request.status,

          createdAt: request.createdAt,
        },
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Dashboard
  |--------------------------------------------------------------------------
  */

  // ==================================================
  // Get All Equipment Requests
  // ==================================================

  getAllEquipmentRequests = async (req, res) => {
    const filter = buildDashboardFilter(req.query);

    const { page, limit, skip } = buildPagination(req.query);

    const [requests, total] = await Promise.all([
      EquipmentRequest.find(filter)
        .populate(REQUEST_POPULATE_FIELDS)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      EquipmentRequest.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,

      count: requests.length,

      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      data: requests,
    });
  };

  // ==================================================
  // Get Equipment Request By ID
  // ==================================================

  getEquipmentRequestById = async (req, res) => {
    const request = await EquipmentRequest.findById(req.params.id)
      .populate(REQUEST_POPULATE_FIELDS)
      .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Equipment request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  };

// ==================================================
// Update Equipment Request Status
// ==================================================

updateEquipmentRequestStatus = async (req, res) => {
  const request = await EquipmentRequest.findById(
    req.params.id,
  ).populate(
    "equipment",
    "title slug",
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message:
        "Equipment request not found.",
    });
  }

  const { status } = req.body;

  const previousStatus =
    request.status;

  request.status = status;

  request.updatedBy =
    getCurrentUserId(req);

  if (
    status === "contacted" &&
    !request.contactedAt
  ) {
    request.contactedAt =
      new Date();
  }

  if (status === "completed") {
    request.completedAt =
      new Date();
  } else if (
    previousStatus === "completed"
  ) {
    request.completedAt = null;
  }

  await request.save();

  /*
  |--------------------------------------------------------------------------
  | Customer Email
  |--------------------------------------------------------------------------
  */

  if (
    [
      "approved",
      "rejected",
      "completed",
    ].includes(status)
  ) {
    try {
      await sendEquipmentRequestStatusEmail({
        to: request.email,

        fullName:
          request.fullName,

        equipmentTitle:
          request.equipment.title,

        status,
      });
    } catch (error) {
      console.error(
        "Equipment request status email failed:",
        error.message,
      );
    }
  }

  return res.status(200).json({
    success: true,

    message:
      "Equipment request status updated successfully.",

    data: request,
  });
};

  // ==================================================
  // Delete Equipment Request
  // ==================================================

  deleteEquipmentRequest = async (req, res) => {
    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Equipment request not found.",
      });
    }

    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Equipment request deleted successfully.",
    });
  };

  // ==================================================
  // Get Equipment Request Statistics
  // ==================================================

  getEquipmentRequestStatistics = async (req, res) => {
    const [
      total,
      newRequests,
      contacted,
      quoted,
      approved,
      rejected,
      completed,
    ] = await Promise.all([
      EquipmentRequest.countDocuments(),

      EquipmentRequest.countDocuments({
        status: "new",
      }),

      EquipmentRequest.countDocuments({
        status: "contacted",
      }),

      EquipmentRequest.countDocuments({
        status: "quoted",
      }),

      EquipmentRequest.countDocuments({
        status: "approved",
      }),

      EquipmentRequest.countDocuments({
        status: "rejected",
      }),

      EquipmentRequest.countDocuments({
        status: "completed",
      }),
    ]);

    return res.status(200).json({
      success: true,

      data: {
        total,
        new: newRequests,
        contacted,
        quoted,
        approved,
        rejected,
        completed,
      },
    });
  };
}

module.exports = new EquipmentRequestController();
