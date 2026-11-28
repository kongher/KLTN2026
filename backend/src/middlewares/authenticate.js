const AppError = require("../utils/appError");
const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/prisma");
const { isAccountBlocked } = require("../utils/userMapper");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError("Authentication required", 401);
    }

    const payload = verifyToken(token);

    if (payload.type && payload.type !== "access") {
      throw new AppError("Invalid token", 401);
    }

    if (!payload.userId || !payload.role) {
      throw new AppError("Invalid token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!user) {
      throw new AppError("User not found", 401);
    }

    if (isAccountBlocked(user.status)) {
      throw new AppError("Tài khoản đã bị khóa hãy liên hệ admin.", 403);
    }

    req.user = {
      id: user.id,
      userId: user.id,
      role: user.role.name,
      email: user.email,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;
