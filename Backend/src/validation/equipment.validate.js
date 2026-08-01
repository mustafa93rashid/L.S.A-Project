const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const DEFAULT_SAFETY_CERTIFICATE_MESSAGE =
  "This equipment includes a valid safety certificate. We can provide it upon request.";

/*
|--------------------------------------------------------------------------
| JSON Sanitizers
|--------------------------------------------------------------------------
*/

// ==================================================
// Parse JSON Object
// ==================================================

const parseJsonObject = (fieldName) => {
  return body(fieldName).customSanitizer((value) => {
    if (value === undefined || value === null || value === "") {
      return value;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return value;
    }

    if (typeof value !== "string") {
      throw new Error(`${fieldName} must be an object.`);
    }

    try {
      const parsedValue = JSON.parse(value);

      if (typeof parsedValue !== "object" || parsedValue === null || Array.isArray(parsedValue)) {
        throw new Error(`${fieldName} must be an object.`);
      }

      return parsedValue;
    } catch (error) {
      if (error.message === `${fieldName} must be an object.`) {
        throw error;
      }

      throw new Error(`${fieldName} must contain valid JSON.`);
    }
  });
};

// ==================================================
// Normalize Safety Certificate
// ==================================================

const normalizeSafetyCertificate = body("safetyCertificate").customSanitizer((value) => {
  if (value === undefined || value === null || value === "") {
    return value;
  }

  let certificate = value;

  if (typeof certificate === "string") {
    try {
      certificate = JSON.parse(certificate);
    } catch {
      throw new Error("safetyCertificate must contain valid JSON.");
    }
  }

  if (typeof certificate !== "object" || certificate === null || Array.isArray(certificate)) {
    return certificate;
  }

  let isAvailable = certificate.isAvailable;

  if (typeof isAvailable === "string") {
    const normalizedValue = isAvailable.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalizedValue)) {
      isAvailable = true;
    }

    if (["false", "0", "no", "off"].includes(normalizedValue)) {
      isAvailable = false;
    }
  }

  let message = certificate.message;

  if (typeof message === "string") {
    message = message.trim();
  }

  if (isAvailable === true && !message) {
    message = DEFAULT_SAFETY_CERTIFICATE_MESSAGE;
  }

  if (isAvailable === false) {
    message = "";
  }

  return {
    isAvailable,
    message,
  };
});

/*
|--------------------------------------------------------------------------
| Custom Validators
|--------------------------------------------------------------------------
*/

// ==================================================
// Validate Primary Specification
// ==================================================

const validatePrimarySpecification = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("primarySpecification must be an object.");
  }

  if (typeof value.label !== "string" || !value.label.trim()) {
    throw new Error("primarySpecification.label is required.");
  }

  if (value.label.trim().length < 2 || value.label.trim().length > 100) {
    throw new Error("primarySpecification.label must be between 2 and 100 characters.");
  }

  if (typeof value.value !== "string" || !value.value.trim()) {
    throw new Error("primarySpecification.value is required.");
  }

  if (value.value.trim().length > 150) {
    throw new Error("primarySpecification.value cannot exceed 150 characters.");
  }

  value.label = value.label.trim();
  value.value = value.value.trim();

  return true;
};

// ==================================================
// Validate Safety Certificate
// ==================================================

const validateSafetyCertificate = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("safetyCertificate must be an object.");
  }

  if (value.isAvailable === undefined) {
    throw new Error("safetyCertificate.isAvailable is required.");
  }

  if (typeof value.isAvailable !== "boolean") {
    throw new Error("safetyCertificate.isAvailable must be true or false.");
  }

  if (value.message === undefined) {
    throw new Error("safetyCertificate.message is required.");
  }

  if (typeof value.message !== "string") {
    throw new Error("safetyCertificate.message must be a string.");
  }

  if (value.message.length > 500) {
    throw new Error("safetyCertificate.message cannot exceed 500 characters.");
  }

  if (value.isAvailable && !value.message.trim()) {
    throw new Error("safetyCertificate.message is required when the certificate is available.");
  }

  if (!value.isAvailable && value.message.trim()) {
    throw new Error("safetyCertificate.message must be empty when the certificate is unavailable.");
  }

  return true;
};

// ==================================================
// Require Equipment Update Field
// ==================================================

