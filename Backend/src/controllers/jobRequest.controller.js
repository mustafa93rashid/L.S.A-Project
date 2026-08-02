const { JobRequest } = require("../models/jobRequest.model");

const { Job } = require("../models/job.model");

const {
  uploadMulterDocument,
  deleteResource,
  RESOURCE_TYPES,
} = require("../services/cloudinary.service");

const {
  sendJobRequestReceivedEmail,
  sendJobRequestStatusEmail,
} = require("../services/email.service");

const {
  createJobRequestNotification,
} = require("../services/notification.service");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

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

const EMAIL_STATUSES = ["accepted", "rejected"];

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

// ==================================================
// Build Pagination
// ==================================================

const buildPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

// ==================================================
// Format CV
// ==================================================

const formatCv = (uploadedFile, originalName) => {
  return {
    url: uploadedFile.url,

    publicId: uploadedFile.publicId,

    originalName,

    resourceType: uploadedFile.resourceType,
  };
};

// ==================================================
// Upload CV
// ==================================================

const uploadCv = async (file) => {
  if (!file) {
    const error = new Error("CV file is required.");

    error.statusCode = 400;
    error.code = "CV_FILE_REQUIRED";

    throw error;
  }

  const uploadedFile = await uploadMulterDocument({
    file,

    folder: "resumes",

    prefix: "job-request-cv",
  });

  return formatCv(uploadedFile, file.originalname);
};

// ==================================================
// Delete CV Safely
// ==================================================

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
    });
  }
};

// ==================================================
// Send Status Email Safely
// ==================================================

const sendStatusEmailSafely = async ({ jobRequest, job, status }) => {
  if (!EMAIL_STATUSES.includes(status)) {
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
// ==================================================
// Send Received Email Safely
// ==================================================

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
// ==================================================
// Create Notification Safely
// ==================================================

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

/*
|--------------------------------------------------------------------------
| Job Request Controller
|--------------------------------------------------------------------------
*/

class JobRequestController {
  /*
    |--------------------------------------------------------------------------
    | Public
    |--------------------------------------------------------------------------
    */

  // ==================================================
  // Create Job Request
  // ==================================================

  createJobRequest = async (req, res) => {
    const { job: jobId, firstName, lastName, email, phone } = req.body;

    const job = await Job.findOne({
      _id: jobId,
      status: "published",
    })
      .select("title location employmentType department status deadline")
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,

        message: "The selected job is not available.",
      });
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        success: false,

        message: "The application deadline for this job has passed.",
      });
    }

    const cv = await uploadCv(req.file);

    try {
      const jobRequest = await JobRequest.create({
        job: job._id,

        firstName,

        lastName,

        email,

        phone,

        cv,

        status: "new",
      });

      await jobRequest.populate(JOB_REQUEST_POPULATE_FIELDS);

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

      return res.status(201).json({
        success: true,

        message: "Your job application has been submitted successfully.",

        data: {
          request: {
            _id: jobRequest._id,

            job: jobRequest.job,

            firstName: jobRequest.firstName,

            lastName: jobRequest.lastName,

            email: jobRequest.email,

            phone: jobRequest.phone,

            status: jobRequest.status,

            createdAt: jobRequest.createdAt,
          },
        },
      });
    } catch (error) {
      await deleteCvSafely(cv);

      throw error;
    }
  };

  /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

  // ==================================================
  // Get All Job Requests
  // ==================================================

  getAllJobRequests = async (req, res) => {
    const filter = buildDashboardFilter(req.query);

    const { page, limit, skip } = buildPagination(req.query);

    const [requests, total] = await Promise.all([
      JobRequest.find(filter)
        .populate(JOB_REQUEST_POPULATE_FIELDS)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      JobRequest.countDocuments(filter),
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
  // Get Job Request By ID
  // ==================================================

  getJobRequestById = async (req, res) => {
    const jobRequest = await JobRequest.findById(req.params.id)
      .populate(JOB_REQUEST_POPULATE_FIELDS)
      .lean();

    if (!jobRequest) {
      return res.status(404).json({
        success: false,

        message: "Job request not found.",
      });
    }

    return res.status(200).json({
      success: true,

      data: jobRequest,
    });
  };


// ==================================================
// Update Job Request Status
// ==================================================

updateJobRequestStatus = async (req, res) => {
  const jobRequest = await JobRequest.findById(req.params.id).populate(
    "job",
    "title location employmentType department",
  );

  if (!jobRequest) {
    return res.status(404).json({
      success: false,
      message: "Job request not found.",
    });
  }

  const { status } = req.body;

  const previousStatus = jobRequest.status;

  jobRequest.status = status;
  jobRequest.updatedBy = getCurrentUserId(req);

  const newDateField = STATUS_DATE_FIELDS[status];

  if (newDateField && !jobRequest[newDateField]) {
    jobRequest[newDateField] = new Date();
  }

  const previousDateField = STATUS_DATE_FIELDS[previousStatus];

  if (previousDateField && previousStatus !== status) {
    jobRequest[previousDateField] = null;
  }

  await jobRequest.save();

  await sendStatusEmailSafely({
    jobRequest,
    job: jobRequest.job,
    status,
  });

  await jobRequest.populate(
    "updatedBy",
    "fullName email role",
  );

  return res.status(200).json({
    success: true,
    message: "Job request status updated successfully.",
    data: jobRequest,
  });
};
  // ==================================================
  // Delete Job Request
  // ==================================================

  deleteJobRequest = async (req, res) => {
    const jobRequest = await JobRequest.findById(req.params.id);

    if (!jobRequest) {
      return res.status(404).json({
        success: false,

        message: "Job request not found.",
      });
    }

    const cv = jobRequest.cv?.toObject
      ? jobRequest.cv.toObject()
      : jobRequest.cv;

    await jobRequest.deleteOne();

    await deleteCvSafely(cv);

    return res.status(200).json({
      success: true,

      message: "Job request deleted successfully.",
    });
  };

  // ==================================================
  // Get Job Request Statistics
  // ==================================================

  getJobRequestStatistics = async (req, res) => {
    const statistics = await JobRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const statusCounts = {
      new: 0,
      reviewed: 0,
      shortlisted: 0,
      accepted: 0,
      rejected: 0,
      ignored: 0,
    };

    for (const item of statistics) {
      if (Object.prototype.hasOwnProperty.call(statusCounts, item._id)) {
        statusCounts[item._id] = item.count;
      }
    }

    const total = Object.values(statusCounts).reduce(
      (sum, count) => sum + count,
      0,
    );

    return res.status(200).json({
      success: true,

      data: {
        total,

        ...statusCounts,
      },
    });
  };
}

module.exports = new JobRequestController();
