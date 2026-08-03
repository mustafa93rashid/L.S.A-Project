const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================== Create Team Member Validation ====================

const createTeamMemberValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Team member full name is required")
    .bail()
    .isLength({ min: 2, max: 32 })
    .withMessage("Full name must be between 2 and 32 characters"),

  body("position")
    .trim()
    .notEmpty()
    .withMessage("Team member position is required")
    .bail()
    .isLength({ min: 2, max: 32 })
    .withMessage("Position must be between 2 and 32 characters"),

  body("experience")
    .trim()
    .notEmpty()
    .withMessage("Experience is required")
    .bail()
    .isLength({ min: 2, max: 15 })
    .withMessage("Experience must be between 2 and 15 characters"),

  body("displayOrder")
    .optional()
    .isInt({ min: 0, max: 999 })
    .withMessage("Display order must be between 0 and 999")
    .toInt(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false")
    .toBoolean(),

  body().custom((value, { req }) => {
    if (!req.file) {
      throw new Error("Team member image is required");
    }

    return true;
  }),

  validate,
];

// ==================== Update Team Member Validation ====================

const updateTeamMemberValidation = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 32 })
    .withMessage("Full name must be between 2 and 32 characters"),

  body("position")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Position cannot be empty")
    .bail()
    .isLength({ min: 2, max: 32 })
    .withMessage("Position must be between 2 and 32 characters"),

  body("experience")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Experience cannot be empty")
    .bail()
    .isLength({ min: 2, max: 15 })
    .withMessage("Experience must be between 2 and 15 characters"),

  body("displayOrder")
    .optional()
    .isInt({ min: 0, max: 999 })
    .withMessage("Display order must be between 0 and 999")
    .toInt(),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be true or false")
    .toBoolean(),

  body().custom((value, { req }) => {
    const editableFields = [
      "fullName",
      "position",
      "experience",
      "displayOrder",
      "isActive",
    ];

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

// ==================== Team Member ID Validation ====================

const teamMemberIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Team member ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid team member ID"),

  validate,
];

module.exports = {
  createTeamMemberValidation,
  updateTeamMemberValidation,
  teamMemberIdValidation,
};
