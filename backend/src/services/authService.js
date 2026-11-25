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

async function register({ name, email, phone, password }) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: email.trim() }, { phone: String(phone).trim() }],
    },
  });

  if (existing) {
    if (existing.email === email.trim()) {
      throw new AppError("Email already exists", 409);
    }
    throw new AppError("Phone already exists", 409);
  }

  const customerRole = await prisma.role.findUnique({
    where: { name: "CUSTOMER" },
  });

  if (!customerRole) {
    throw new AppError("Customer role is not configured", 500);
  }

  const hashed = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        roleId: customerRole.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: String(phone).trim(),
        password: hashed,
        status: "ACTIVE",
      },
      include: userInclude(),
    });

    await tx.customer.create({
      data: {
        userId: created.id,
      },
    });

    return created;
  });

  const token = signAccessToken(user.id, user.role.name);

  return {
    user: toAuthUser(user),
    token,
  };
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
    throw new AppError("Account is locked", 403);
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
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};
