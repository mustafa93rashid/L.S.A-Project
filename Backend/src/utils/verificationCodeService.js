const crypto = require("crypto");

// Generate a random 6-digit verification code
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Hash the verification code
const hashVerificationCode = (code) => {
  return crypto
    .createHash("sha256")
    .update(code.toString())
    .digest("hex");
};

// Verify the verification code
const verifyVerificationCode = (plainCode, hashedCode) => {
  return hashVerificationCode(plainCode) === hashedCode;
};

// Generate password reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hash password reset token
const hashResetToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token.toString())
    .digest("hex");
};

module.exports = {
  generateVerificationCode,
  hashVerificationCode,
  verifyVerificationCode,
  generateResetToken,
  hashResetToken,
};