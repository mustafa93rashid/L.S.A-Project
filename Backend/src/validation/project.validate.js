const { body, param, query } = require("express-validator");

const validate = require("../middlewares/validate");

// ==================== JSON Sanitizer ====================

const parseJsonValue = (fallback) => {
  return (value) => {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }

    if (typeof value !== "string") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  };
};

// ==================== Boolean Validation ====================

const optionalBooleanField = (fieldName) => {
  return body(fieldName)
    .optional()
    .isIn(["true", "false", true, false])
    .withMessage(`${fieldName} must be true or false`)
    .customSanitizer((value) => value === true || value === "true");
};

// ==================== Create Project Validation ====================

const createProjectValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Project title is required")
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Project title must be between 2 and 150 characters"),

  body("slug")
    .trim()
    .notEmpty()
    .withMessage("Project slug is required")
    .bail()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage(
      "Project slug may contain lowercase letters, numbers, and hyphens only",
    ),

  body("categoryLabel")
    .trim()
    .notEmpty()
    .withMessage("Category label is required")
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Category label must be between 2 and 100 characters"),

  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .bail()
    .isLength({
      min: 10,
      max: 500,
    })
    .withMessage("Short description must be between 10 and 500 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Project description is required")
    .bail()
    .isLength({
      min: 20,
      max: 5000,
    })
    .withMessage("Project description must be between 20 and 5000 characters"),

  body("services")
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Services must be an array"),

  body("services.*")
    .isMongoId()
    .withMessage("Each service must contain a valid service ID"),

  body("heroTitle")
    .trim()
    .notEmpty()
    .withMessage("Hero title is required")
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Hero title must be between 2 and 150 characters"),

  body("heroDescription")
    .trim()
    .notEmpty()
    .withMessage("Hero description is required")
    .bail()
    .isLength({
      min: 10,
      max: 1500,
    })
    .withMessage("Hero description must be between 10 and 1500 characters"),

  body("cardImageAlt")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Card image alt cannot exceed 150 characters"),

  body("heroImageAlt")
    .optional({
      checkFalsy: true,
    })
    .trim()
    .isLength({ max: 150 })
    .withMessage("Hero image alt cannot exceed 150 characters"),

  body("projectDetails")
    .customSanitizer(parseJsonValue({}))
    .isObject()
    .withMessage("Project details must be a valid object"),

  body("detailedScope")
    .customSanitizer(parseJsonValue({}))
    .isObject()
    .withMessage("Detailed scope must be a valid object"),

  body("detailedScope.title")
    .trim()
    .notEmpty()
    .withMessage("Detailed scope title is required")
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Detailed scope title must be between 2 and 150 characters"),

  body("detailedScope.description")
    .trim()
    .notEmpty()
    .withMessage("Detailed scope description is required")
    .bail()
    .isLength({
      min: 10,
      max: 1500,
    })
    .withMessage(
      "Detailed scope description must be between 10 and 1500 characters",
    ),

  body("detailedScope.items")
    .optional()
    .isArray({
      max: 20,
    })
    .withMessage(
      "Detailed scope items must be an array with no more than 20 items",
    ),

  body("galleryAlt")
    .optional()
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Gallery alt values must be an array"),

  body("certificateAlt")
    .optional()
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Certificate alt values must be an array"),

  body("displayOrder")
    .optional()
    .isInt({
      min: 0,
      max: 999,
    })
    .withMessage("Display order must be between 0 and 999")
    .toInt(),

  optionalBooleanField("isFeatured"),

  optionalBooleanField("isActive"),

  body().custom((value, { req }) => {
    if (!req.files?.cardImage?.[0]) {
      throw new Error("Project card image is required");
    }

    if (!req.files?.heroImage?.[0]) {
      throw new Error("Project hero image is required");
    }

    return true;
  }),

  validate,
];

// ==================== Update Project Validation ====================

const updateProjectValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Project title cannot be empty")
    .bail()
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Project title must be between 2 and 150 characters"),

  body("slug")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Project slug cannot be empty")
    .bail()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage(
      "Project slug may contain lowercase letters, numbers, and hyphens only",
    ),

  body("categoryLabel")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category label cannot be empty")
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Category label must be between 2 and 100 characters"),

  body("shortDescription")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Short description cannot be empty")
    .bail()
    .isLength({
      min: 10,
      max: 500,
    })
    .withMessage("Short description must be between 10 and 500 characters"),

  body("description")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Project description cannot be empty")
    .bail()
    .isLength({
      min: 20,
      max: 5000,
    })
    .withMessage("Project description must be between 20 and 5000 characters"),

  body("services")
    .optional()
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Services must be an array"),

  body("services.*")
    .optional()
    .isMongoId()
    .withMessage("Each service must contain a valid service ID"),

  body("projectDetails")
    .optional()
    .customSanitizer(parseJsonValue({}))
    .isObject()
    .withMessage("Project details must be a valid object"),

  body("detailedScope")
    .optional()
    .customSanitizer(parseJsonValue({}))
    .isObject()
    .withMessage("Detailed scope must be a valid object"),

  body("galleryAlt")
    .optional()
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Gallery alt values must be an array"),

  body("certificateAlt")
    .optional()
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Certificate alt values must be an array"),

  body("removeGalleryPublicIds")
    .optional()
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Removed gallery IDs must be an array"),

  body("removeCertificatePublicIds")
    .optional()
    .customSanitizer(parseJsonValue([]))
    .isArray()
    .withMessage("Removed certificate IDs must be an array"),

  body("displayOrder")
    .optional()
    .isInt({
      min: 0,
      max: 999,
    })
    .withMessage("Display order must be between 0 and 999")
    .toInt(),

  optionalBooleanField("isFeatured"),

  optionalBooleanField("isActive"),

  body().custom((value, { req }) => {
    const editableFields = [
      "title",
      "slug",
      "categoryLabel",
      "shortDescription",
      "description",
      "services",
      "heroTitle",
      "heroDescription",
      "heroImageAlt",
      "cardImageAlt",
      "projectDetails",
      "detailedScope",
      "galleryAlt",
      "certificateAlt",
      "removeGalleryPublicIds",
      "removeCertificatePublicIds",
      "displayOrder",
      "isFeatured",
      "isActive",
    ];

    const hasBodyField = editableFields.some(
      (field) => req.body[field] !== undefined,
    );

    const hasFile =
      Boolean(req.files?.cardImage?.[0]) ||
      Boolean(req.files?.heroImage?.[0]) ||
      Boolean(req.files?.gallery?.length) ||
      Boolean(req.files?.certificateImages?.length);

    if (!hasBodyField && !hasFile) {
      throw new Error(
        "At least one field or image must be provided for update",
      );
    }

    return true;
  }),

  validate,
];

// ==================== Project ID Validation ====================

const projectIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("Project ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid project ID"),

  validate,
];

// ==================== Project Slug Validation ====================

const projectSlugValidation = [
  param("slug")
    .trim()
    .notEmpty()
    .withMessage("Project slug is required")
    .bail()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage("Invalid project slug"),

  validate,
];

// ==================== Public Project Query Validation ====================

const publicProjectQueryValidation = [
  query("featured")
    .optional()
    .isIn(["true", "false"])
    .withMessage("Featured must be true or false")
    .customSanitizer((value) => value === "true"),

  query("service").optional().isMongoId().withMessage("Invalid service ID"),

  validate,
];

// ==================== Exports ====================

module.exports = {
  createProjectValidation,
  updateProjectValidation,

  projectIdValidation,
  projectSlugValidation,
  publicProjectQueryValidation,
};
