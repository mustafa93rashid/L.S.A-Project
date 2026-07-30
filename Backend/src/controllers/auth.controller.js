const crypto = require("crypto");

const User = require("../models/user.model");

const jwtService = require("../utils/jwtService");
const passwordService = require("../utils/passwordService");
const cookiesService = require("../utils/cookiesService");

const verificationCodeService = require("../utils/verificationCodeService");
const emailService = require("../services/email.service");

class AuthController {
  // Login
  login = async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await passwordService.compare(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const accessToken = jwtService.generateAccessToken(payload);

    const refreshToken = jwtService.generateRefreshToken(payload);

    user.lastLoginAt = new Date();

    await user.save({
      validateBeforeSave: false,
    });

    user = user.toObject();
    delete user.password;

    cookiesService.setAccessToken(res, accessToken);
    cookiesService.setRefreshToken(res, refreshToken);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: user,
    });
  };

  // Logout
  logout = async (req, res) => {
    cookiesService.clearTokens(res);

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  };

  // Get current user
  getCurrentUser = async (req, res) => {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).populate(
      "createdBy",
      "fullName email role",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current user retrieved successfully",
      data: user,
    });
  };

  // Request password change
  requestPasswordChange = async (req, res) => {
    const { currentPassword } = req.body;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "+password +passwordChangeCode +passwordChangeCodeExpires",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const isCurrentPasswordCorrect = await passwordService.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const verificationCode = verificationCodeService.generateVerificationCode();

    user.passwordChangeCode =
      verificationCodeService.hashVerificationCode(verificationCode);

    user.passwordChangeCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save({
      validateBeforeSave: false,
    });

    await emailService.sendPasswordChangeVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verificationCode,
    });

    return res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  };

  // Verify password change
  verifyPasswordChange = async (req, res) => {
    const { verificationCode, newPassword } = req.body;

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "+password +passwordChangeCode +passwordChangeCodeExpires",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.passwordChangeCode) {
      return res.status(400).json({
        success: false,
        message: "No verification code found",
      });
    }

    if (user.passwordChangeCodeExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired",
      });
    }

    const isValid = verificationCodeService.verifyVerificationCode(
      verificationCode,
      user.passwordChangeCode,
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    const isSamePassword = await passwordService.compare(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await passwordService.hash(newPassword);

    user.passwordChangeCode = undefined;
    user.passwordChangeCodeExpires = undefined;

    await user.save();

    cookiesService.clearTokens(res);

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please sign in again.",
    });
  };

  // ==================== Forgot Password ====================
  forgotPassword = async (req, res) => {
    const { email } = req.body;

    const responseMessage =
      "If an account exists for this email address, you will receive password reset instructions shortly.";

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: responseMessage,
      });
    }

    const resetToken = verificationCodeService.generateResetToken();

    user.passwordResetToken =
      verificationCodeService.hashResetToken(resetToken);

    user.passwordResetExpires = Date.now() + 15 * 60 * 1000;

    await user.save({
      validateBeforeSave: false,
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    try {
      await emailService.sendPasswordResetEmail({
        to: user.email,
        fullName: user.fullName,
        resetUrl,
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;

      await user.save({
        validateBeforeSave: false,
      });

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: responseMessage,
    });
  };

  // ==================== Reset Password ====================
  resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = verificationCodeService.hashResetToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
      isActive: true,
    }).select("+password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token",
      });
    }

    const isSamePassword = await passwordService.compare(
      newPassword,
      user.password,
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    user.password = await passwordService.hash(newPassword);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    cookiesService.clearTokens(res);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please sign in again.",
    });
  };

  // Refresh token
  refreshToken = async (req, res) => {
    const refreshToken = cookiesService.getRefreshToken(req);

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    const decoded = jwtService.verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id);

    if (!user) {
      cookiesService.clearTokens(res);

      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (!user.isActive) {
      cookiesService.clearTokens(res);

      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    const payload = {
      id: user._id,
      role: user.role,
    };

    const newAccessToken = jwtService.generateAccessToken(payload);

    const newRefreshToken = jwtService.generateRefreshToken(payload);

    cookiesService.setAccessToken(res, newAccessToken);
    cookiesService.setRefreshToken(res, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
    });
  };
}

module.exports = new AuthController();
