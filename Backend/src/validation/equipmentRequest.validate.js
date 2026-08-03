const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

const {
  EQUIPMENT_REQUEST_STATUSES,
} = require("../models/equipmentRequest.model");

// ==================== Constants ====================

const PHONE_REGEX = /^[0-9+\-()\s]{7,30}$/;

// ==================== Create Equipment Request Validation ====================

const createEquipmentRequestValidation = [
  body("equipment")
    .notEmpty()
    .withMessage("Equipment ID is required")
    .bail()
    .isMongoId()
    .withMessage("Equipment ID must be valid"),

  body("fullName")
    .isString()
    .withMessage("Full name must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .bail()
    .isLength({ min: 2, max: 150 })
    .withMessage("Full name must be between 2 and 150 characters"),

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

  body("company")
    .isString()
    .withMessage("Company must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Company is required")
    .bail()
    .isLength({ min: 2, max: 200 })
    .withMessage("Company must be between 2 and 200 characters"),

  body("workLocation")
    .isString()
    .withMessage("Work location must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Work location is required")
    .bail()
    .isLength({ min: 2, max: 250 })
    .withMessage("Work location must be between 2 and 250 characters"),

  body("estimatedRequiredDays")
    .notEmpty()
    .withMessage("Estimated required days is required")
    .bail()
    .isInt({ min: 1, max: 3650 })
    .withMessage(
      "Estimated required days must be an integer between 1 and 3650",
    )
    .toInt(),

  body("workDescription")
    .isString()
    .withMessage("Work description must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Work description is required")
    .bail()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Work description must be between 10 and 5000 characters"),

  validate,
];

// ==================== Update Equipment Request Status Validation ====================

const updateEquipmentRequestStatusValidation = [
  body("status")
    .isString()
    .withMessage("Request status must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Request status is required")
    .bail()
    .isIn(EQUIPMENT_REQUEST_STATUSES)
    .withMessage(
      `Request status must be one of: ${EQUIPMENT_REQUEST_STATUSES.join(", ")}`,
    ),

  validate,
];

// ==================== Equipment Request ID Validation ====================

const equipmentRequestIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Equipment request ID is required")
    .bail()
    .isMongoId()
    .withMessage("Equipment request ID must be valid"),

  validate,
];

// ==================== Dashboard Query Validation ====================

const equipmentRequestQueryValidation = [
  query("status")
    .optional()
    .isString()
    .withMessage("Status filter must be a string")
    .bail()
    .trim()
    .isIn(EQUIPMENT_REQUEST_STATUSES)
    .withMessage(
      `Status filter must be one of: ${EQUIPMENT_REQUEST_STATUSES.join(", ")}`,
    ),

  query("equipment")
    .optional()
    .isMongoId()
    .withMessage("Equipment filter must be a valid ID"),

  query("search")
    .optional()
    .isString()
    .withMessage("Search value must be a string")
    .bail()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage("Search value must be between 1 and 150 characters"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100")
    .toInt(),

  validate,
];

// ==================== Exports ====================

module.exports = {
  createEquipmentRequestValidation,
  updateEquipmentRequestStatusValidation,
  equipmentRequestIdValidation,
  equipmentRequestQueryValidation,
};
