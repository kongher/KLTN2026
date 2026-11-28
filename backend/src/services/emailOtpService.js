const crypto = require("crypto");
const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { hashPassword } = require("../utils/password");
const { signAccessToken } = require("../utils/jwt");
const { toAuthUser } = require("../utils/userMapper");
const { sendRegistrationOtpEmail } = require("./mailService");

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone) {
  return String(phone).trim();
}

function otpPepper() {
  const pepper = process.env.OTP_PEPPER || process.env.JWT_SECRET;
  if (!pepper) {
    throw new AppError("Server configuration error", 500);
  }
  return pepper;
}

function hashOtpCode(code) {
  return crypto.createHmac("sha256", otpPepper()).update(String(code)).digest("hex");
}

function verifyOtpCode(code, storedHash) {
  const incoming = hashOtpCode(code);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(incoming, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function maskEmail(email) {
  const [local, domain] = email.split("@");
  if (!domain) return "email đã đăng ký";
  const visible = local.length <= 2 ? `${local[0] || ""}*` : `${local.slice(0, 2)}***`;
  return `${visible}@${domain}`;
}

async function assertRegisterable({ email, phone }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { phone: normalizedPhone }],
    },
  });

  if (existing) {
    if (existing.email === normalizedEmail) {
      throw new AppError("Email already exists", 409);
    }
    throw new AppError("Phone already exists", 409);
  }
}

async function findActiveOtpRecord(email) {
  const normalizedEmail = normalizeEmail(email);
  return prisma.registrationOtp.findFirst({
    where: {
      email: normalizedEmail,
      usedAt: null,
    },
    orderBy: { createdAt: "desc" },
  });
}

function buildOtpResponse(record) {
  const resendAvailableAt = new Date(
    new Date(record.lastSentAt).getTime() + RESEND_COOLDOWN_MS
  );
  return {
    email: maskEmail(record.email),
    expiresAt: record.expiresAt.toISOString(),
    resendAvailableAt: resendAvailableAt.toISOString(),
  };
}

function nextSendCount(record, now) {
  const hourElapsed = now.getTime() - new Date(record.createdAt).getTime() >= ONE_HOUR_MS;
  const sendCount = hourElapsed ? 1 : record.sendCount + 1;
  if (sendCount > MAX_SENDS_PER_HOUR) {
    throw new AppError(
      "Too many verification requests. Please try again later.",
      429
    );
  }
  return { sendCount, resetWindow: hourElapsed };
}

async function startRegistration({ name, email, phone, password }) {
  await assertRegisterable({ email, phone });

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);
  const passwordHash = await hashPassword(password);
  const otpCode = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await prisma.registrationOtp.deleteMany({
    where: { email: normalizedEmail, usedAt: null },
  });

  const record = await prisma.registrationOtp.create({
    data: {
      email: normalizedEmail,
      phone: normalizedPhone,
      name: name.trim(),
      passwordHash,
      otpHash: hashOtpCode(otpCode),
      expiresAt,
      lastSentAt: now,
      sendCount: 1,
    },
  });

  await sendRegistrationOtpEmail({
    to: normalizedEmail,
    name: record.name,
    otpCode,
  });

  return buildOtpResponse(record);
}

async function verifyRegistrationOtp({ email, otp }) {
  const normalizedEmail = normalizeEmail(email);
  const code = String(otp || "").trim();

  if (!/^\d{6}$/.test(code)) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  const record = await findActiveOtpRecord(normalizedEmail);
  if (!record) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  if (record.usedAt) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  if (!verifyOtpCode(code, record.otpHash)) {
    await prisma.registrationOtp.update({
      where: { id: record.id },
      data: { failedAttempts: { increment: 1 } },
    });
    throw new AppError("Invalid or expired verification code", 400);
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { phone: record.phone }],
    },
  });

  if (existing) {
    await prisma.registrationOtp.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    throw new AppError("Email already exists", 409);
  }

  const customerRole = await prisma.role.findUnique({
    where: { name: "CUSTOMER" },
  });

  if (!customerRole) {
    throw new AppError("Customer role is not configured", 500);
  }

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        roleId: customerRole.id,
        name: record.name,
        email: normalizedEmail,
        phone: record.phone,
        password: record.passwordHash,
        emailVerified: true,
        status: "ACTIVE",
      },
      include: { role: true },
    });

    await tx.customer.create({
      data: {
        userId: created.id,
      },
    });

    await tx.registrationOtp.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return created;
  });

  const token = signAccessToken(user.id, user.role.name);

  return {
    user: toAuthUser(user),
    token,
  };
}

async function resendRegistrationOtp({ email }) {
  const normalizedEmail = normalizeEmail(email);
  const record = await findActiveOtpRecord(normalizedEmail);

  if (!record || record.usedAt) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  const cooldownEnds = new Date(record.lastSentAt).getTime() + RESEND_COOLDOWN_MS;
  if (Date.now() < cooldownEnds) {
    throw new AppError("Please wait before requesting a new code", 429);
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new AppError(
      "Verification has expired. Please register again to receive a new code.",
      400
    );
  }

  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  const otpCode = generateOtpCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
  const { sendCount, resetWindow } = nextSendCount(record, now);

  const updated = await prisma.registrationOtp.update({
    where: { id: record.id },
    data: {
      otpHash: hashOtpCode(otpCode),
      expiresAt,
      lastSentAt: now,
      sendCount,
      ...(resetWindow ? { createdAt: now } : {}),
    },
  });

  await sendRegistrationOtpEmail({
    to: updated.email,
    name: updated.name,
    otpCode,
  });

  return buildOtpResponse(updated);
}

module.exports = {
  startRegistration,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  hashOtpCode,
};