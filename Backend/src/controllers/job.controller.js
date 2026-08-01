const { Job } = require("../models/job.model");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const JOB_POPULATE_FIELDS = [
  {
    path: "createdBy",
    select: "fullName email",
  },
  {
    path: "updatedBy",
    select: "fullName email",
  },
];

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

  if (query.department) {
    filter.department = query.department;
  }

  if (query.employmentType) {
    filter.employmentType = query.employmentType;
  }

  if (query.search) {
    const searchTerm = escapeRegex(query.search.trim());

    filter.$or = [
      {
        title: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        location: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        department: {
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

  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

/*
|--------------------------------------------------------------------------
| Job Controller
|--------------------------------------------------------------------------
*/

class JobController {
  // ==================================================
  // Create Job
  // ==================================================

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

    const job = await Job.create({
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

      publishedAt: status === "published" ? new Date() : null,

      createdBy: currentUserId,
      updatedBy: currentUserId,
    });

    await job.populate(JOB_POPULATE_FIELDS);

    return res.status(201).json({
      success: true,

      message: "Job created successfully.",

      data: job,
    });
  };

  // ==================================================
  // Get All Jobs
  // ==================================================

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

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      data: jobs,
    });
  };

  // ==================================================
  // Get Public Jobs
  // ==================================================

  getPublicJobs = async (req, res) => {
    const filter = {
      status: "published",
    };

    if (req.query.department) {
      filter.department = req.query.department;
    }

    if (req.query.employmentType) {
      filter.employmentType = req.query.employmentType;
    }

    if (req.query.search) {
      const searchTerm = escapeRegex(req.query.search.trim());

      filter.$or = [
        {
          title: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          shortDescription: {
            $regex: searchTerm,
            $options: "i",
          },
        },
        {
          location: {
            $regex: searchTerm,
            $options: "i",
          },
        },
      ];
    }

    const jobs = await Job.find(filter)
      .sort({
        publishedAt: -1,
      })
      .lean();

    return res.status(200).json({
      success: true,

      count: jobs.length,

      data: jobs,
    });
  };

  // ==================================================
  // Get Job By ID
  // ==================================================

  getJobById = async (req, res) => {
    const job = await Job.findById(req.params.id).populate(JOB_POPULATE_FIELDS);

    if (!job) {
      return res.status(404).json({
        success: false,

        message: "Job not found.",
      });
    }

    return res.status(200).json({
      success: true,

      data: job,
    });
  };

  // ==================================================
  // Update Job
  // ==================================================

  updateJob = async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,

        message: "Job not found.",
      });
    }

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

    job.title = title;
    job.shortDescription = shortDescription;
    job.description = description;
    job.location = location;
    job.employmentType = employmentType;
    job.department = department;
    job.responsibilities = responsibilities;
    job.requirements = requirements;
    job.deadline = deadline;

    if (status && job.status !== status) {
      job.status = status;

      if (status === "published" && !job.publishedAt) {
        job.publishedAt = new Date();
      }
    }

    job.updatedBy = getCurrentUserId(req);

    await job.save();

    await job.populate(JOB_POPULATE_FIELDS);

    return res.status(200).json({
      success: true,

      message: "Job updated successfully.",

      data: job,
    });
  };

  // ==================================================
  // Delete Job
  // ==================================================

  deleteJob = async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,

        message: "Job not found.",
      });
    }

    await job.deleteOne();

    return res.status(200).json({
      success: true,

      message: "Job deleted successfully.",
    });
  };

}

module.exports = new JobController();
