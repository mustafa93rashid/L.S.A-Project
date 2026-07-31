const Equipment = require(
  "../models/equipment.model",
);

const {
  EquipmentRequest,
} = require(
  "../models/equipmentRequest.model",
);

const {
  sendEquipmentRequestConfirmation,
} = require(
  "../services/equipmentRequestEmail.service",
);

const {
  createRoleNotification,
} = require(
  "../services/notification.service",
);

class EquipmentRequestController {
  /*
  |--------------------------------------------------------------------------
  | Create Equipment Request
  |--------------------------------------------------------------------------
  |
  | Public endpoint.
  |
  */

  createEquipmentRequest = async (
    req,
    res,
  ) => {
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

    const equipment =
      await Equipment.findOne({
        _id: equipmentId,
        isActive: true,
      })
        .populate({
          path: "category",
          select: "name slug",
          match: {
            isActive: true,
          },
        });

    if (
      !equipment ||
      !equipment.category
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment is not available.",
      });
    }

    const equipmentRequest =
      await EquipmentRequest.create({
        equipment: equipment._id,
        fullName,
        email,
        phone,
        company,
        workLocation,
        estimatedRequiredDays,
        workDescription,
      });

    const notificationResult =
      await Promise.allSettled([
        createRoleNotification({
          targetRoles: [
            "superadmin",
            "equipmentManager",
          ],

          type: "equipmentRequest",

          title:
            "New Equipment Request",

          message:
            `${fullName} submitted a request for ${equipment.title}.`,

          entityType:
            "EquipmentRequest",

          entityId:
            equipmentRequest._id,

          metadata: {
            equipmentId:
              equipment._id,

            equipmentTitle:
              equipment.title,

            requesterName:
              fullName,
          },
        }),

        sendEquipmentRequestConfirmation({
          to: email,
          fullName,
          equipmentTitle:
            equipment.title,

          requestId:
            equipmentRequest._id,

          company,
          workLocation,
          estimatedRequiredDays,
        }),
      ]);

    const [
      notificationDelivery,
      emailDelivery,
    ] = notificationResult;

    if (
      notificationDelivery.status ===
      "rejected"
    ) {
      console.error(
        "Equipment request notification failed:",
        {
          requestId:
            equipmentRequest._id,

          message:
            notificationDelivery
              .reason?.message,
        },
      );
    }

    if (
      emailDelivery.status ===
      "fulfilled"
    ) {
      equipmentRequest.emailDelivery.confirmationSent =
        true;

      equipmentRequest.emailDelivery.sentAt =
        new Date();

      equipmentRequest.emailDelivery.errorMessage =
        null;
    } else {
      equipmentRequest.emailDelivery.confirmationSent =
        false;

      equipmentRequest.emailDelivery.errorMessage =
        emailDelivery.reason?.message ||
        "Confirmation email failed";

      console.error(
        "Equipment request confirmation email failed:",
        {
          requestId:
            equipmentRequest._id,

          email,

          message:
            emailDelivery.reason?.message,
        },
      );
    }

    await equipmentRequest.save({
      validateBeforeSave: false,
    });

    return res.status(201).json({
      success: true,
      message:
        "Your equipment request has been received successfully. Our team will contact you shortly.",
      data: {
        requestId:
          equipmentRequest._id,

        status:
          equipmentRequest.status,

        confirmationEmailSent:
          equipmentRequest.emailDelivery
            .confirmationSent,
      },
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get All Equipment Requests
  |--------------------------------------------------------------------------
  */

  getAllEquipmentRequests = async (
    req,
    res,
  ) => {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.equipment) {
      filter.equipment =
        req.query.equipment;
    }

    const requests =
      await EquipmentRequest.find(filter)
        .populate(
          "equipment",
          "title slug image location",
        )
        .populate(
          "handledBy",
          "fullName email",
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Equipment Request By ID
  |--------------------------------------------------------------------------
  */

  getEquipmentRequestById = async (
    req,
    res,
  ) => {
    const equipmentRequest =
      await EquipmentRequest.findById(
        req.params.id,
      )
        .populate(
          "equipment",
          "title slug image location primarySpecification",
        )
        .populate(
          "handledBy",
          "fullName email",
        )
        .lean();

    if (!equipmentRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: equipmentRequest,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Update Request Status
  |--------------------------------------------------------------------------
  */

  updateEquipmentRequestStatus = async (
    req,
    res,
  ) => {
    const equipmentRequest =
      await EquipmentRequest.findById(
        req.params.id,
      );

    if (!equipmentRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment request not found.",
      });
    }

    equipmentRequest.status =
      req.body.status;

    equipmentRequest.handledBy =
      req.user._id;

    if (
      req.body.status === "contacted" &&
      !equipmentRequest.contactedAt
    ) {
      equipmentRequest.contactedAt =
        new Date();
    }

    await equipmentRequest.save();

    await equipmentRequest.populate(
      "handledBy",
      "fullName email",
    );

    return res.status(200).json({
      success: true,
      message:
        "Equipment request status updated successfully.",
      data: equipmentRequest,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Update Admin Notes
  |--------------------------------------------------------------------------
  */

  updateEquipmentRequestNotes = async (
    req,
    res,
  ) => {
    const equipmentRequest =
      await EquipmentRequest.findById(
        req.params.id,
      );

    if (!equipmentRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment request not found.",
      });
    }

    equipmentRequest.adminNotes =
      req.body.adminNotes;

    equipmentRequest.handledBy =
      req.user._id;

    await equipmentRequest.save();

    return res.status(200).json({
      success: true,
      message:
        "Equipment request notes updated successfully.",
      data: equipmentRequest,
    });
  };
}

module.exports =
  new EquipmentRequestController();