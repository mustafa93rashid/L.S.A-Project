const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================== Period Validation Rule ====================

const periodValidationRule = (optional = false) => {
  let validation = body("period");

  if (optional) {
    validation = validation.optional();
  }

  return validation
    .trim()
    .notEmpty()
    .withMessage(
      optional
        ? "Journey period cannot be empty"
        : "Journey period is required",
    )
    .bail()
    .matches(/^\d{4}( - \d{4})?$/)
    .withMessage("Year must be YYYY or YYYY - YYYY")
    .bail()
    .custom((value) => {
      if (!value.includes(" - ")) {
        return true;
      }

      const [startYear, endYear] = value.split(" - ").map(Number);

      if (endYear < startYear) {
        throw new Error("End year must be greater than or equal to start year");
      }

      return true;
    });
};

// ==================== Create Journey Validation ====================

const createJourneyValidation = [
  periodValidationRule(),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Journey title is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Journey title must be between 2 and 50 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Journey description is required")
    .bail()
    .isLength({ min: 10, max: 160 })
    .withMessage("Journey description must be between 10 and 160 characters"),

  body("icon")
    .trim()
    .notEmpty()
    .withMessage("Journey icon is required")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Journey icon cannot exceed 100 characters"),

  body("side")
    .trim()
    .notEmpty()
    .withMessage("Journey side is required")
    .bail()
    .isIn(["left", "right"])
    .withMessage("Journey side must be left or right"),

  body().custom((value, { req }) => {
    if (!req.file) {
      throw new Error("Journey image is required");
    }

    return true;
  }),

  validate,
];

// ==================== Update Journey Validation ====================

const updateJourneyValidation = [
  periodValidationRule(true),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey title cannot be empty")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Journey title must be between 2 and 50 characters"),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey description cannot be empty")
    .bail()
    .isLength({ min: 10, max: 160 })
    .withMessage("Journey description must be between 10 and 160 characters"),

  body("icon")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey icon cannot be empty")
    .bail()
    .isLength({ max: 100 })
    .withMessage("Journey icon cannot exceed 100 characters"),

  body("side")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey side cannot be empty")
    .bail()
    .isIn(["left", "right"])
    .withMessage("Journey side must be left or right"),

  body().custom((value, { req }) => {
    const editableFields = ["period", "title", "description", "icon", "side"];

    const hasTextField = editableFields.some(
      (field) => req.body[field] !== undefined,
    );

    const hasImage = Boolean(req.file);

    if (!hasTextField && !hasImage) {
      throw new Error("At least one field must be provided for update");
    }

    return true;
  }),

  validate,
];

// ==================== Journey ID Validation ====================

const journeyIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Journey ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid journey ID"),

  validate,
];

module.exports = {
  createJourneyValidation,
  updateJourneyValidation,
  journeyIdValidation,
};
