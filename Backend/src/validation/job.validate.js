const {
  body,
  param,
  query,
} = require("express-validator");

const validate = require("../middlewares/validate");

const {
  JOB_STATUSES,
  EMPLOYMENT_TYPES,
  JOB_DEPARTMENTS,
} = require("../models/job.model");

// ==================== Create Job Validation ====================

const createJobValidation = [
  body("title")
    .isString()
    .withMessage("Job title must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Job title is required")
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Job title must be between 2 and 150 characters",
    ),

  body("shortDescription")
    .isString()
    .withMessage(
      "Short description must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Short description is required",
    )
    .bail()
    .isLength({
      min: 10,
      max: 500,
    })
    .withMessage(
      "Short description must be between 10 and 500 characters",
    ),

  body("description")
    .isString()
    .withMessage(
      "Description must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Description is required",
    )
    .bail()
    .isLength({
      min: 20,
      max: 5000,
    })
    .withMessage(
      "Description must be between 20 and 5000 characters",
    ),

  body("location")
    .isString()
    .withMessage(
      "Location must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Location is required",
    )
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Location must be between 2 and 150 characters",
    ),

  body("employmentType")
    .isString()
    .withMessage(
      "Employment type must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Employment type is required",
    )
    .bail()
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(
      `Employment type must be one of: ${EMPLOYMENT_TYPES.join(", ")}`,
    ),

  body("department")
    .isString()
    .withMessage(
      "Department must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Department is required",
    )
    .bail()
    .isIn(JOB_DEPARTMENTS)
    .withMessage(
      `Department must be one of: ${JOB_DEPARTMENTS.join(", ")}`,
    ),

  body("responsibilities")
    .isArray({
      min: 1,
      max: 30,
    })
    .withMessage(
      "Responsibilities must contain between 1 and 30 items",
    ),

  body("responsibilities.*")
    .isString()
    .withMessage(
      "Each responsibility must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Responsibility cannot be empty",
    )
    .bail()
    .isLength({
      min: 2,
      max: 300,
    })
    .withMessage(
      "Each responsibility must be between 2 and 300 characters",
    ),

  body("requirements")
    .isArray({
      min: 1,
      max: 30,
    })
    .withMessage(
      "Requirements must contain between 1 and 30 items",
    ),

  body("requirements.*")
    .isString()
    .withMessage(
      "Each requirement must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Requirement cannot be empty",
    )
    .bail()
    .isLength({
      min: 2,
      max: 300,
    })
    .withMessage(
      "Each requirement must be between 2 and 300 characters",
    ),

  body("status")
    .optional()
    .isString()
    .withMessage(
      "Status must be a string",
    )
    .bail()
    .trim()
    .isIn(JOB_STATUSES)
    .withMessage(
      `Status must be one of: ${JOB_STATUSES.join(", ")}`,
    ),

  body("deadline")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Deadline must be a valid date",
    )
    .toDate(),

  validate,
];

// ==================== Update Job Validation ====================

const updateJobValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage(
      "Job title must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Job title cannot be empty",
    )
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Job title must be between 2 and 150 characters",
    ),

  body("shortDescription")
    .optional()
    .isString()
    .withMessage(
      "Short description must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Short description cannot be empty",
    )
    .bail()
    .isLength({
      min: 10,
      max: 500,
    })
    .withMessage(
      "Short description must be between 10 and 500 characters",
    ),

  body("description")
    .optional()
    .isString()
    .withMessage(
      "Description must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Description cannot be empty",
    )
    .bail()
    .isLength({
      min: 20,
      max: 5000,
    })
    .withMessage(
      "Description must be between 20 and 5000 characters",
    ),

  body("location")
    .optional()
    .isString()
    .withMessage(
      "Location must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Location cannot be empty",
    )
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Location must be between 2 and 150 characters",
    ),

  body("employmentType")
    .optional()
    .isString()
    .withMessage(
      "Employment type must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Employment type cannot be empty",
    )
    .bail()
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(
      `Employment type must be one of: ${EMPLOYMENT_TYPES.join(", ")}`,
    ),

  body("department")
    .optional()
    .isString()
    .withMessage(
      "Department must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Department cannot be empty",
    )
    .bail()
    .isIn(JOB_DEPARTMENTS)
    .withMessage(
      `Department must be one of: ${JOB_DEPARTMENTS.join(", ")}`,
    ),

  body("responsibilities")
    .optional()
    .isArray({
      min: 1,
      max: 30,
    })
    .withMessage(
      "Responsibilities must contain between 1 and 30 items",
    ),

  body("responsibilities.*")
    .optional()
    .isString()
    .withMessage(
      "Each responsibility must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Responsibility cannot be empty",
    )
    .bail()
    .isLength({
      min: 2,
      max: 300,
    })
    .withMessage(
      "Each responsibility must be between 2 and 300 characters",
    ),

  body("requirements")
    .optional()
    .isArray({
      min: 1,
      max: 30,
    })
    .withMessage(
      "Requirements must contain between 1 and 30 items",
    ),

  body("requirements.*")
    .optional()
    .isString()
    .withMessage(
      "Each requirement must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Requirement cannot be empty",
    )
    .bail()
    .isLength({
      min: 2,
      max: 300,
    })
    .withMessage(
      "Each requirement must be between 2 and 300 characters",
    ),

  body("status")
    .optional()
    .isString()
    .withMessage(
      "Status must be a string",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Status cannot be empty",
    )
    .bail()
    .isIn(JOB_STATUSES)
    .withMessage(
      `Status must be one of: ${JOB_STATUSES.join(", ")}`,
    ),

  body("deadline")
    .optional({
      nullable: true,
      checkFalsy: true,
    })
    .isISO8601({
      strict: true,
    })
    .withMessage(
      "Deadline must be a valid date",
    )
    .toDate(),

  body().custom((value, { req }) => {
    const editableFields = [
      "title",
      "shortDescription",
      "description",
      "location",
      "employmentType",
      "department",
      "responsibilities",
      "requirements",
      "status",
      "deadline",
    ];

    const hasField = editableFields.some(
      (field) =>
        req.body[field] !== undefined,
    );

    if (!hasField) {
      throw new Error(
        "At least one job field must be provided for update",
      );
    }

    return true;
  }),

  validate,
];

// ==================== Job ID Validation ====================

const jobIdValidation = [
  param("id")
    .notEmpty()
    .withMessage(
      "Job ID is required",
    )
    .bail()
    .isMongoId()
    .withMessage(
      "Invalid job ID",
    ),

  validate,
];

// ==================== Job Query Validation ====================

const jobQueryValidation = [
  query("status")
    .optional()
    .isString()
    .withMessage(
      "Status filter must be a string",
    )
    .bail()
    .trim()
    .isIn(JOB_STATUSES)
    .withMessage(
      `Status must be one of: ${JOB_STATUSES.join(", ")}`,
    ),

  query("department")
    .optional()
    .isString()
    .withMessage(
      "Department filter must be a string",
    )
    .bail()
    .trim()
    .isIn(JOB_DEPARTMENTS)
    .withMessage(
      `Department must be one of: ${JOB_DEPARTMENTS.join(", ")}`,
    ),

  query("employmentType")
    .optional()
    .isString()
    .withMessage(
      "Employment type filter must be a string",
    )
    .bail()
    .trim()
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(
      `Employment type must be one of: ${EMPLOYMENT_TYPES.join(", ")}`,
    ),

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Page must be a positive integer",
    )
    .toInt(),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Limit must be between 1 and 100",
    )
    .toInt(),

  query("search")
    .optional()
    .isString()
    .withMessage(
      "Search keyword must be a string",
    )
    .bail()
    .trim()
    .isLength({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Search keyword must be between 1 and 100 characters",
    ),

  validate,
];

// ==================== Exports ====================

module.exports = {
  createJobValidation,
  updateJobValidation,
  jobIdValidation,
  jobQueryValidation,
};