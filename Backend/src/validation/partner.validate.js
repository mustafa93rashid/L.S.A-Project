const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================================================
// Create Partner Validation
// ==================================================
const createPartnerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Partner name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Partner name must be between 2 and 100 characters",
    ),

  body("website")
    .optional({ checkFalsy: true })
    .trim()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage(
      "Website must be a valid URL including http:// or https://",
    ),

  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Partner logo is required",
      });
    }

    next();
  },

  validate,
];

// ==================================================
// Update Partner Validation
// ==================================================
const updatePartnerValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid partner ID"),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Partner name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Partner name must be between 2 and 100 characters",
    ),

  body("website")
    .optional({ checkFalsy: true })
    .trim()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage(
      "Website must be a valid URL including http:// or https://",
    ),

  body().custom((value, { req }) => {
    const hasName = req.body.name !== undefined;
    const hasWebsite = req.body.website !== undefined;
    const hasLogo = Boolean(req.file);

    if (!hasName && !hasWebsite && !hasLogo) {
      throw new Error(
        "At least one field must be provided for update",
      );
    }

    return true;
  }),

  validate,
];

// ==================================================
// Partner ID Validation
// ==================================================
const partnerIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid partner ID"),

  validate,
];

module.exports = {
  createPartnerValidation,
  updatePartnerValidation,
  partnerIdValidation,
};