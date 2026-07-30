const User = require("../models/user.model");
const jwtService = require("../utils/jwtService");
const cookiesService = require("../utils/cookiesService");

// ==================================================
// Extract Access Token
// ==================================================
const extractAccessToken = (req) => {
  const cookieToken = cookiesService.getAccessToken(req);

  if (cookieToken) {
    return cookieToken;
  }

  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return null;
  }

  const bearerToken = authorizationHeader
    .replace(/^Bearer\s+/i, "")
    .trim();

  return bearerToken || null;
};

// ==================================================
// Authentication Middleware
// ==================================================
const auth = async (req, res, next) => {
  try {
    const token = extractAccessToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required",
      });
    }

    let decoded;

    try {
      decoded = jwtService.verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired access token",
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid access token payload",
      });
    }

    const user = await User.findById(decoded.id)
      .select(
        "_id firstName lastName email role isActive",
      )
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user was not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    req.user = user;

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = auth;