const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { hashPassword, comparePassword } = require("../utils/password");
const { signAccessToken, signResetToken, verifyToken } = require("../utils/jwt");
const {
  toPublicUser,
  toAuthUser,
  isAccountBlocked,
} = require("../utils/userMapper");

function userInclude() {
  return { role: true };
}

async function findUserByEmailOrPhone(identifier) {
  const value = String(identifier).trim();
  return prisma.user.findFirst({
    where: {
      OR: [{ email: value.toLowerCase() }, { phone: value }],
    },
    include: userInclude(),
  });
}

const emailOtpService = require("./emailOtpService");

async function register(payload) {
  return emailOtpService.startRegistration(payload);
}

async function verifyEmailOtp(payload) {
  return emailOtpService.verifyRegistrationOtp(payload);
}

async function resendEmailOtp(payload) {
  return emailOtpService.resendRegistrationOtp(payload);
}

async function login({ email, phone, identifier, password }) {
  const loginId = (identifier || email || phone || "").trim();
  const user = await findUserByEmailOrPhone(loginId);

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const matched = await comparePassword(password, user.password);
  if (!matched) {
    throw new AppError("Invalid credentials", 401);
  }

  if (isAccountBlocked(user.status)) {
    throw new AppError("Tài khoản đã bị khóa hãy liên hệ admin.", 403);
  }

  if (user.role?.name === "CUSTOMER" && user.emailVerified === false) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = signAccessToken(user.id, user.role.name);

  return {
    user: toAuthUser(user),
    token,
  };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude(),
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return toPublicUser(user);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const matched = await comparePassword(currentPassword, user.password);
  if (!matched) {
    throw new AppError("Current password is incorrect", 400);
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new AppError("No account found with this email", 404);
  }

  const resetToken = signResetToken(user.id);
  return { resetToken, expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m" };
}

async function resetPassword(token, newPassword) {
  const payload = verifyToken(token);

  if (payload.type !== "password_reset" || !payload.userId) {
    throw new AppError("Invalid reset token", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });
}

module.exports = {
  register,
  verifyEmailOtp,
  resendEmailOtp,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
