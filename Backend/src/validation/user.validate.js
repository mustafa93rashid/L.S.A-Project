const {
  body,
  param,
} = require("express-validator");

const validate = require("../middlewares/validate");

// ==================== Allowed User Roles ====================

const allowedRoles = [
  "superadmin",
  "manager",
  "equipmentManager",
  "hrManager",
  "contentManager",
];

// ==================== Update Profile Validation ====================

const updateProfileValidation = [
  body("fullName")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Full name cannot be empty",
    )
    .bail()
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage(
      "Full name must be between 3 and 100 characters",
    ),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Email cannot be empty",
    )
    .bail()
    .isEmail()
    .withMessage(
      "Please enter a valid email address",
    )
    .normalizeEmail(),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Phone number cannot be empty",
    )
    .bail()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage(
      "Please enter a valid phone number",
    ),

  body("department")
    .optional()
    .trim()
    .notEmpty()
    .withMessage(
      "Department cannot be empty",
    )
    .bail()
    .isLength({
      min: 2,
      max: 100,
    })
    .withMessage(
      "Department must be between 2 and 100 characters",
    ),

  body().custom(
    (value, { req }) => {
      const editableFields = [
        "fullName",
        "email",
        "phone",
        "department",
      ];

      const hasTextField =
        editableFields.some(
          (field) =>
            req.body[field] !==
            undefined,
        );

      if (
        !hasTextField &&
        !req.file
      ) {
        throw new Error(
          "At least one profile field or image is required",
        );
      }

      return true;
    },
  ),

  validate,
];

// ==================== Create User Validation ====================

const createUserValidation = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage(
      "Full name is required",
    )
    .bail()
    .isLength({
      min: 3,
      max: 100,
    })
    .withMessage(
      "Full name must be between 3 and 100 characters",
    ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage(
      "Email is required",
    )
    .bail()
    .isEmail()
    .withMessage(
      "Please enter a valid email address",
    )
    .normalizeEmail(),

  body("role")
    .trim()
    .notEmpty()
    .withMessage(
      "Role is required",
    )
    .bail()
    .isIn(allowedRoles)
    .withMessage(
      `Role must be one of: ${allowedRoles.join(", ")}`,
    ),

  validate,
];

// ==================== Activate Account Validation ====================

const activateAccountValidation = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("Activation token is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .isLength({ min: 8, max: 128 })
    .withMessage("Password must be between 8 and 128 characters")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .bail()
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .bail()
    .matches(/[@$!%*?&#^()_\-+=]/)
    .withMessage("Password must contain at least one special character"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Password confirmation is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Password confirmation does not match");
      }

      return true;
    }),

  validate,
];

// ==================== User ID Validation ====================

const userIdValidation = [
  param("id")
    .notEmpty()
    .withMessage(
      "User ID is required",
    )
    .bail()
    .isMongoId()
    .withMessage(
      "Invalid user ID",
    ),

  validate,
];

// ==================== Update User Status Validation ====================

const updateUserStatusValidation = [
  body("isActive")
    .exists({
      checkNull: true,
    })
    .withMessage(
      "Account status is required",
    )
    .bail()
    .isBoolean({
      strict: true,
    })
    .withMessage(
      "Account status must be true or false",
    )
    .toBoolean(),

  validate,
];

// ==================== Update User Role Validation ====================

const updateUserRoleValidation = [
  body("role")
    .trim()
    .notEmpty()
    .withMessage(
      "Role is required",
    )
    .bail()
    .isIn(allowedRoles)
    .withMessage(
      `Role must be one of: ${allowedRoles.join(", ")}`,
    ),

  validate,
];

// ==================== Exports ====================

module.exports = {
  allowedRoles,

  updateProfileValidation,
  createUserValidation,
  activateAccountValidation,
  userIdValidation,
  updateUserStatusValidation,
  updateUserRoleValidation,
};