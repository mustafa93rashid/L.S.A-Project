const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const parseJson = (fieldName, expectedType) => {
  return body(fieldName)
    .customSanitizer((value) => {
      if (value === undefined) {
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
      if (value === undefined) {
        return true;
      }

      if (expectedType === "array" && !Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array.`);
      }

      if (
        expectedType === "object" &&
        (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        )
      ) {
        throw new Error(`${fieldName} must be an object.`);
      }

      return true;
    });
};

const validateStringArray = (value, fieldName) => {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array.`);
  }

  const hasInvalidValue = value.some(
    (item) => typeof item !== "string" || !item.trim(),
  );

  if (hasInvalidValue) {
    throw new Error(`${fieldName} must contain non-empty strings only.`);
  }

  return true;
};

const validateProjectDetails = (value) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error("projectDetails must be an object.");
  }

  const stringFields = [
    "client",
    "location",
    "duration",
    "status",
  ];

  stringFields.forEach((field) => {
    if (
      value[field] !== undefined &&
      (
        typeof value[field] !== "string" ||
        !value[field].trim()
      )
    ) {
      throw new Error(`projectDetails.${field} must be a non-empty string.`);
    }
  });

  if (
    value.completionDate !== undefined &&
    Number.isNaN(Date.parse(value.completionDate))
  ) {
    throw new Error("projectDetails.completionDate must be a valid date.");
  }

  return true;
};

const validateDetailedScope = (value) => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new Error("detailedScope must be an object.");
  }

  if (
    typeof value.title !== "string" ||
    !value.title.trim()
  ) {
    throw new Error("detailedScope.title is required.");
  }

  if (
    typeof value.description !== "string" ||
    !value.description.trim()
  ) {
    throw new Error("detailedScope.description is required.");
  }

  if (!Array.isArray(value.items)) {
    throw new Error("detailedScope.items must be an array.");
  }

  value.items.forEach((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item)
    ) {
      throw new Error(`detailedScope.items.${index} must be an object.`);
    }

    if (
      typeof item.title !== "string" ||
      !item.title.trim()
    ) {
      throw new Error(`detailedScope.items.${index}.title is required.`);
    }

    if (
      typeof item.description !== "string" ||
      !item.description.trim()
    ) {
      throw new Error(`detailedScope.items.${index}.description is required.`);
    }

    if (
      typeof item.icon !== "string" ||
      !item.icon.trim()
    ) {
      throw new Error(`detailedScope.items.${index}.icon is required.`);
    }
  });

  return true;
};

const validateCertificates = (value) => {
  if (!Array.isArray(value)) {
    throw new Error("certificates must be an array.");
  }

  value.forEach((certificate, index) => {
    if (
      typeof certificate !== "object" ||
      certificate === null ||
      Array.isArray(certificate)
    ) {
      throw new Error(`certificates.${index} must be an object.`);
    }

    if (
      certificate.title !== undefined &&
      (
        typeof certificate.title !== "string" ||
        !certificate.title.trim()
      )
    ) {
      throw new Error(`certificates.${index}.title must be a non-empty string.`);
    }

    if (
      certificate.description !== undefined &&
      (
        typeof certificate.description !== "string" ||
        !certificate.description.trim()
      )
    ) {
      throw new Error(`certificates.${index}.description must be a non-empty string.`);
    }
  });

  return true;
};

/*
|--------------------------------------------------------------------------
| Shared Fields
|--------------------------------------------------------------------------
*/

const titleValidation = body("title")
  .isString()
  .withMessage("Project title must be a string.")
  .notEmpty()
  .withMessage("Project title is required.")
  .isLength({
    min: 2,
    max: 150,
  })
  .withMessage("Project title must be between 2 and 150 characters.");

const slugFieldValidation = body("slug")
  .isString()
  .withMessage("Project slug must be a string.")
  .notEmpty()
  .withMessage("Project slug is required.")
  .matches(slugRegex)
  .withMessage("Project slug must contain lowercase letters, numbers, and hyphens only.");

const categoryLabelValidation = body("categoryLabel")
  .isString()
  .withMessage("Category label must be a string.")
  .notEmpty()
  .withMessage("Category label is required.")
  .isLength({
    min: 2,
    max: 100,
  })
  .withMessage("Category label must be between 2 and 100 characters.");

const shortDescriptionValidation = body("shortDescription")
  .isString()
  .withMessage("Short description must be a string.")
  .notEmpty()
  .withMessage("Short description is required.")
  .isLength({
    min: 10,
    max: 500,
  })
  .withMessage("Short description must be between 10 and 500 characters.");

const descriptionValidation = body("description")
  .isString()
  .withMessage("Project description must be a string.")
  .notEmpty()
  .withMessage("Project description is required.")
  .isLength({
    min: 10,
    max: 5000,
  })
  .withMessage("Project description must be between 10 and 5000 characters.");

const heroTitleValidation = body("heroTitle")
  .isString()
  .withMessage("Hero title must be a string.")
  .notEmpty()
  .withMessage("Hero title is required.")
  .isLength({
    min: 2,
    max: 150,
  })
  .withMessage("Hero title must be between 2 and 150 characters.");

