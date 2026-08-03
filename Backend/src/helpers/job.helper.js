// ==================== Constants ====================

const JOB_POPULATE_FIELDS = [
  {
    path: "createdBy",
    select: "fullName email role",
  },

  {
    path: "updatedBy",
    select: "fullName email role",
  },
];

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

// ==================== Build Public Filter ====================

const buildPublicFilter = (query) => {
  const filter = {
    status: "published",
  };

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

  return filter;
};

// ==================== Build Pagination ====================

const buildPagination = (query) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

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

// ==================== Update Job Fields ====================

const updateJobFields = (job, data) => {
  const editableFields = [
    "title",
    "shortDescription",
    "description",
    "location",
    "employmentType",
    "department",
    "responsibilities",
    "requirements",
    "deadline",
  ];

  editableFields.forEach((field) => {
    if (data[field] !== undefined) {
      job[field] = data[field];
    }
  });
};

// ==================== Update Job Status ====================

const updateJobStatus = (job, status) => {
  if (status === undefined || status === job.status) {
    return;
  }

  job.status = status;

  if (status === "published") {
    job.publishedAt = new Date();
  }

  if (status !== "published") {
    job.publishedAt = null;
  }
};

// ==================== Exports ====================

module.exports = {
  JOB_POPULATE_FIELDS,

  getCurrentUserId,

  buildDashboardFilter,
  buildPublicFilter,

  buildPagination,
  buildPaginationResponse,

  updateJobFields,
  updateJobStatus,
};
