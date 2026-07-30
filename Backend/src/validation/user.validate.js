const { body, param } = require("express-validator");

const validate = require("../middlewares/validate");

const allowedRoles = [
  "superadmin",
  "equipmentManager",
  "hrManager",
  "contentManager"
];

// Update current profile validation
const updateProfileValidation = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Full name cannot be empty")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Email cannot be empty")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("employeeCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Employee code cannot be empty")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Employee code must be between 2 and 50 characters"),

  body("mobile")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Mobile number cannot be empty")
    .bail()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage("Please enter a valid mobile number"),

  body("department")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Department cannot be empty")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department must be between 2 and 100 characters"),

  body()
    .custom((value, { req }) => {
      const hasTextField = [
        "fullName",
        "email",
        "employeeCode",
        "mobile",
        "department",
      ].some((field) => req.body[field] !== undefined);

      if (!hasTextField && !req.file) {
        throw new Error("At least one profile field or image is required");
      }

      return true;
    }),

  validate,
];

// Create user validation
const createUserValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required")
    .bail()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .bail()
    .isIn(allowedRoles)
    .withMessage(
      `Role must be one of: ${allowedRoles.join(", ")}`,
    ),

  validate,
];

// MongoDB user ID validation
const userIdValidation = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid user ID"),

  validate,
];

// Update user status validation
const updateUserStatusValidation = [
  param("id")
    .notEmpty()
    .withMessage("User ID is required")
    .bail()
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("isActive")
    .notEmpty()
    .withMessage("Account status is required")
    .bail()
    .isBoolean()
    .withMessage("Account status must be true or false")
    .toBoolean(),

  validate,
];

const updateUserRoleValidation = [
  param("id")
    .isMongoId()
    .withMessage("Invalid user ID"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .bail()
    .isIn([
      "equipmentManager",
      "hrManager",
      "contentManager",
    ])
    .withMessage("Invalid role"),

  validate,
];

module.exports = {
  updateProfileValidation,
  createUserValidation,
  userIdValidation,
  updateUserStatusValidation,
  updateUserRoleValidation,
};