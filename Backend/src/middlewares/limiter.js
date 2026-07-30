const rateLimit = require("express-rate-limit");

// Login limiter
const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// Password change request limiter
const passwordChangeRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many password change requests. Please try again after 15 minutes.",
  },
});

// Password change verification limiter
const passwordChangeVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many verification attempts. Please try again after 15 minutes.",
  },
});

// Refresh token limiter
const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many refresh token requests. Please try again later.",
  },
});

module.exports = {
  signinLimiter,
  passwordChangeRequestLimiter,
  passwordChangeVerifyLimiter,
  refreshTokenLimiter,
};