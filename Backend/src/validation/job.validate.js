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

/*
|--------------------------------------------------------------------------
| Create Job Validation
|--------------------------------------------------------------------------
*/

const createJobValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Job title is required.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage(
      "Job title must be between 2 and 150 characters.",
    ),

  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage(
      "Short description is required.",
    )
    .isLength({
      min: 10,
      max: 500,
    })
    .withMessage(
      "Short description must be between 10 and 500 characters.",
    ),

  body("description")
    .trim()
    .notEmpty()
    .withMessage(
      "Description is required.",
    )
    .isLength({
      min: 20,
      max: 5000,
    })
    .withMessage(
      "Description must be between 20 and 5000 characters.",
    ),

  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required.")
    .isLength({
      max: 150,
    })
    .withMessage(
      "Location cannot exceed 150 characters.",
    ),

  body("employmentType")
    .notEmpty()
    .withMessage(
      "Employment type is required.",
    )
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(
      `Employment type must be one of: ${EMPLOYMENT_TYPES.join(", ")}.`,
    ),

  body("department")
    .notEmpty()
    .withMessage(
      "Department is required.",
    )
    .isIn(JOB_DEPARTMENTS)
    .withMessage(
      `Department must be one of: ${JOB_DEPARTMENTS.join(", ")}.`,
    ),

  body("responsibilities")
    .isArray({
      min: 1,
    })
    .withMessage(
      "At least one responsibility is required.",
    ),

  body("responsibilities.*")
    .trim()
    .notEmpty()
    .withMessage(
      "Responsibility cannot be empty.",
    )
    .isLength({
      max: 300,
    })
    .withMessage(
      "Responsibility cannot exceed 300 characters.",
    ),

  body("requirements")
    .isArray({
      min: 1,
    })
    .withMessage(
      "At least one requirement is required.",
    ),

  body("requirements.*")
    .trim()
    .notEmpty()
    .withMessage(
      "Requirement cannot be empty.",
    )
    .isLength({
      max: 300,
    })
    .withMessage(
      "Requirement cannot exceed 300 characters.",
    ),

  body("status")
    .optional()
    .isIn(JOB_STATUSES)
    .withMessage(
      `Status must be one of: ${JOB_STATUSES.join(", ")}.`,
    ),

  body("deadline")
    .optional({
      nullable: true,
    })
    .isISO8601()
    .withMessage(
      "Deadline must be a valid date.",
    )
    .toDate(),

  validate,
];

/*
|--------------------------------------------------------------------------
| Update Job Validation
|--------------------------------------------------------------------------
*/

const updateJobValidation = [
  ...createJobValidation.slice(0, -1),

  validate,
];



/*
|--------------------------------------------------------------------------
| Job ID Validation
|--------------------------------------------------------------------------
*/

const jobIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid job ID."),

  validate,
];

/*
|--------------------------------------------------------------------------
| Job Query Validation
|--------------------------------------------------------------------------
*/

const jobQueryValidation = [
  query("status")
    .optional()
    .isIn(JOB_STATUSES)
    .withMessage("Invalid status."),

  query("department")
    .optional()
    .isIn(JOB_DEPARTMENTS)
    .withMessage(
      "Invalid department.",
    ),

  query("employmentType")
    .optional()
    .isIn(EMPLOYMENT_TYPES)
    .withMessage(
      "Invalid employment type.",
    ),

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Page must be greater than 0.",
    )
    .toInt(),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Limit must be between 1 and 100.",
    )
    .toInt(),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 100,
    })
    .withMessage(
      "Search keyword is too long.",
    ),

  validate,
];

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  createJobValidation,
  updateJobValidation,
  jobIdValidation,
  jobQueryValidation,
};