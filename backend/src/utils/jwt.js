const jwt = require("jsonwebtoken");
const AppError = require("./appError");

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function signAccessToken(userId, role) {
  return jwt.sign({ userId, role, type: "access" }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function signResetToken(userId) {
  return jwt.sign({ userId, type: "password_reset" }, getSecret(), {
    expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m",
  });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new AppError("Token expired", 401);
    }
    throw new AppError("Invalid token", 401);
  }
}

module.exports = {
  signAccessToken,
  signResetToken,
  verifyToken,
};
