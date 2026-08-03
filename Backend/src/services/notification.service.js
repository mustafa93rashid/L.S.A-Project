const { Notification } = require("../models/notification.model");

const { emitToRoles } = require("../config/socket");

// ==================== Notification Roles ====================

const EQUIPMENT_NOTIFICATION_ROLES = [
  "superadmin",
  "manager",
  "equipmentManager",
];

const JOB_NOTIFICATION_ROLES = ["superadmin", "manager", "hrManager"];

const CONTACT_NOTIFICATION_ROLES = ["superadmin", "manager", "contentManager"];

// ==================== Emit Notification Safely ====================

const emitNotificationSafely = ({ roles, notification }) => {
  try {
    emitToRoles(roles, "notification:new", {
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("Failed to emit dashboard notification:", {
      notificationId: notification?._id,

      type: notification?.type,

      message: error.message,
    });
  }
};

// ==================== Create Equipment Request Notification ====================

const createEquipmentRequestNotification = async ({
  equipmentRequest,
  equipment,
}) => {
  const notification = await Notification.create({
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

      requesterName: equipmentRequest.fullName,

      requesterEmail: equipmentRequest.email,

      company: equipmentRequest.company,

      status: equipmentRequest.status,
    },

    isRead: false,
  });

  emitNotificationSafely({
    roles: EQUIPMENT_NOTIFICATION_ROLES,

    notification,
  });

  return notification;
};

// ==================== Create Job Request Notification ====================

const createJobRequestNotification = async ({ jobRequest, job }) => {
  const applicantName = `${jobRequest.firstName} ${jobRequest.lastName}`.trim();

  const notification = await Notification.create({
    type: "jobRequest",

    title: "New Job Application",

    message: `${applicantName} applied for "${job.title}".`,

    reference: {
      model: "JobRequest",

      id: jobRequest._id,
    },

    metadata: {
      applicantName,

      applicantEmail: jobRequest.email,

      phone: jobRequest.phone,

      jobId: job._id,

      jobTitle: job.title,

      status: jobRequest.status,
    },

    isRead: false,
  });

  emitNotificationSafely({
    roles: JOB_NOTIFICATION_ROLES,

    notification,
  });

  return notification;
};

// ==================== Create Contact Message Notification ====================

const createContactMessageNotification = async ({ contactMessage }) => {
  const notification = await Notification.create({
    type: "contactMessage",

    title: "New Contact Message",

    message: `${contactMessage.fullName} submitted a new inquiry about "${contactMessage.service}".`,

    reference: {
      model: "ContactMessage",

      id: contactMessage._id,
    },

    metadata: {
      senderName: contactMessage.fullName,

      senderEmail: contactMessage.email,

      senderPhone: contactMessage.phone,

      service: contactMessage.service,

      status: contactMessage.status,
    },

    isRead: false,
  });

  emitNotificationSafely({
    roles: CONTACT_NOTIFICATION_ROLES,

    notification,
  });

  return notification;
};

// ==================== Exports ====================

module.exports = {
  createEquipmentRequestNotification,
  createJobRequestNotification,
  createContactMessageNotification,
};
