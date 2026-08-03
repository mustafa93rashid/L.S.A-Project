const {
  sendJobRequestReceivedEmail,
  sendJobRequestStatusEmail,
} = require("../services/email.service");

const {
  createJobRequestNotification,
} = require("../services/notification.service");

const {
  uploadMulterDocument,
  deleteResource,
  RESOURCE_TYPES,
} = require("../services/cloudinary.service");

// ==================== Constants ====================

const JOB_REQUEST_POPULATE_FIELDS = [
  {
    path: "job",
    select: "title location employmentType department status deadline",
  },

  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

const STATUS_DATE_FIELDS = {
  reviewed: "reviewedAt",
  shortlisted: "shortlistedAt",
  accepted: "acceptedAt",
  rejected: "rejectedAt",
  ignored: "ignoredAt",
};

const STATUS_EMAILS = ["accepted", "rejected"];

const JOB_REQUEST_STATUSES = [
  "new",
  "reviewed",
  "shortlisted",
  "accepted",
  "rejected",
  "ignored",
];

const CV_FOLDER = "resumes";

const CV_PREFIX = "job-request-cv";

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

  if (query.job) {
    filter.job = query.job;
  }

  if (query.search) {
    const searchTerm = escapeRegex(query.search.trim());

    filter.$or = [
      {
        firstName: {
          $regex: searchTerm,
          $options: "i",
        },
      },

      {
        lastName: {
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

// ==================== Format CV ====================

const formatCv = ({ uploadedFile, file }) => {
  return {
    url: uploadedFile.url,
    publicId: uploadedFile.publicId,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    resourceType: uploadedFile.resourceType || RESOURCE_TYPES.RAW,
  };
};

// ==================== Upload CV ====================

const uploadCv = async (file) => {
  if (!file) {
    const error = new Error("CV file is required");

    error.statusCode = 400;
    error.code = "CV_FILE_REQUIRED";

    throw error;
  }

  const uploadedFile = await uploadMulterDocument({
    file,
    folder: CV_FOLDER,
    prefix: CV_PREFIX,
  });

  return formatCv({
    uploadedFile,
    file,
  });
};

// ==================== Delete CV Safely ====================

const deleteCvSafely = async (cv) => {
  if (!cv?.publicId) {
    return;
  }

  try {
    await deleteResource({
      publicId: cv.publicId,

      resourceType: cv.resourceType || RESOURCE_TYPES.RAW,
    });
  } catch (error) {
    console.error("Failed to delete job request CV:", {
      publicId: cv.publicId,
      message: error.message,
      code: error.code,
    });
  }
};

// ==================== Send Received Email Safely ====================

const sendReceivedEmailSafely = async ({ jobRequest, job }) => {
  try {
    await sendJobRequestReceivedEmail({
      to: jobRequest.email,

      fullName: `${jobRequest.firstName} ${jobRequest.lastName}`,

      jobTitle: job.title,

      requestId: jobRequest._id,
    });
  } catch (error) {
    console.error("Job request received email failed:", {
      jobRequestId: jobRequest._id,

      email: jobRequest.email,

      message: error.message,
    });
  }
};

// ==================== Create Notification Safely ====================

const createNotificationSafely = async ({ jobRequest, job }) => {
  try {
    await createJobRequestNotification({
      jobRequest,
      job,
    });
  } catch (error) {
    console.error("Job request notification failed:", {
      jobRequestId: jobRequest._id,

      message: error.message,
    });
  }
};

// ==================== Process Job Request Side Effects ====================

const processJobRequestSideEffects = async ({ jobRequest, job }) => {
  await Promise.allSettled([
    sendReceivedEmailSafely({
      jobRequest,
      job,
    }),

    createNotificationSafely({
      jobRequest,
      job,
    }),
  ]);
};

// ==================== Send Status Email Safely ====================

const sendStatusEmailSafely = async ({ jobRequest, job, status }) => {
  if (!STATUS_EMAILS.includes(status)) {
    return;
  }

  try {
    await sendJobRequestStatusEmail({
      to: jobRequest.email,

      fullName: `${jobRequest.firstName} ${jobRequest.lastName}`,

      jobTitle: job.title,

      status,
    });
  } catch (error) {
    console.error("Job request status email failed:", {
      jobRequestId: jobRequest._id,

      email: jobRequest.email,

      status,

      message: error.message,
    });
  }
};

// ==================== Update Job Request Status ====================

const updateJobRequestStatus = (jobRequest, status) => {
  const previousStatus = jobRequest.status;

  if (previousStatus === status) {
    return;
  }

  const previousDateField = STATUS_DATE_FIELDS[previousStatus];

  if (previousDateField) {
    jobRequest[previousDateField] = null;
  }

  jobRequest.status = status;

  const newDateField = STATUS_DATE_FIELDS[status];

  if (newDateField) {
    jobRequest[newDateField] = new Date();
  }
};

// ==================== Build Job Request Statistics ====================

const buildJobRequestStatistics = async (JobRequest) => {
  const groupedStatuses = await JobRequest.aggregate([
    {
      $group: {
        _id: "$status",

        count: {
          $sum: 1,
        },
      },
    },
  ]);

  const statusCounts = JOB_REQUEST_STATUSES.reduce((result, status) => {
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

// ==================== Check Duplicate Application ====================

const jobApplicationExists = async ({ JobRequest, jobId, email }) => {
  return JobRequest.exists({
    job: jobId,
    email,
  });
};

// ==================== Exports ====================

module.exports = {
  JOB_REQUEST_POPULATE_FIELDS,
  STATUS_DATE_FIELDS,
  STATUS_EMAILS,
  JOB_REQUEST_STATUSES,

  getCurrentUserId,
  escapeRegex,

  buildDashboardFilter,
  buildPagination,
  buildPaginationResponse,

  uploadCv,
  deleteCvSafely,

  processJobRequestSideEffects,
  sendStatusEmailSafely,

  updateJobRequestStatus,
  buildJobRequestStatistics,

  jobApplicationExists,
};
