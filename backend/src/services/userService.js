const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { toPublicUser } = require("../utils/userMapper");

async function updateProfile(userId, { name, phone, avatar }) {
  if (phone) {
    const existing = await prisma.user.findFirst({
      where: {
        phone: String(phone).trim(),
        NOT: { id: userId },
      },
    });

    if (existing) {
      throw new AppError("Phone already exists", 409);
    }
  }

  const data = {};
  if (name !== undefined) data.name = name.trim();
  if (phone !== undefined) data.phone = String(phone).trim();
  if (avatar !== undefined) data.avatar = avatar === "" ? null : avatar;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: { role: true },
  });

  return toPublicUser(user);
}

module.exports = {
  updateProfile,
};
