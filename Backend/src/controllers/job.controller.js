const { Job } = require("../models/job.model");

const {
  JOB_POPULATE_FIELDS,
  getCurrentUserId,
  buildDashboardFilter,
  buildPublicFilter,
  buildPagination,
  buildPaginationResponse,
  buildJobStatistics,
  updateJobFields,
  updateJobStatus,
} = require("../helpers/job.helper");

// ==================== Job Controller ====================

class JobController {
  // ==================== Create Job ====================

  createJob = async (req, res) => {
    const {
      title,
      shortDescription,
      description,
      location,
      employmentType,
      department,
      responsibilities,
      requirements,
      status,
      deadline,
    } = req.body;

    const currentUserId = getCurrentUserId(req);

    const finalStatus = status || "draft";

    const job = await Job.create({
      title,
      shortDescription,
      description,
      location,
      employmentType,
      department,
      responsibilities,
      requirements,
      status: finalStatus,
      deadline: deadline || null,
      publishedAt: finalStatus === "published" ? new Date() : null,
      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    await job.populate(JOB_POPULATE_FIELDS);

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      data: job,
    });
  };

  // ==================== Get All Jobs ====================

  getAllJobs = async (req, res) => {
    const filter = buildDashboardFilter(req.query);

    const { page, limit, skip } = buildPagination(req.query);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate(JOB_POPULATE_FIELDS)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: jobs.length,

      pagination: buildPaginationResponse({
        page,
        limit,
        total,
      }),

      data: jobs,
    });
  };

  // ==================== Get Job Statistics ====================

  getJobStatistics = async (req, res) => {
    const statistics = await buildJobStatistics(Job);

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  };

  // ==================== Get Public Jobs ====================

  getPublicJobs = async (req, res) => {
    const filter = buildPublicFilter(req.query);

    const jobs = await Job.find(filter)
      .select("-createdBy -updatedBy")
      .sort({
        publishedAt: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  };

  // ==================== Get Job By ID ====================

  getJobById = async (req, res) => {
    const job = await Job.findById(req.params.id).populate(JOB_POPULATE_FIELDS).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  };

  // ==================== Update Job ====================

  updateJob = async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    updateJobFields(job, req.body);

    updateJobStatus(job, req.body.status);

    job.updatedBy = getCurrentUserId(req);

    await job.save();

    await job.populate(JOB_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Job updated successfully",
      data: job,
    });
  };

  // ==================== Delete Job ====================

  deleteJob = async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  };
}

module.exports = new JobController();