const {
  body,
  param,
  query,
} = require("express-validator");

const validate =
  require("../middlewares/validate");

const {
  NEWS_STATUSES,
  NEWS_CATEGORIES,
} = require("../models/news.model");

// ==================== Constants ====================

const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_IMAGE_SIZE =
  5 * 1024 * 1024; // 5 MB

// ==================== Validate Object ID ====================

const validateNewsId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid news ID"),

  validate,
];

// ==================== Validate Image ====================

const validateNewsImage = (
  required = false
) => {
  return (req, res, next) => {
    const file = req.file;

    if (!file) {
      if (required) { 
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [
            {
              field: "image",
              message:
                "News image is required",
              value: null,
            },
          ],
        });
      }

      return next();
    }

    if (
      !IMAGE_MIME_TYPES.includes(
        file.mimetype
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "image",
            message:
              "Only JPG, PNG and WEBP images are allowed",
            value: file.mimetype,
          },
        ],
      });
    }

    if (
      file.size > MAX_IMAGE_SIZE
    ) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [
          {
            field: "image",
            message:
              "Image size must not exceed 5MB",
            value: file.size,
          },
        ],
      });
    }

    next();
  };
};

// ==================== Create News Validation ====================

const validateCreateNews = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({
      min: 3,
      max: 200,
    })
    .withMessage(
      "Title must be between 3 and 200 characters"
    ),

  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage(
      "Short description is required"
    )
    .isLength({
      max: 500,
    })
    .withMessage(
      "Short description must not exceed 500 characters"
    ),

  body("content")
    .trim()
    .notEmpty()
    .withMessage(
      "News content is required"
    ),

  body("category")
    .optional()
    .isIn(NEWS_CATEGORIES)
    .withMessage(
      `Category must be one of: ${NEWS_CATEGORIES.join(
        ", "
      )}`
    ),

  body("status")
    .optional()
    .isIn(NEWS_STATUSES)
    .withMessage(
      `Status must be one of: ${NEWS_STATUSES.join(
        ", "
      )}`
    ),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false"
    ),

  body("displayOrder")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage(
      "Display order must be a positive integer"
    ),

  body("imageAlt")
    .optional()
    .trim()
    .isLength({
      max: 200,
    })
    .withMessage(
      "Image alt must not exceed 200 characters"
    ),

  validate,
];

// ==================== Update News Validation ====================

const validateUpdateNews = [
  body("title")
    .optional()
    .trim()
    .isLength({
      min: 3,
      max: 200,
    })
    .withMessage(
      "Title must be between 3 and 200 characters"
    ),

  body("shortDescription")
    .optional()
    .trim()
    .isLength({
      max: 500,
    })
    .withMessage(
      "Short description must not exceed 500 characters"
    ),

  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "News content cannot be empty"
    ),

  body("category")
    .optional()
    .isIn(NEWS_CATEGORIES)
    .withMessage(
      `Category must be one of: ${NEWS_CATEGORIES.join(
        ", "
      )}`
    ),

  body("status")
    .optional()
    .isIn(NEWS_STATUSES)
    .withMessage(
      `Status must be one of: ${NEWS_STATUSES.join(
        ", "
      )}`
    ),

  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false"
    ),

  body("displayOrder")
    .optional()
    .isInt({
      min: 0,
    })
    .withMessage(
      "Display order must be a positive integer"
    ),

  body("imageAlt")
    .optional()
    .trim()
    .isLength({
      max: 200,
    })
    .withMessage(
      "Image alt must not exceed 200 characters"
    ),

  validate,
];

// ==================== Dashboard Query Validation ====================

const validateNewsQuery = [
  query("page")
    .optional()
    .isInt({
      min: 1,
    })
    .withMessage(
      "Page must be at least 1"
    ),

  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage(
      "Limit must be between 1 and 100"
    ),

  query("status")
    .optional()
    .isIn(NEWS_STATUSES)
    .withMessage(
      "Invalid news status"
    ),

  query("category")
    .optional()
    .isIn(NEWS_CATEGORIES)
    .withMessage(
      "Invalid news category"
    ),

  query("isFeatured")
    .optional()
    .isBoolean()
    .withMessage(
      "isFeatured must be true or false"
    ),

  query("search")
    .optional()
    .trim()
    .isLength({
      max: 200,
    })
    .withMessage(
      "Search query is too long"
    ),

  validate,
];

// ==================== Public Query Validation ====================

const validatePublicNewsQuery = [
  query("limit")
    .optional()
    .isInt({
      min: 1,
      max: 20,
    })
    .withMessage(
      "Limit must be between 1 and 20"
    ),

  query("category")
    .optional()
    .isIn(NEWS_CATEGORIES)
    .withMessage(
      "Invalid news category"
    ),

  validate,
];

module.exports = {
  validateNewsId,

  validateNewsImage,

  validateCreateNews,
  validateUpdateNews,

  validateNewsQuery,
  validatePublicNewsQuery,
};