const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================== Create Partner Validation ====================

const createPartnerValidation = [
  body("website")
    .optional({ checkFalsy: true })
    .trim()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Website must be a valid URL including http:// or https://"),

  body().custom((value, { req }) => {
    if (!req.file) {
      throw new Error("Partner logo is required");
    }

    return true;
  }),

  validate,
];

// ==================== Update Partner Validation ====================

const updatePartnerValidation = [
  body("website")
    .optional({ checkFalsy: true })
    .trim()
    .isURL({
      protocols: ["http", "https"],
      require_protocol: true,
    })
    .withMessage("Website must be a valid URL including http:// or https://"),

  body().custom((value, { req }) => {
    const hasWebsite = req.body.website !== undefined;

    const hasLogo = Boolean(req.file);

    if (!hasWebsite && !hasLogo) {
      throw new Error("At least one field must be provided for update");
    }

    return true;
  }),

  validate,
];

// ==================== Partner ID Validation ====================

const partnerIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Partner ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid partner ID"),

  validate,
];

module.exports = {
  createPartnerValidation,
  updatePartnerValidation,
  partnerIdValidation,
};