const heroDescriptionValidation = body("heroDescription")
  .isString()
  .withMessage("Hero description must be a string.")
  .notEmpty()
  .withMessage("Hero description is required.")
  .isLength({
    min: 10,
    max: 1500,
  })
  .withMessage("Hero description must be between 10 and 1500 characters.");

const displayOrderValidation = body("displayOrder")
  .optional()
  .isInt({
    min: 0,
  })
  .withMessage("Display order must be a non-negative integer.")
  .toInt();

const isFeaturedValidation = body("isFeatured")
  .optional()
  .isBoolean()
  .withMessage("isFeatured must be true or false.")
  .toBoolean();

const isActiveValidation = body("isActive")
  .optional()
  .isBoolean()
  .withMessage("isActive must be true or false.")
  .toBoolean();

/*
|--------------------------------------------------------------------------
| Create Project Validation
|--------------------------------------------------------------------------
*/

const createProjectValidation = [
  titleValidation,

  slugFieldValidation,

  categoryLabelValidation,

  shortDescriptionValidation,

  descriptionValidation,

  heroTitleValidation,

  heroDescriptionValidation,

  parseJson("services", "array"),

  body("services")
    .custom((value) => {
      if (value.length === 0) {
        throw new Error("At least one service is required.");
      }

      return true;
    }),

  body("services.*")
    .isMongoId()
    .withMessage("Every service must contain a valid service ID."),

  parseJson("projectDetails", "object"),

  body("projectDetails")
    .custom(validateProjectDetails),

  parseJson("detailedScope", "object"),

  body("detailedScope")
    .custom(validateDetailedScope),

  parseJson("galleryAlt", "array")
    .optional(),

  body("galleryAlt")
    .optional()
    .custom((value) => validateStringArray(value, "galleryAlt")),

  parseJson("certificates", "array")
    .optional(),

  body("certificates")
    .optional()
    .custom(validateCertificates),

  displayOrderValidation,

  isFeaturedValidation,

  isActiveValidation,

  validate,
];

/*
|--------------------------------------------------------------------------
| Update Project Validation
|--------------------------------------------------------------------------
*/

const updateProjectValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage("Project title must be a string.")
    .notEmpty()
    .withMessage("Project title cannot be empty.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Project title must be between 2 and 150 characters."),

  body("slug")
    .optional()
    .isString()
    .withMessage("Project slug must be a string.")
    .matches(slugRegex)
    .withMessage("Project slug must contain lowercase letters, numbers, and hyphens only."),

  body("categoryLabel")
    .optional()
    .isString()
    .withMessage("Category label must be a string.")
    .notEmpty()
    .withMessage("Category label cannot be empty.")
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage("Category label must be between 2 and 100 characters."),

  body("shortDescription")
    .optional()
    .isString()
    .withMessage("Short description must be a string.")
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
    .withMessage("Project description must be a string.")
    .notEmpty()
    .withMessage("Project description cannot be empty.")
    .isLength({
      min: 10,
      max: 5000,
    })
    .withMessage("Project description must be between 10 and 5000 characters."),

  body("heroTitle")
    .optional()
    .isString()
    .withMessage("Hero title must be a string.")
    .notEmpty()
    .withMessage("Hero title cannot be empty.")
    .isLength({
      min: 2,
      max: 150,
    })
    .withMessage("Hero title must be between 2 and 150 characters."),

  body("heroDescription")
    .optional()
    .isString()
    .withMessage("Hero description must be a string.")
    .notEmpty()
    .withMessage("Hero description cannot be empty.")
    .isLength({
      min: 10,
      max: 1500,
    })
    .withMessage("Hero description must be between 10 and 1500 characters."),

  parseJson("services", "array")
    .optional(),

  body("services.*")
    .optional()
    .isMongoId()
    .withMessage("Every service must contain a valid service ID."),

  parseJson("projectDetails", "object")
    .optional(),

  body("projectDetails")
    .optional()
    .custom(validateProjectDetails),

  parseJson("detailedScope", "object")
    .optional(),

  body("detailedScope")
    .optional()
    .custom(validateDetailedScope),

  parseJson("galleryAlt", "array")
    .optional(),

  body("galleryAlt")
    .optional()
    .custom((value) => validateStringArray(value, "galleryAlt")),

  parseJson("certificates", "array")
    .optional(),

  body("certificates")
    .optional()
    .custom(validateCertificates),

  parseJson("removeGalleryPublicIds", "array")
    .optional(),

  body("removeGalleryPublicIds")
    .optional()
    .custom((value) =>
      validateStringArray(value, "removeGalleryPublicIds"),
    ),

  parseJson("removeCertificatePublicIds", "array")
    .optional(),

  body("removeCertificatePublicIds")
    .optional()
    .custom((value) =>
      validateStringArray(value, "removeCertificatePublicIds"),
    ),

  displayOrderValidation,

  isFeaturedValidation,

  isActiveValidation,

  validate,
];

/*
|--------------------------------------------------------------------------
| Route Parameters Validation
|--------------------------------------------------------------------------
*/

const idValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid project ID."),

  validate,
];

const slugValidation = [
  param("slug")
    .matches(slugRegex)
    .withMessage("Invalid project slug."),

  validate,
];

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  createProjectValidation,
  updateProjectValidation,
  idValidation,
  slugValidation,
};