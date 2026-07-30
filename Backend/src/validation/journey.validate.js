const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================================================
// Create Journey Validation
// ==================================================
const createJourneyValidation = [
  body("period")
    .trim()
    .notEmpty()
    .withMessage("Journey period is required")
    .isLength({ max: 50 })
    .withMessage("Journey period cannot exceed 50 characters"),

  body("title")
    .trim()
    .notEmpty()
    .withMessage("Journey title is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Journey title must be between 2 and 150 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Journey description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Journey description must be between 10 and 1000 characters"),

  body("icon")
    .trim()
    .notEmpty()
    .withMessage("Journey icon is required")
    .isLength({ max: 100 })
    .withMessage("Journey icon cannot exceed 100 characters"),

  body("side")
    .trim()
    .notEmpty()
    .withMessage("Journey side is required")
    .isIn(["left", "right"])
    .withMessage("Journey side must be left or right"),

  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Journey image is required",
      });
    }

    next();
  },

  validate,
];

// ==================================================
// Update Journey Validation
// ==================================================
const updateJourneyValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid journey ID"),

  body("period")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey period cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Journey period cannot exceed 50 characters"),

  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey title cannot be empty")
    .isLength({ min: 2, max: 150 })
    .withMessage("Journey title must be between 2 and 150 characters"),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey description cannot be empty")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Journey description must be between 10 and 1000 characters"),

  body("icon")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Journey icon cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Journey icon cannot exceed 100 characters"),

  body("side")
    .optional()
    .trim()
    .isIn(["left", "right"])
    .withMessage("Journey side must be left or right"),

  body().custom((value, { req }) => {
    const hasPeriod = req.body.period !== undefined;
    const hasTitle = req.body.title !== undefined;
    const hasDescription = req.body.description !== undefined;
    const hasIcon = req.body.icon !== undefined;
    const hasSide = req.body.side !== undefined;
    const hasImage = Boolean(req.file);

    if (
      !hasPeriod &&
      !hasTitle &&
      !hasDescription &&
      !hasIcon &&
      !hasSide &&
      !hasImage
    ) {
      throw new Error(
        "At least one field must be provided for update",
      );
    }

    return true;
  }),

  validate,
];

// ==================================================
// Journey ID Validation
// ==================================================
const journeyIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid journey ID"),

  validate,
];

module.exports = {
  createJourneyValidation,
  updateJourneyValidation,
  journeyIdValidation,
};