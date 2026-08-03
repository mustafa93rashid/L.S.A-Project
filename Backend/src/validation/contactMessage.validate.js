const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

const {
  CONTACT_MESSAGE_SERVICES,
  CONTACT_MESSAGE_STATUSES,
} = require("../models/contactMessage.model");

// ==================== Constants ====================

const PHONE_REGEX = /^[0-9+\-()\s]{7,30}$/;

// ==================== Create Contact Message Validation ====================

const createContactMessageValidation = [
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .bail()
    .isString()
    .withMessage("Full name must be a string")
    .bail()
    .trim()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Full name must be between 2 and 150 characters"),

  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Email address must be valid")
    .normalizeEmail(),

  body("phone")
    .notEmpty()
    .withMessage("Phone number is required")
    .bail()
    .isString()
    .withMessage("Phone number must be a string")
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("Phone number format is invalid"),

  body("service")
    .optional()
    .isString()
    .withMessage("Service must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Service cannot be empty")
    .bail()
    .isIn(CONTACT_MESSAGE_SERVICES)
    .withMessage(
      `Service must be one of: ${CONTACT_MESSAGE_SERVICES.join(", ")}`,
    ),

  body("projectDescription")
    .notEmpty()
    .withMessage("Project description is required")
    .bail()
    .isString()
    .withMessage("Project description must be a string")
    .bail()
    .trim()
    .isLength({
      min: 10,
      max: 5000,
    })
    .withMessage("Project description must be between 10 and 5000 characters"),

  validate,
];

// ==================== Update Contact Message Status Validation ====================

const updateContactMessageStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("Contact message status is required")
    .bail()
    .isString()
    .withMessage("Contact message status must be a string")
    .bail()
    .trim()
    .isIn(CONTACT_MESSAGE_STATUSES)
    .withMessage(
      `Contact message status must be one of: ${CONTACT_MESSAGE_STATUSES.join(", ")}`,
    ),

  validate,
];

// ==================== Contact Message ID Validation ====================

const contactMessageIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Contact message ID is required")
    .bail()
    .isMongoId()
    .withMessage("Contact message ID must be valid"),

  validate,
];

// ==================== Contact Message Query Validation ====================

const contactMessageQueryValidation = [
  query("status")
    .optional()
    .isString()
    .withMessage("Status filter must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Status filter cannot be empty")
    .bail()
    .isIn(CONTACT_MESSAGE_STATUSES)
    .withMessage(
      `Status filter must be one of: ${CONTACT_MESSAGE_STATUSES.join(", ")}`,
    ),

  query("service")
    .optional()
    .isString()
    .withMessage("Service filter must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Service filter cannot be empty")
    .bail()
    .isIn(CONTACT_MESSAGE_SERVICES)
    .withMessage(
      `Service filter must be one of: ${CONTACT_MESSAGE_SERVICES.join(", ")}`,
    ),

  query("search")
    .optional()
    .isString()
    .withMessage("Search value must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Search value cannot be empty")
    .bail()
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
  createContactMessageValidation,
  updateContactMessageStatusValidation,
  contactMessageIdValidation,
  contactMessageQueryValidation,
};
