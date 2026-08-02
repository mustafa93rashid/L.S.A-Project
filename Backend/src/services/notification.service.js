const {
  Notification,
} = require("../models/notification.model");

/*
|--------------------------------------------------------------------------
| Notification Service
|--------------------------------------------------------------------------
*/

// ==================================================
// Create Equipment Request Notification
// ==================================================

const createEquipmentRequestNotification = async ({
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
      requesterName: equipmentRequest.fullName,
      requesterEmail: equipmentRequest.email,
      company: equipmentRequest.company,
    },

    isRead: false,
  });
};

// ==================================================
// Create Job Request Notification
// ==================================================

const createJobRequestNotification = async ({
  jobRequest,
  job,
}) => {
  const applicantName =
    `${jobRequest.firstName} ${jobRequest.lastName}`.trim();

  return Notification.create({
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
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  createEquipmentRequestNotification,
  createJobRequestNotification,
};