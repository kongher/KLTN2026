const AppError = require("../utils/appError");

const SYSTEM_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh";

function formatDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SYSTEM_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) {
    throw new AppError("Failed to format booking day key", 500);
  }
  return `${year}${month}${day}`;
}

function formatBookingCode(dayKey, sequence) {
  if (sequence < 1 || sequence > 99999) {
    throw new AppError("Daily booking code sequence overflow", 503);
  }
  const suffix = sequence <= 999 ? String(sequence).padStart(3, "0") : String(sequence);
  return `BK${dayKey}${suffix}`;
}

/**
 * Allocate next booking code inside an existing Prisma transaction (atomic per day).
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 */
async function allocateBookingCode(tx) {
  const dayKey = formatDayKey(new Date());

  await tx.$executeRaw`
    INSERT INTO booking_daily_sequences (dayKey, lastSequence)
    VALUES (${dayKey}, LAST_INSERT_ID(1))
    ON DUPLICATE KEY UPDATE lastSequence = LAST_INSERT_ID(lastSequence + 1)
  `;

  const rows = await tx.$queryRaw`SELECT LAST_INSERT_ID() AS seq`;
  const sequence = Number(rows?.[0]?.seq);
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new AppError("Failed to allocate booking code", 500);
  }

  return formatBookingCode(dayKey, sequence);
}

function bookingCodeLabel(booking) {
  if (!booking) return "";
  return booking.bookingCode || booking.id;
}

module.exports = {
  SYSTEM_TIMEZONE,
  formatDayKey,
  formatBookingCode,
  allocateBookingCode,
  bookingCodeLabel,
};