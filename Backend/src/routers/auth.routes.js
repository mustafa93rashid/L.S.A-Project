const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");

const {loginValidation, requestPasswordChangeValidation, verifyPasswordChangeValidation, resetPasswordValidation, forgotPasswordValidation} = require("../validation/auth.validate");
const {signinLimiter, passwordChangeRequestLimiter, passwordChangeVerifyLimiter, refreshTokenLimiter} = require("../middlewares/limiter");

// Login
router.post("/login", [signinLimiter, ...loginValidation], asyncHandler(authController.login));

// Logout
router.post("/logout", [auth], asyncHandler(authController.logout));

// Get current user
router.get("/me", [auth], asyncHandler(authController.getCurrentUser));

// Request password change verification code
router.post("/change-password/request", [auth, passwordChangeRequestLimiter, ...requestPasswordChangeValidation], asyncHandler(authController.requestPasswordChange));

// Verify code and change password
router.post("/change-password/verify", [auth, passwordChangeVerifyLimiter, ...verifyPasswordChangeValidation], asyncHandler(authController.verifyPasswordChange));

// Forgot password
router.post("/forgot-password", [...forgotPasswordValidation], asyncHandler(authController.forgotPassword));

// Reset password
router.post("/reset-password/:token", [...resetPasswordValidation], asyncHandler(authController.resetPassword));

// Refresh access token
router.post("/refresh-token", [refreshTokenLimiter], asyncHandler(authController.refreshToken));

module.exports = router;