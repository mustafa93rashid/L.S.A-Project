const {
  body,
} = require("express-validator");

const validate = require("../middlewares/validate");

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PHONE_REGEX =
  /^[0-9+\-()\s]{7,30}$/;

const URL_FIELDS = [
  "facebook",
  "instagram",
  "linkedin",
];

const isValidUrl = (value) => {
  if (!value) {
    return true;
  }

  try {
    new URL(value);

    return true;
  } catch {
    return false;
  }
};

/*
|--------------------------------------------------------------------------
| Contact Information Validation
|--------------------------------------------------------------------------
*/

const saveContactInfoValidation = [
  body("title")
    .optional()
    .isString()
    .withMessage(
      "Title must be a string.",
    )
    .bail()
    .trim()
    .isLength({
      max: 150,
    })
    .withMessage(
      "Title cannot exceed 150 characters.",
    ),

  body("description")
    .optional()
    .isString()
    .withMessage(
      "Description must be a string.",
    )
    .bail()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage(
      "Description cannot exceed 1000 characters.",
    ),

  body("address")
    .notEmpty()
    .withMessage(
      "Address is required.",
    )
    .bail()
    .isString()
    .withMessage(
      "Address must be a string.",
    )
    .bail()
    .trim()
    .isLength({
      min: 2,
      max: 500,
    })
    .withMessage(
      "Address must be between 2 and 500 characters.",
    ),

  body("phones")
    .isArray({
      min: 1,
    })
    .withMessage(
      "At least one phone number is required.",
    ),

  body("phones.*")
    .isString()
    .withMessage(
      "Each phone number must be a string.",
    )
    .bail()
    .trim()
    .notEmpty()
    .withMessage(
      "Phone number cannot be empty.",
    )
    .bail()
    .matches(PHONE_REGEX)
    .withMessage(
      "Phone number format is invalid.",
    ),

  body("primaryPhone")
    .notEmpty()
    .withMessage(
      "Primary phone number is required.",
    )
    .bail()
    .isString()
    .withMessage(
      "Primary phone number must be a string.",
    )
    .bail()
    .trim()
    .matches(PHONE_REGEX)
    .withMessage(
      "Primary phone number format is invalid.",
    )
    .custom((value, { req }) => {
      const phones = Array.isArray(
        req.body.phones,
      )
        ? req.body.phones.map((phone) =>
            String(phone).trim(),
          )
        : [];

      if (!phones.includes(value.trim())) {
        throw new Error(
          "Primary phone number must exist in the phones list.",
        );
      }

      return true;
    }),

  body("email")
    .notEmpty()
    .withMessage(
      "Email is required.",
    )
    .bail()
    .isString()
    .withMessage(
      "Email must be a string.",
    )
    .bail()
    .trim()
    .isEmail()
    .withMessage(
      "Email address must be valid.",
    )
    .normalizeEmail(),

  body("workingHours")
    .notEmpty()
    .withMessage(
      "Working hours are required.",
    )
    .bail()
    .isString()
    .withMessage(
      "Working hours must be a string.",
    )
    .bail()
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage(
      "Working hours cannot exceed 250 characters.",
    ),

  body("emergencyHours")
    .optional()
    .isString()
    .withMessage(
      "Emergency hours must be a string.",
    )
    .bail()
    .trim()
    .isLength({
      max: 250,
    })
    .withMessage(
      "Emergency hours cannot exceed 250 characters.",
    ),

  body("socialLinks")
    .optional()
    .isObject()
    .withMessage(
      "Social links must be an object.",
    ),

  ...URL_FIELDS.map((field) =>
    body(`socialLinks.${field}`)
      .optional({
        checkFalsy: true,
      })
      .isString()
      .withMessage(
        `${field} link must be a string.`,
      )
      .bail()
      .trim()
      .custom((value) => {
        if (!isValidUrl(value)) {
          throw new Error(
            `${field} link must be a valid URL.`,
          );
        }

        return true;
      }),
  ),

  body("socialLinks.whatsapp")
    .optional({
      checkFalsy: true,
    })
    .isString()
    .withMessage(
      "WhatsApp value must be a string.",
    )
    .bail()
    .trim()
    .isLength({
      min: 7,
      max: 30,
    })
    .withMessage(
      "WhatsApp value must be between 7 and 30 characters.",
    ),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage(
      "isActive must be a boolean.",
    )
    .toBoolean(),

  validate,
];

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  saveContactInfoValidation,
};