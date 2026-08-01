const Notification = require("../models/notification.model");

/*
|--------------------------------------------------------------------------
| Notification Service
|--------------------------------------------------------------------------
*/

// ==================================================
// Create Equipment Request Notification
// ==================================================

const createEquipmentRequestNotification =
  async ({
    equipmentRequest,
    equipment,
  }) => {
    return Notification.create({
      type: "equipmentRequest",

      title: "New Equipment Request",

      message: `${equipmentRequest.fullName} submitted a request for "${equipment.title}".`,

      reference: {
        model: "EquipmentRequest",

        id: equipmentRequest._id,
      },

      metadata: {
        equipmentId: equipment._id,

        equipmentTitle: equipment.title,

        requesterName:
          equipmentRequest.fullName,

        requesterEmail:
          equipmentRequest.email,

        company:
          equipmentRequest.company,
      },

      isRead: false,
    });
  };

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  createEquipmentRequestNotification,
};