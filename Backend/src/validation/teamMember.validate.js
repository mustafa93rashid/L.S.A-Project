const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================================================
// Create Team Member Validation
// ==================================================

const createTeamMemberValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Team member full name is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be between 2 and 120 characters"),

  body("position")
    .trim()
    .notEmpty()
    .withMessage("Team member position is required")
    .isLength({ min: 2, max: 120 })
    .withMessage("Position must be between 2 and 120 characters"),

  body("experience")
    .trim()
    .notEmpty()
    .withMessage("Experience is required")
    .isLength({ max: 50 })
    .withMessage("Experience cannot exceed 50 characters"),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a positive integer"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),

  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Team member image is required",
      });
    }

    next();
  },

  validate,
];

// ==================================================
// Update Team Member Validation
// ==================================================

const updateTeamMemberValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid team member ID"),

  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be between 2 and 120 characters"),

  body("position")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Position cannot be empty")
    .isLength({ min: 2, max: 120 })
    .withMessage("Position must be between 2 and 120 characters"),

  body("experience")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Experience cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Experience cannot exceed 50 characters"),

  body("displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Display order must be a positive integer"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false"),

  body().custom((value, { req }) => {
    const hasFullName =
      req.body.fullName !== undefined;

    const hasPosition =
      req.body.position !== undefined;

    const hasExperience =
      req.body.experience !== undefined;

    const hasDisplayOrder =
      req.body.displayOrder !== undefined;

    const hasIsActive =
      req.body.isActive !== undefined;

    const hasImage = Boolean(req.file);

    if (
      !hasFullName &&
      !hasPosition &&
      !hasExperience &&
      !hasDisplayOrder &&
      !hasIsActive &&
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
// Team Member ID Validation
// ==================================================

const teamMemberIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid team member ID"),

  validate,
];

module.exports = {
  createTeamMemberValidation,
  updateTeamMemberValidation,
  teamMemberIdValidation,
};