const requireEquipmentUpdateField = body().custom((value, { req }) => {
  const allowedFields = [
    "title",
    "slug",
    "category",
    "shortDescription",
    "description",
    "primarySpecification",
    "location",
    "availableUnits",
    "safetyCertificate",
    "displayOrder",
    "isActive",
    "imageAlt",
  ];

  const hasBodyField = allowedFields.some((field) => req.body[field] !== undefined);
  const hasImage = Boolean(req.file);

  if (!hasBodyField && !hasImage) {
    throw new Error("At least one equipment field or image must be provided.");
  }

  return true;
});

/*
|--------------------------------------------------------------------------
| File Validation
|--------------------------------------------------------------------------
*/

// ==================================================
// Required Equipment Image
// ==================================================

const requiredEquipmentImageValidation = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [
        {
          field: "image",
          message: "Equipment image is required.",
        },
      ],
    });
  }

  return next();
};

/*
|--------------------------------------------------------------------------
| Category Shared Validations
|--------------------------------------------------------------------------
*/

const categoryDisplayOrderValidation = body("displayOrder")
  .optional()
  .isInt({
    min: 0,
  })
  .withMessage("Category display order must be a non-negative integer.")
  .toInt();

const categoryIsActiveValidation = body("isActive")
  .optional()
  .isBoolean()
  .withMessage("Category isActive must be true or false.")
  .toBoolean();

/*
|--------------------------------------------------------------------------
| Create Category Validation
|--------------------------------------------------------------------------
*/

const createCategoryValidation = [
  body("name")
    .isString()
    .withMessage("Category name must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Category name is required.")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Category name must be between 2 and 100 characters."),

  body("slug")
    .isString()
    .withMessage("Category slug must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Category slug is required.")
    .matches(slugRegex)
    .withMessage("Category slug must contain lowercase letters, numbers, and hyphens only."),

  categoryDisplayOrderValidation,

  categoryIsActiveValidation,

  validate,
];

/*
|--------------------------------------------------------------------------
| Update Category Validation
|--------------------------------------------------------------------------
*/

const updateCategoryValidation = [
  body("name")
    .optional()
    .isString()
    .withMessage("Category name must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty.")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Category name must be between 2 and 100 characters."),

  body("slug")
    .optional()
    .isString()
    .withMessage("Category slug must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Category slug cannot be empty.")
    .matches(slugRegex)
    .withMessage("Category slug must contain lowercase letters, numbers, and hyphens only."),

  categoryDisplayOrderValidation,

  categoryIsActiveValidation,

  validate,
];

/*
|--------------------------------------------------------------------------
| Equipment Shared Validations
|--------------------------------------------------------------------------
*/

const equipmentDisplayOrderValidation = body("displayOrder")
  .optional()
  .isInt({
    min: 0,
  })
  .withMessage("Equipment display order must be a non-negative integer.")
  .toInt();

const equipmentIsActiveValidation = body("isActive")
  .optional()
  .isBoolean()
  .withMessage("Equipment isActive must be true or false.")
  .toBoolean();

const equipmentImageAltValidation = body("imageAlt")
  .optional()
  .isString()
  .withMessage("Image alt text must be a string.")
  .bail()
  .trim()
  .isLength({
    max: 250,
  })
  .withMessage("Image alt text cannot exceed 250 characters.");

/*
|--------------------------------------------------------------------------
| Create Equipment Validation
|--------------------------------------------------------------------------
*/

const createEquipmentValidation = [
  body("title")
    .isString()
    .withMessage("Equipment title must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment title is required.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Equipment title must be between 2 and 150 characters."),

  body("slug")
    .isString()
    .withMessage("Equipment slug must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment slug is required.")
    .matches(slugRegex)
    .withMessage("Equipment slug must contain lowercase letters, numbers, and hyphens only."),

  body("category")
    .notEmpty()
    .withMessage("Equipment category is required.")
    .bail()
    .isMongoId()
    .withMessage("Equipment category must contain a valid category ID."),

  body("shortDescription")
    .isString()
    .withMessage("Short description must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Short description is required.")
    .isLength({
      min: 10,
      max: 500,
    })
    .withMessage("Short description must be between 10 and 500 characters."),

  body("description")
    .isString()
    .withMessage("Equipment description must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment description is required.")
    .isLength({
      min: 10,
      max: 5000,
    })
    .withMessage("Equipment description must be between 10 and 5000 characters."),

  parseJsonObject("primarySpecification"),

  body("primarySpecification")
    .notEmpty()
    .withMessage("primarySpecification is required.")
    .bail()
    .custom(validatePrimarySpecification),

  body("location")
    .isString()
    .withMessage("Equipment location must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment location is required.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Equipment location must be between 2 and 150 characters."),

  body("availableUnits")
    .notEmpty()
    .withMessage("Available units are required.")
    .bail()
    .isInt({
      min: 0,
    })
    .withMessage("Available units must be a non-negative integer.")
    .toInt(),

  normalizeSafetyCertificate,

  body("safetyCertificate")
    .notEmpty()
    .withMessage("safetyCertificate is required.")
    .bail()
    .custom(validateSafetyCertificate),

  equipmentDisplayOrderValidation,

  equipmentIsActiveValidation,

  equipmentImageAltValidation,

  validate,

  requiredEquipmentImageValidation,
];

