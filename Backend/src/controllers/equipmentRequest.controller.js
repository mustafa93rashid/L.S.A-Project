const { EquipmentRequest } = require("../models/equipmentRequest.model");

const Equipment = require("../models/equipment.model");

const {
  REQUEST_POPULATE_FIELDS,
  getCurrentUserId,
  buildDashboardFilter,
  buildPagination,
  buildPaginationResponse,
  processRequestSideEffects,
  updateRequestTimeline,
  sendStatusEmailSafely,
  buildRequestStatistics,
} = require("../helpers/equipmentRequest.helper");

// ==================== Equipment Request Controller ====================

class EquipmentRequestController {
// ==================== Create Equipment Request ====================

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

  // ==================== Find Equipment ====================

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
      message: "The selected equipment is not available",
    });
  }

  // ==================== Create Equipment Request ====================

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

  // ==================== Populate Equipment ====================

  await request.populate(
    "equipment",
    "title slug image primarySpecification location availableUnits",
  );

  // ==================== Send Success Response ====================
  // من هذه النقطة الطلب يعتبر ناجحاً
  // فشل Email أو Notification لا يؤثر على نجاح الطلب

  res.status(201).json({
    success: true,
    message:
      "Your equipment request has been received successfully. Our team will contact you soon.",

    data: {
      _id: request._id,
      equipment: request.equipment,
      fullName: request.fullName,
      email: request.email,
      phone: request.phone,
      company: request.company,
      workLocation: request.workLocation,
      estimatedRequiredDays: request.estimatedRequiredDays,
      workDescription: request.workDescription,
      status: request.status,
      createdAt: request.createdAt,
    },
  });

  // ==================== Side Effects ====================
  // مهم: لا تستخدم await هنا
  // Email + Dashboard Notification يعملان بشكل مستقل

  void processRequestSideEffects({
    request,
    equipment,
  }).catch((error) => {
    console.error("Equipment request side effects failed:", {
      requestId: request._id,
      message: error.message,
    });
  });

  return;
};

  // ==================== Get All Equipment Requests ====================

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

    return res.status(200).json({
      success: true,
      count: requests.length,

      pagination: buildPaginationResponse({
        page,
        limit,
        total,
      }),

      data: requests,
    });
  };

  // ==================== Get Equipment Request By ID ====================

  getEquipmentRequestById = async (req, res) => {
    const request = await EquipmentRequest.findById(req.params.id)
      .populate(REQUEST_POPULATE_FIELDS)
      .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Equipment request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: request,
    });
  };

// ==================== Update Equipment Request Status ====================

updateEquipmentRequestStatus = async (req, res) => {
  const request = await EquipmentRequest.findById(req.params.id).populate(
    "equipment",
    "title slug",
  );

  if (!request) {
    return res.status(404).json({
      success: false,
      message: "Equipment request not found",
    });
  }

  const { status } = req.body;

  updateRequestTimeline(request, status);

  request.updatedBy = getCurrentUserId(req);

  await request.save();

  await request.populate(
    "updatedBy",
    "fullName email role",
  );

  // ==================== Send Success Response ====================

  res.status(200).json({
    success: true,
    message: "Equipment request status updated successfully",
    data: request,
  });

  // ==================== Status Email ====================

  void sendStatusEmailSafely({
    request,
    status,
  }).catch((error) => {
    console.error("Equipment request status side effect failed:", {
      requestId: request._id,
      status,
      message: error.message,
    });
  });

  return;
};

  // ==================== Delete Equipment Request ====================

  deleteEquipmentRequest = async (req, res) => {
    const request = await EquipmentRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Equipment request not found",
      });
    }

    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Equipment request deleted successfully",
    });
  };

  // ==================== Get Equipment Request Statistics ====================

  getEquipmentRequestStatistics = async (req, res) => {
    const statistics = await buildRequestStatistics(EquipmentRequest);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  };
}

module.exports = new EquipmentRequestController();
