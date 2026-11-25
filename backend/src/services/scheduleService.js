const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { parsePagination, buildPagination } = require("../utils/query");

function normalizeTime(value) {
  const trimmed = String(value).trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function toMinutes(value) {
  const [hours, minutes] = normalizeTime(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function parseDateOnly(value) {
  const date = new Date(`${String(value).trim()}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid date", 400);
  }
  return date;
}

function formatDate(value) {
  return value.toISOString().slice(0, 10);
}

function serializeSchedule(schedule) {
  return {
    id: schedule.id,
    staffId: schedule.staffId,
    date: formatDate(schedule.date),
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    status: schedule.status,
    createdAt: schedule.createdAt,
    updatedAt: schedule.updatedAt,
    staff: schedule.staff
      ? {
          id: schedule.staff.id,
          specialization: schedule.staff.specialization,
          status: schedule.staff.status,
          name: schedule.staff.user?.name,
          email: schedule.staff.user?.email,
          phone: schedule.staff.user?.phone,
          avatar: schedule.staff.user?.avatar,
        }
      : undefined,
  };
}

const scheduleInclude = {
  staff: {
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    },
  },
};

function rangesOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

async function ensureStaffExists(staffId) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
    },
  });

  if (!staff) {
    throw new AppError("Staff not found", 404);
  }

  return staff;
}

async function findStaffIdByUserId(userId) {
  const staff = await prisma.staff.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!staff) {
    throw new AppError("Staff profile not found", 404);
  }

  return staff.id;
}

async function assertNoOverlap({ staffId, date, startTime, endTime, excludeId }) {
  const day = parseDateOnly(date);
  const existing = await prisma.staffSchedule.findMany({
    where: {
      staffId,
      date: day,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  const exactDuplicate = existing.find(
    (item) => normalizeTime(item.startTime) === normalizeTime(startTime)
  );
  if (exactDuplicate) {
    throw new AppError("Duplicate schedule for this staff, date and startTime", 409);
  }

  const overlapping = existing.find((item) =>
    rangesOverlap(startTime, endTime, item.startTime, item.endTime)
  );
  if (overlapping) {
    throw new AppError(
      `Schedule overlaps with existing slot ${overlapping.startTime.slice(0, 5)}-${overlapping.endTime.slice(0, 5)}`,
      409
    );
  }
}

async function listSchedules(query, actor) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (actor.role === "STAFF") {
    where.staffId = await findStaffIdByUserId(actor.userId);
  } else if (query.staffId) {
    where.staffId = query.staffId;
  }

  if (query.date) {
    where.date = parseDateOnly(query.date);
  } else if (query.from || query.to) {
    where.date = {};
    if (query.from) where.date.gte = parseDateOnly(query.from);
    if (query.to) where.date.lte = parseDateOnly(query.to);
  }

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  const [total, rows] = await Promise.all([
    prisma.staffSchedule.count({ where }),
    prisma.staffSchedule.findMany({
      where,
      include: scheduleInclude,
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeSchedule),
    pagination: buildPagination(page, limit, total),
  };
}

async function getScheduleById(id, actor) {
  const schedule = await prisma.staffSchedule.findUnique({
    where: { id },
    include: scheduleInclude,
  });

  if (!schedule) {
    throw new AppError("Schedule not found", 404);
  }

  if (actor.role === "STAFF") {
    const staffId = await findStaffIdByUserId(actor.userId);
    if (schedule.staffId !== staffId) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  }

  return serializeSchedule(schedule);
}

async function listSchedulesByStaff(staffId, query, actor) {
  if (actor.role === "STAFF") {
    const ownStaffId = await findStaffIdByUserId(actor.userId);
    if (ownStaffId !== staffId) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  } else {
    await ensureStaffExists(staffId);
  }

  return listSchedules({ ...query, staffId }, { role: "ADMIN", userId: actor.userId });
}

async function createSchedule(payload) {
  await ensureStaffExists(payload.staffId);

  const startTime = normalizeTime(payload.startTime);
  const endTime = normalizeTime(payload.endTime);
  const date = parseDateOnly(payload.date);

  await assertNoOverlap({
    staffId: payload.staffId,
    date: payload.date,
    startTime,
    endTime,
  });

  const schedule = await prisma.staffSchedule.create({
    data: {
      staffId: payload.staffId,
      date,
      startTime,
      endTime,
      status: payload.status || "AVAILABLE",
    },
    include: scheduleInclude,
  });

  return serializeSchedule(schedule);
}

async function updateSchedule(id, payload) {
  const existing = await prisma.staffSchedule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Schedule not found", 404);
  }

  const staffId = payload.staffId || existing.staffId;
  if (payload.staffId) {
    await ensureStaffExists(payload.staffId);
  }

  const dateValue = payload.date ? parseDateOnly(payload.date) : existing.date;
  const dateString = payload.date || formatDate(existing.date);
  const startTime = payload.startTime
    ? normalizeTime(payload.startTime)
    : existing.startTime;
  const endTime = payload.endTime ? normalizeTime(payload.endTime) : existing.endTime;

  if (toMinutes(startTime) >= toMinutes(endTime)) {
    throw new AppError("startTime must be before endTime", 400);
  }

  await assertNoOverlap({
    staffId,
    date: dateString,
    startTime,
    endTime,
    excludeId: id,
  });

  const data = {
    staffId,
    date: dateValue,
    startTime,
    endTime,
  };
  if (payload.status !== undefined) data.status = payload.status;

  const schedule = await prisma.staffSchedule.update({
    where: { id },
    data,
    include: scheduleInclude,
  });

  return serializeSchedule(schedule);
}

async function changeScheduleStatus(id, status) {
  const existing = await prisma.staffSchedule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Schedule not found", 404);
  }

  const schedule = await prisma.staffSchedule.update({
    where: { id },
    data: { status },
    include: scheduleInclude,
  });

  return serializeSchedule(schedule);
}

async function deleteSchedule(id) {
  const existing = await prisma.staffSchedule.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Schedule not found", 404);
  }

  await prisma.staffSchedule.delete({ where: { id } });
}

/**
 * Helper for Phase 6 Booking: check whether a staff works on a date/time.
 * Not exposed as a booking API in Phase 5.
 */
async function isStaffWorking(staffId, date, startTime, endTime) {
  const day = parseDateOnly(date);
  const slots = await prisma.staffSchedule.findMany({
    where: {
      staffId,
      date: day,
      status: "AVAILABLE",
    },
  });

  const start = normalizeTime(startTime);
  const end = normalizeTime(endTime);

  return slots.some(
    (slot) =>
      toMinutes(slot.startTime) <= toMinutes(start) &&
      toMinutes(slot.endTime) >= toMinutes(end)
  );
}

module.exports = {
  listSchedules,
  getScheduleById,
  listSchedulesByStaff,
  createSchedule,
  updateSchedule,
  changeScheduleStatus,
  deleteSchedule,
  isStaffWorking,
  findStaffIdByUserId,
};
