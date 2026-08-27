const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

const { JOB_REQUEST_STATUSES } = require("../models/jobRequest.model");

const {
  DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE,
} = require("../middlewares/upload.middleware");

// ==================== Constants ====================

const PHONE_REGEX = /^[0-9+\-()\s]{7,30}$/;

// ==================== Validate CV File ====================

const validateCvFile = (req, res, next) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [
        {
          field: "cv",
          message: "CV file is required",
          value: null,
        },
      ],
    });
  }

  if (!DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [
        {
          field: "cv",
          message: "Only PDF, DOC, and DOCX files are allowed",
          value: file.mimetype,
        },
      ],
    });
  }

  if (file.size > MAX_DOCUMENT_SIZE) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [
        {
          field: "cv",
          message: "CV file size cannot exceed 10 MB",
          value: file.size,
        },
      ],
    });
  }

  return next();
};

// ==================== Create Job Request Validation ====================

const createJobRequestValidation = [
  body("job")
    .notEmpty()
    .withMessage("Job ID is required")
    .bail()
    .isMongoId()
    .withMessage("Job ID must be valid"),

  body("firstName")
    .isString()
    .withMessage("First name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("First name must be between 2 and 100 characters"),

  body("lastName")
    .isString()
    .withMessage("Last name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Last name must be between 2 and 100 characters"),

    body("clientRequestId")
  .notEmpty()
  .withMessage(
    "Client request ID is required",
  )
  .bail()
  .isString()
  .withMessage(
    "Client request ID must be a string",
  )
  .bail()
  .trim()
  .isUUID()
  .withMessage(
    "Client request ID must be a valid UUID",
  ),
  
  body("email")
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Email address must be valid")
    .normalizeEmail(),

  body("phone")
    .isString()
    .withMessage("Phone number must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .matches(PHONE_REGEX)
    .withMessage("Phone number format is invalid"),

  validate,
];

// ==================== Update Job Request Status Validation ====================

const updateJobRequestStatusValidation = [
  body("status")
    .isString()
    .withMessage("Job request status must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Job request status is required")
    .bail()
    .isIn(JOB_REQUEST_STATUSES)
    .withMessage(
      `Job request status must be one of: ${JOB_REQUEST_STATUSES.join(", ")}`,
    ),

  validate,
];

// ==================== Job Request ID Validation ====================

const jobRequestIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Job request ID is required")
    .bail()
    .isMongoId()
    .withMessage("Job request ID must be valid"),

  validate,
];

// ==================== Job Request Query Validation ====================

const jobRequestQueryValidation = [
  query("status")
    .optional()
    .isString()
    .withMessage("Status filter must be a string")
    .bail()
    .trim()
    .isIn(JOB_REQUEST_STATUSES)
    .withMessage(
      `Status filter must be one of: ${JOB_REQUEST_STATUSES.join(", ")}`,
    ),

  query("job")
    .optional()
    .isMongoId()
    .withMessage("Job filter must be a valid ID"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search value must be a string")
    .bail()
    .trim()
    .isLength({
      min: 1,
      max: 150,
    })
    .withMessage("Search value must be between 1 and 150 characters"),

  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),

  validate,
];

// ==================== Exports ====================

module.exports = {
  validateCvFile,
  createJobRequestValidation,
  updateJobRequestStatusValidation,
  jobRequestIdValidation,
  jobRequestQueryValidation,
};
