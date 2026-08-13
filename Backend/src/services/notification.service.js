const { Notification } = require("../models/notification.model");
const User = require("../models/user.model");

const { emitToUser } = require("../config/socket");

// ==================== Notification Roles ====================

const EQUIPMENT_NOTIFICATION_ROLES = [
  "superadmin",
  "manager",
  "equipmentManager",
];

const JOB_NOTIFICATION_ROLES = [
  "superadmin",
  "manager",
  "hrManager",
];

const CONTACT_NOTIFICATION_ROLES = [
  "superadmin",
  "manager",
  "contentManager",
];

// ==================== Get Notification Recipients ====================

const getNotificationRecipients = async (roles) => {
  const users = await User.find({
    role: {
      $in: roles,
    },

    isActive: true,

    isAccountActivated: true,
  })
    .select("_id")
    .lean();

  return users;
};

// ==================== Emit Notification Safely ====================

const emitNotificationSafely = ({
  userId,
  notification,
}) => {
  try {
    emitToUser(
      userId,
      "notification:new",
      {
        success: true,
        data: notification,
      },
    );
  } catch (error) {
    console.error(
      "Failed to emit dashboard notification:",
      {
        userId,

        notificationId: notification?._id,

        type: notification?.type,

        message: error.message,
      },
    );
  }
};

// ==================== Create Notifications For Roles ====================

const createNotificationsForRoles = async ({
  roles,
  notificationData,
}) => {
  const recipients =
    await getNotificationRecipients(roles);

  if (recipients.length === 0) {
    return [];
  }

  const notificationsData = recipients.map(
    (user) => ({
      ...notificationData,

      recipient: user._id,

      isRead: false,

      readAt: null,
    }),
  );

  const notifications =
    await Notification.insertMany(
      notificationsData,
    );

  notifications.forEach((notification) => {
    emitNotificationSafely({
      userId: notification.recipient.toString(),

      notification,
    });
  });

  return notifications;
};

// ==================== Create Equipment Request Notification ====================

const createEquipmentRequestNotification =
  async ({
    equipmentRequest,
    equipment,
  }) => {
    const notifications =
      await createNotificationsForRoles({
        roles: EQUIPMENT_NOTIFICATION_ROLES,

        notificationData: {
          type: "equipmentRequest",

          title: "New Equipment Request",

          message: `${equipmentRequest.fullName} submitted a request for "${equipment.title}".`,

          reference: {
            model: "EquipmentRequest",

            id: equipmentRequest._id,
          },

          metadata: {
            equipmentId: equipment._id,

            equipmentTitle:
              equipment.title,

            requesterName:
              equipmentRequest.fullName,

            requesterEmail:
              equipmentRequest.email,

            company:
              equipmentRequest.company,

            status:
              equipmentRequest.status,
          },
        },
      });

    return notifications;
  };

// ==================== Create Job Request Notification ====================

const createJobRequestNotification =
  async ({
    jobRequest,
    job,
  }) => {
    const applicantName =
      `${jobRequest.firstName} ${jobRequest.lastName}`.trim();

    const notifications =
      await createNotificationsForRoles({
        roles: JOB_NOTIFICATION_ROLES,

        notificationData: {
          type: "jobRequest",

          title: "New Job Application",

          message: `${applicantName} applied for "${job.title}".`,

          reference: {
            model: "JobRequest",

            id: jobRequest._id,
          },

          metadata: {
            applicantName,

            applicantEmail:
              jobRequest.email,

            phone:
              jobRequest.phone,

            jobId: job._id,

            jobTitle: job.title,

            status:
              jobRequest.status,
          },
        },
      });

    return notifications;
  };

// ==================== Create Contact Message Notification ====================

const createContactMessageNotification =
  async ({
    contactMessage,
  }) => {
    const notifications =
      await createNotificationsForRoles({
        roles: CONTACT_NOTIFICATION_ROLES,

        notificationData: {
          type: "contactMessage",

          title: "New Contact Message",

          message: `${contactMessage.fullName} submitted a new inquiry about "${contactMessage.service}".`,

          reference: {
            model: "ContactMessage",

            id: contactMessage._id,
          },

          metadata: {
            senderName:
              contactMessage.fullName,

            senderEmail:
              contactMessage.email,

            senderPhone:
              contactMessage.phone,

            service:
              contactMessage.service,

            status:
              contactMessage.status,
          },
        },
      });

    return notifications;
  };

// ==================== Exports ====================

module.exports = {
  createEquipmentRequestNotification,
  createJobRequestNotification,
  createContactMessageNotification,
};