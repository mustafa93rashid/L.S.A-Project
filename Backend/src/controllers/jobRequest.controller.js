const { JobRequest } = require("../models/jobRequest.model");

const { Job } = require("../models/job.model");

const {
  JOB_REQUEST_POPULATE_FIELDS,
  getCurrentUserId,
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
} = require("../helpers/jobRequest.helper");

// ==================== Job Request Controller ====================

class JobRequestController {
  // ==================== Create Job Request ====================

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
        message: "The selected job is not available",
      });
    }

    if (job.deadline && new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "The application deadline for this job has passed",
      });
    }

    const duplicateApplication = await jobApplicationExists({
      JobRequest,
      jobId: job._id,
      email,
    });

    if (duplicateApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job",
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

      await processJobRequestSideEffects({
        jobRequest,
        job,
      });

      return res.status(201).json({
        success: true,
        message: "Your job application has been submitted successfully",

        data: {
          _id: jobRequest._id,
          job: jobRequest.job,
          firstName: jobRequest.firstName,
          lastName: jobRequest.lastName,
          email: jobRequest.email,
          phone: jobRequest.phone,
          status: jobRequest.status,
          createdAt: jobRequest.createdAt,
        },
      });
    } catch (error) {
      await deleteCvSafely(cv);

      throw error;
    }
  };

  // ==================== Get All Job Requests ====================

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

  // ==================== Get Job Request By ID ====================

  getJobRequestById = async (req, res) => {
    const jobRequest = await JobRequest.findById(req.params.id)
      .populate(JOB_REQUEST_POPULATE_FIELDS)
      .lean();

    if (!jobRequest) {
      return res.status(404).json({
        success: false,
        message: "Job request not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: jobRequest,
    });
  };

  // ==================== Update Job Request Status ====================

  updateJobRequestStatus = async (req, res) => {
    const jobRequest = await JobRequest.findById(req.params.id).populate(
      "job",
      "title location employmentType department",
    );

    if (!jobRequest) {
      return res.status(404).json({
        success: false,
        message: "Job request not found",
      });
    }

    const { status } = req.body;

    updateJobRequestStatus(jobRequest, status);

    jobRequest.updatedBy = getCurrentUserId(req);

    await jobRequest.save();

    await sendStatusEmailSafely({
      jobRequest,
      job: jobRequest.job,
      status,
    });

    await jobRequest.populate("updatedBy", "fullName email role");

    return res.status(200).json({
      success: true,
      message: "Job request status updated successfully",
      data: jobRequest,
    });
  };

  // ==================== Delete Job Request ====================

  deleteJobRequest = async (req, res) => {
    const jobRequest = await JobRequest.findById(req.params.id);

    if (!jobRequest) {
      return res.status(404).json({
        success: false,
        message: "Job request not found",
      });
    }

    const cv = jobRequest.cv?.toObject
      ? jobRequest.cv.toObject()
      : jobRequest.cv;

    await jobRequest.deleteOne();

    await deleteCvSafely(cv);

    return res.status(200).json({
      success: true,
      message: "Job request deleted successfully",
    });
  };

  // ==================== Get Job Request Statistics ====================

  getJobRequestStatistics = async (req, res) => {
    const statistics = await buildJobRequestStatistics(JobRequest);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  };
}

module.exports = new JobRequestController();
