const { body } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================== Constants ====================

const PHONE_REGEX = /^[0-9+\-()\s]{7,30}$/;

const SOCIAL_URL_FIELDS = ["facebook", "instagram", "linkedin"];

// ==================== URL Validator ====================

const isValidUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);

    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

// ==================== Save Contact Information Validation ====================

const saveContactInfoValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Title cannot be empty")
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Title must be between 2 and 150 characters"),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .bail()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage("Description cannot exceed 1000 characters"),

  // ==================== Location Validation ====================

  body("location")
    .optional()
    .isObject()
    .withMessage("Location must be an object"),

  body("location.address")
    .optional()
    .isString()
    .withMessage("Address must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty")
    .bail()
    .isLength({
      min: 2,
      max: 500,
    })
    .withMessage("Address must be between 2 and 500 characters"),

  body("location.mapUrl")
    .optional({
      checkFalsy: true,
    })
    .isString()
    .withMessage("Map URL must be a string")
    .bail()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage("Map URL cannot exceed 1000 characters")
    .bail()
    .custom((value) => {
      if (!isValidUrl(value)) {
        throw new Error("Map URL must be a valid HTTP or HTTPS URL");
      }

      return true;
    }),

  // ==================== Phone Validation ====================

  body("phones")
    .optional()
    .isArray({
      min: 1,
      max: 10,
    })
    .withMessage("Phones must contain between 1 and 10 phone numbers")
    .bail()
    .customSanitizer((phones) => {
      return [...new Set(phones.map((phone) => String(phone).trim()))];
    }),

  body("phones.*")
    .optional()
    .isString()
    .withMessage("Each phone number must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Phone number cannot be empty")
    .bail()
    .matches(PHONE_REGEX)
    .withMessage("Phone number format is invalid"),

  body("primaryPhone")
    .optional()
    .isString()
    .withMessage("Primary phone number must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Primary phone number cannot be empty")
    .bail()
    .matches(PHONE_REGEX)
    .withMessage("Primary phone number format is invalid")
    .bail()
    .custom((value, { req }) => {
      if (req.body.phones === undefined) {
        return true;
      }

      const phones = Array.isArray(req.body.phones)
        ? req.body.phones.map((phone) => String(phone).trim())
        : [];

      if (!phones.includes(value.trim())) {
        throw new Error("Primary phone number must exist in the phones list");
      }

      return true;
    }),

  // ==================== Email Validation ====================

  body("email")
    .optional()
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("Email address must be valid")
    .normalizeEmail(),

  // ==================== Working Hours Validation ====================

  body("workingHours")
    .optional()
    .isString()
    .withMessage("Working hours must be a string")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Working hours cannot be empty")
    .bail()
    .isLength({
      max: 250,
    })
    .withMessage("Working hours cannot exceed 250 characters"),

  body("emergencyHours")
    .optional()
    .isString()
    .withMessage("Emergency hours must be a string")
    .bail()
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage("Emergency hours cannot exceed 250 characters"),

  // ==================== Social Links Validation ====================

  body("socialLinks")
    .optional()
    .isObject()
    .withMessage("Social links must be an object"),

  ...SOCIAL_URL_FIELDS.map((field) =>
    body(`socialLinks.${field}`)
      .optional({
        checkFalsy: true,
      })
      .isString()
      .withMessage(`${field} link must be a string`)
      .bail()
      .trim()
      .isLength({
        max: 1000,
      })
      .withMessage(`${field} link cannot exceed 1000 characters`)
      .bail()
      .custom((value) => {
        if (!isValidUrl(value)) {
          throw new Error(`${field} link must be a valid HTTP or HTTPS URL`);
        }

        return true;
      }),
  ),

  body("socialLinks.whatsapp")
    .optional({
      checkFalsy: true,
    })
    .isString()
    .withMessage("WhatsApp value must be a string")
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage("WhatsApp phone number format is invalid"),

  // ==================== Display Settings Validation ====================

  body("isActive")
    .optional()
    .isIn(["true", "false", true, false])
    .withMessage("isActive must be true or false")
    .customSanitizer((value) => {
      return value === true || value === "true";
    }),

  // ==================== Require At Least One Field ====================

  body().custom((value, { req }) => {
    const editableFields = [
      "title",
      "description",
      "location",
      "phones",
      "primaryPhone",
      "email",
      "workingHours",
      "emergencyHours",
      "socialLinks",
      "isActive",
    ];

    const hasField = editableFields.some(
      (field) => req.body[field] !== undefined,
    );

    if (!hasField) {
      throw new Error(
        "At least one contact information field must be provided",
      );
    }

    return true;
  }),

  validate,
];

// ==================== Exports ====================

module.exports = {
  saveContactInfoValidation,
};
