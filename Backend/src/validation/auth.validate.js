const { body } = require("express-validator");

const validate = require("../middlewares/validate");

// Login validation
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string"),

  validate,
];

// Request password change validation
const requestPasswordChangeValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required")
    .bail()
    .isString()
    .withMessage("Current password must be a string"),

  validate,
];

// Verify password change validation
const verifyPasswordChangeValidation = [
  body("verificationCode")
    .trim()
    .notEmpty()
    .withMessage("Verification code is required")
    .bail()
    .matches(/^\d{6}$/)
    .withMessage("Verification code must contain exactly 6 digits"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isString()
    .withMessage("New password must be a string")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be between 8 and 128 characters")
    .bail()
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .bail()
    .matches(/\d/)
    .withMessage("New password must contain at least one number")
    .bail()
    .matches(/[@$!%*?&#^()_\-+=]/)
    .withMessage("New password must contain at least one special character"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }

      return true;
    }),

  validate,
];

// Forgot password validation
const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  validate,
];

// Reset password validation
const resetPasswordValidation = [
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isString()
    .withMessage("New password must be a string")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("New password must be between 8 and 128 characters")
    .bail()
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .bail()
    .matches(/\d/)
    .withMessage("New password must contain at least one number")
    .bail()
    .matches(/[@$!%*?&#^()_\-+=]/)
    .withMessage("New password must contain at least one special character"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Password confirmation does not match");
      }

      return true;
    }),

  validate,
];

module.exports = {
  loginValidation,
  requestPasswordChangeValidation,
  verifyPasswordChangeValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};