/*
|--------------------------------------------------------------------------
| Update Equipment Validation
|--------------------------------------------------------------------------
*/

const updateEquipmentValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Equipment title must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment title cannot be empty.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Equipment title must be between 2 and 150 characters."),

  body("slug")
    .optional()
    .isString()
    .withMessage("Equipment slug must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment slug cannot be empty.")
    .matches(slugRegex)
    .withMessage("Equipment slug must contain lowercase letters, numbers, and hyphens only."),

  body("category")
    .optional()
    .isMongoId()
    .withMessage("Equipment category must contain a valid category ID."),

  body("shortDescription")
    .optional()
    .isString()
    .withMessage("Short description must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Short description cannot be empty.")
    .isLength({
      min: 10,
      max: 500,
    })
    .withMessage("Short description must be between 10 and 500 characters."),

  body("description")
    .optional()
    .isString()
    .withMessage("Equipment description must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment description cannot be empty.")
    .isLength({
      min: 10,
      max: 5000,
    })
    .withMessage("Equipment description must be between 10 and 5000 characters."),

  parseJsonObject("primarySpecification").optional(),

  body("primarySpecification").optional().custom(validatePrimarySpecification),

  body("location")
    .optional()
    .isString()
    .withMessage("Equipment location must be a string.")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Equipment location cannot be empty.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Equipment location must be between 2 and 150 characters."),

  body("availableUnits")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage("Available units must be a non-negative integer.")
    .toInt(),

  normalizeSafetyCertificate.optional(),

  body("safetyCertificate").optional().custom(validateSafetyCertificate),

  equipmentDisplayOrderValidation,

  equipmentIsActiveValidation,

  equipmentImageAltValidation,

  requireEquipmentUpdateField,

  validate,
];

/*
|--------------------------------------------------------------------------
| Route Parameter Validation
|--------------------------------------------------------------------------
*/

const equipmentIdValidation = [
  param("id").isMongoId().withMessage("Invalid equipment ID."),

  validate,
];

const categoryIdValidation = [
  param("id").isMongoId().withMessage("Invalid equipment category ID."),

  validate,
];

const equipmentSlugValidation = [
  param("slug").trim().matches(slugRegex).withMessage("Invalid equipment slug."),

  validate,
];

/*
|--------------------------------------------------------------------------
| Public Query Validation
|--------------------------------------------------------------------------
*/

const equipmentPublicQueryValidation = [
  query("category")
    .optional()
    .trim()
    .matches(slugRegex)
    .withMessage("Category filter must contain a valid slug."),

  query("search")
    .optional()
    .isString()
    .withMessage("Search value must be a string.")
    .bail()
    .trim()
    .isLength({
      min: 1,
      max: 100,
    })
    .withMessage("Search value must be between 1 and 100 characters."),

  validate,
];

/*
|--------------------------------------------------------------------------
| Dashboard Query Validation
|--------------------------------------------------------------------------
*/

const equipmentDashboardQueryValidation = [
  query("category")
    .optional()
    .isMongoId()
    .withMessage("Category filter must contain a valid category ID."),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive filter must be true or false.")
    .toBoolean(),

  query("search")
    .optional()
    .isString()
    .withMessage("Search value must be a string.")
    .bail()
    .trim()
    .isLength({
      min: 1,
      max: 100,
    })
    .withMessage("Search value must be between 1 and 100 characters."),

  validate,
];

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  createCategoryValidation,
  updateCategoryValidation,

  createEquipmentValidation,
  updateEquipmentValidation,

  equipmentIdValidation,
  categoryIdValidation,
  equipmentSlugValidation,

  equipmentPublicQueryValidation,
  equipmentDashboardQueryValidation,
};

