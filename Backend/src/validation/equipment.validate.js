const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const allowedCertificateMimeTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

/*
|--------------------------------------------------------------------------
| JSON Parser
|--------------------------------------------------------------------------
*/

const parseJsonField = (fieldName, expectedType) => {
  return body(fieldName)
    .customSanitizer((value) => {
      if (value === undefined || value === null || value === "") {
        return value;
      }

      if (typeof value !== "string") {
        return value;
      }

      try {
        return JSON.parse(value);
      } catch {
        throw new Error(`${fieldName} must contain valid JSON.`);
      }
    })
    .custom((value) => {
      if (value === undefined || value === null || value === "") {
        return true;
      }

      if (
        expectedType === "object" &&
        (typeof value !== "object" || value === null || Array.isArray(value))
      ) {
        throw new Error(`${fieldName} must be an object.`);
      }

      if (expectedType === "array" && !Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array.`);
      }

      return true;
    });
};

/*
|--------------------------------------------------------------------------
| Shared Helpers
|--------------------------------------------------------------------------
*/

const validateNonEmptyString = (
  value,
  fieldName,
  { min = 1, max = 1000 } = {},
) => {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} must be a non-empty string.`);
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length < min || normalizedValue.length > max) {
    throw new Error(
      `${fieldName} must be between ${min} and ${max} characters.`,
    );
  }

  return true;
};

// ==================================================
// Validate Primary Specification
// ==================================================

const validatePrimarySpecification = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("primarySpecification must be an object.");
  }

  validateNonEmptyString(value.label, "primarySpecification.label", {
    min: 2,
    max: 100,
  });

  validateNonEmptyString(value.value, "primarySpecification.value", {
    min: 1,
    max: 150,
  });

  return true;
};

// ==================================================
// Validate Safety Certificate
// ==================================================

const validateSafetyCertificate = (value) => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("safetyCertificate must be an object.");
  }

  if (
    value.expiresAt !== undefined &&
    value.expiresAt !== null &&
    value.expiresAt !== "" &&
    Number.isNaN(Date.parse(value.expiresAt))
  ) {
    throw new Error("safetyCertificate.expiresAt must be a valid date.");
  }

  return true;
};

/*
|--------------------------------------------------------------------------
| Category Shared Fields
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
    .withMessage(
      "Category slug must contain lowercase letters, numbers, and hyphens only.",
    ),

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
    .withMessage(
      "Category slug must contain lowercase letters, numbers, and hyphens only.",
    ),

  categoryDisplayOrderValidation,

  categoryIsActiveValidation,

  validate,
];

/*
|--------------------------------------------------------------------------
| Shared Equipment Fields
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

const imageAltValidation = body("imageAlt")
  .optional()
  .isString()
  .withMessage("Image alt text must be a string.")
  .bail()
  .trim()
  .isLength({
    max: 250,
  })
  .withMessage("Image alt text cannot exceed 250 characters.");

const removeCertificateValidation = body("removeCertificate")
  .optional()
  .isBoolean()
  .withMessage("removeCertificate must be true or false.")
  .toBoolean();

/*
|--------------------------------------------------------------------------
| File Validation
|--------------------------------------------------------------------------
*/

// ==================================================
// Required Equipment Image
// ==================================================

const requiredEquipmentImageValidation = (req, res, next) => {
  const imageFile = req.files?.image?.[0];

  if (!imageFile) {
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

// ==================================================
// Safety Certificate File
// ==================================================

const safetyCertificateFileValidation = (req, res, next) => {
  const certificateFile = req.files?.safetyCertificate?.[0];

  if (!certificateFile) {
    return next();
  }

  if (!allowedCertificateMimeTypes.includes(certificateFile.mimetype)) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",

      errors: [
        {
          field: "safetyCertificate",

          message:
            "Safety certificate must be a PDF, JPEG, PNG, GIF, or WebP file.",
        },
      ],
    });
  }

  return next();
};

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
    .withMessage(
      "Equipment slug must contain lowercase letters, numbers, and hyphens only.",
    ),

  body("category")
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
    .withMessage(
      "Equipment description must be between 10 and 5000 characters.",
    ),

  parseJsonField("primarySpecification", "object"),

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
    .isInt({
      min: 0,
    })
    .withMessage("Available units must be a non-negative integer.")
    .toInt(),

  parseJsonField("safetyCertificate", "object").optional(),

  body("safetyCertificate").optional().custom(validateSafetyCertificate),

  equipmentDisplayOrderValidation,

  equipmentIsActiveValidation,

  imageAltValidation,

  validate,

  requiredEquipmentImageValidation,

  safetyCertificateFileValidation,
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
    .withMessage(
      "Equipment slug must contain lowercase letters, numbers, and hyphens only.",
    ),

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
    .withMessage(
      "Equipment description must be between 10 and 5000 characters.",
    ),

  parseJsonField("primarySpecification", "object").optional(),

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

  parseJsonField("safetyCertificate", "object").optional(),

  body("safetyCertificate").optional().custom(validateSafetyCertificate),

  equipmentDisplayOrderValidation,

  equipmentIsActiveValidation,

  imageAltValidation,

  removeCertificateValidation,

  validate,

  safetyCertificateFileValidation,
];

/*
|--------------------------------------------------------------------------
| Route Parameters Validation
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
  param("slug")
    .trim()
    .matches(slugRegex)
    .withMessage("Invalid equipment slug."),

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
    .withMessage("isActive filter must be true or false."),

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
