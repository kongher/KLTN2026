const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { parsePagination, buildPagination } = require("../utils/query");
const { isStaffWorking } = require("./scheduleService");

const ACTIVE_BOOKING_STATUSES = ["PENDING", "CONFIRMED"];

function normalizeTime(value) {
  const trimmed = String(value).trim();
  return trimmed.length === 5 ? `${trimmed}:00` : trimmed;
}

function toMinutes(value) {
  const [hours, minutes] = normalizeTime(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
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

function rangesOverlap(startA, endA, startB, endB) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function isPastBooking(dateString, startTime) {
  const today = todayDateString();
  if (dateString < today) return true;
  if (dateString > today) return false;
  return toMinutes(startTime) <= nowMinutes();
}

function serializeBooking(booking) {
  return {
    id: booking.id,
    customerId: booking.customerId,
    staffId: booking.staffId,
    serviceId: booking.serviceId,
    voucherId: booking.voucherId,
    bookingDate: formatDate(booking.bookingDate),
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    note: booking.note,
    totalPrice: Number(booking.totalPrice),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    service: booking.service
      ? {
          id: booking.service.id,
          name: booking.service.name,
          duration: booking.service.duration,
          price: Number(booking.service.price),
          image: booking.service.image,
          status: booking.service.status,
        }
      : undefined,
    staff: booking.staff
      ? {
          id: booking.staff.id,
          specialization: booking.staff.specialization,
          status: booking.staff.status,
          name: booking.staff.user?.name,
          email: booking.staff.user?.email,
          phone: booking.staff.user?.phone,
          avatar: booking.staff.user?.avatar,
        }
      : undefined,
    customer: booking.customer
      ? {
          id: booking.customer.id,
          name: booking.customer.user?.name,
          email: booking.customer.user?.email,
          phone: booking.customer.user?.phone,
        }
      : undefined,
  };
}

const bookingInclude = {
  service: true,
  staff: {
    include: {
      user: {
        select: { name: true, email: true, phone: true, avatar: true, status: true },
      },
    },
  },
  customer: {
    include: {
      user: {
        select: { name: true, email: true, phone: true },
      },
    },
  },
};

async function findCustomerByUserId(userId) {
  const customer = await prisma.customer.findUnique({
    where: { userId },
  });

  if (!customer) {
    throw new AppError("Customer profile not found", 404);
  }

  return customer;
}

async function getActiveService(serviceId) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { category: true },
  });

  if (!service || service.status !== "ACTIVE" || service.category.status !== "ACTIVE") {
    throw new AppError("Service is not available", 400);
  }

  return service;
}

async function getActiveStaffForService(staffId, serviceId) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true, status: true } },
      staffServices: {
        where: { serviceId },
        select: { id: true },
      },
    },
  });

  if (!staff || staff.status !== "ACTIVE" || staff.user.status !== "ACTIVE") {
    throw new AppError("Staff is not available", 400);
  }

  if (staff.staffServices.length === 0) {
    throw new AppError("Staff cannot perform this service", 400);
  }

  return staff;
}

async function assertNoBookingOverlap({ staffId, bookingDate, startTime, endTime, excludeId }) {
  const day = parseDateOnly(bookingDate);
  const existing = await prisma.booking.findMany({
    where: {
      staffId,
      bookingDate: day,
      status: { in: ACTIVE_BOOKING_STATUSES },
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  const overlapping = existing.find((item) =>
    rangesOverlap(startTime, endTime, item.startTime, item.endTime)
  );

  if (overlapping) {
    throw new AppError(
      `Time slot overlaps with existing booking ${overlapping.startTime.slice(0, 5)}-${overlapping.endTime.slice(0, 5)}`,
      409
    );
  }
}

async function listBookings(query, actor) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (actor.role === "CUSTOMER") {
    const customer = await findCustomerByUserId(actor.userId);
    where.customerId = customer.id;
  } else {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  if (query.from || query.to) {
    where.bookingDate = {};
    if (query.from) where.bookingDate.gte = parseDateOnly(query.from);
    if (query.to) where.bookingDate.lte = parseDateOnly(query.to);
  }

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeBooking),
    pagination: buildPagination(page, limit, total),
  };
}

async function getBookingById(id, actor) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (actor.role === "CUSTOMER") {
    const customer = await findCustomerByUserId(actor.userId);
    if (booking.customerId !== customer.id) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  } else {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  return serializeBooking(booking);
}

async function getAvailableStaff({ serviceId, bookingDate }) {
  await getActiveService(serviceId);

  const staff = await prisma.staff.findMany({
    where: {
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      staffServices: { some: { serviceId } },
    },
    include: {
      user: {
        select: { name: true, email: true, phone: true, avatar: true, status: true },
      },
      schedules: bookingDate
        ? {
            where: {
              date: parseDateOnly(bookingDate),
              status: "AVAILABLE",
            },
            select: { id: true, startTime: true, endTime: true },
          }
        : false,
    },
    orderBy: { user: { name: "asc" } },
  });

  const filtered = bookingDate
    ? staff.filter((item) => Array.isArray(item.schedules) && item.schedules.length > 0)
    : staff;

  return filtered.map((item) => ({
    id: item.id,
    specialization: item.specialization,
    status: item.status,
    name: item.user.name,
    email: item.user.email,
    phone: item.user.phone,
    avatar: item.user.avatar,
  }));
}

async function getAvailableSlots({ serviceId, staffId, bookingDate }) {
  const service = await getActiveService(serviceId);
  await getActiveStaffForService(staffId, serviceId);

  const day = parseDateOnly(bookingDate);
  const schedules = await prisma.staffSchedule.findMany({
    where: {
      staffId,
      date: day,
      status: "AVAILABLE",
    },
    orderBy: { startTime: "asc" },
  });

  if (schedules.length === 0) {
    return [];
  }

  const bookings = await prisma.booking.findMany({
    where: {
      staffId,
      bookingDate: day,
      status: { in: ACTIVE_BOOKING_STATUSES },
    },
  });

  const duration = service.duration;
  const slots = [];

  for (const schedule of schedules) {
    const scheduleStart = toMinutes(schedule.startTime);
    const scheduleEnd = toMinutes(schedule.endTime);

    for (let start = scheduleStart; start + duration <= scheduleEnd; start += duration) {
      const end = start + duration;
      const startTime = minutesToTime(start);
      const endTime = minutesToTime(end);

      if (isPastBooking(bookingDate, startTime)) {
        continue;
      }

      const overlaps = bookings.some((booking) =>
        rangesOverlap(startTime, endTime, booking.startTime, booking.endTime)
      );

      if (!overlaps) {
        slots.push({
          startTime,
          endTime,
          label: `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`,
        });
      }
    }
  }

  return slots;
}

async function createBooking(userId, payload) {
  const customer = await findCustomerByUserId(userId);
  const service = await getActiveService(payload.serviceId);
  await getActiveStaffForService(payload.staffId, payload.serviceId);

  const bookingDate = String(payload.bookingDate).trim();
  const startTime = normalizeTime(payload.startTime);
  const endTime = minutesToTime(toMinutes(startTime) + service.duration);

  if (isPastBooking(bookingDate, startTime)) {
    throw new AppError("Cannot book a time in the past", 400);
  }

  const working = await isStaffWorking(payload.staffId, bookingDate, startTime, endTime);
  if (!working) {
    throw new AppError("Selected time is outside staff working hours", 400);
  }

  await assertNoBookingOverlap({
    staffId: payload.staffId,
    bookingDate,
    startTime,
    endTime,
  });

  let voucherId = null;
  if (payload.voucherId) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: payload.voucherId },
    });
    if (!voucher || voucher.status !== "ACTIVE") {
      throw new AppError("Voucher is not available", 400);
    }
    voucherId = voucher.id;
  }

  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      staffId: payload.staffId,
      serviceId: payload.serviceId,
      voucherId,
      bookingDate: parseDateOnly(bookingDate),
      startTime,
      endTime,
      status: "PENDING",
      note: payload.note?.trim() || null,
      totalPrice: service.price,
    },
    include: bookingInclude,
  });

  return serializeBooking(booking);
}

async function cancelBooking(id, userId) {
  const customer = await findCustomerByUserId(userId);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.customerId !== customer.id) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  if (booking.status !== "PENDING") {
    throw new AppError("Only PENDING bookings can be cancelled by customer", 400);
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
    include: bookingInclude,
  });

  return serializeBooking(updated);
}

async function findStaffByUserId(userId) {
  const staff = await prisma.staff.findUnique({
    where: { userId },
  });

  if (!staff) {
    throw new AppError("Staff profile not found", 404);
  }

  return staff;
}

const STAFF_VISIBLE_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
];

const STAFF_TRANSITIONS = {
  confirm: { from: "PENDING", to: "CONFIRMED" },
  reject: { from: "PENDING", to: "REJECTED" },
  cancel: { from: "CONFIRMED", to: "CANCELLED" },
  complete: { from: "CONFIRMED", to: "COMPLETED" },
};

async function listStaffBookings(query, userId) {
  const staff = await findStaffByUserId(userId);
  const { page, limit, skip } = parsePagination(query);
  const where = {
    staffId: staff.id,
    status: { in: STAFF_VISIBLE_STATUSES },
  };

  if (query.status && query.status !== "ALL") {
    if (!STAFF_VISIBLE_STATUSES.includes(query.status)) {
      return {
        items: [],
        pagination: buildPagination(page, limit, 0),
      };
    }
    where.status = query.status;
  }

  const search = query.search?.trim();
  if (search) {
    where.customer = {
      user: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      },
    };
  }

  if (query.from || query.to) {
    where.bookingDate = {};
    if (query.from) where.bookingDate.gte = parseDateOnly(query.from);
    if (query.to) where.bookingDate.lte = parseDateOnly(query.to);
  }

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeBooking),
    pagination: buildPagination(page, limit, total),
  };
}

async function getStaffBookingById(id, userId) {
  const staff = await findStaffByUserId(userId);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.staffId !== staff.id) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  if (!STAFF_VISIBLE_STATUSES.includes(booking.status)) {
    throw new AppError("Booking is not available", 403);
  }

  return serializeBooking(booking);
}

async function countPendingStaffBookings(userId) {
  const staff = await findStaffByUserId(userId);
  return prisma.booking.count({
    where: { staffId: staff.id, status: "PENDING" },
  });
}

async function countPendingAdminBookings() {
  return prisma.booking.count({
    where: { status: "PENDING" },
  });
}

async function transitionStaffBooking(id, userId, action) {
  const transition = STAFF_TRANSITIONS[action];
  if (!transition) {
    throw new AppError("Invalid booking action", 400);
  }

  const staff = await findStaffByUserId(userId);
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.staffId !== staff.id) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  if (booking.status !== transition.from) {
    throw new AppError(
      `Invalid status transition: ${booking.status} cannot be changed to ${transition.to}`,
      400
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: transition.to },
    include: bookingInclude,
  });

  return serializeBooking(updated);
}

async function listAdminBookings(query) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (query.status && query.status !== "ALL") {
    where.status = query.status;
  }

  const search = query.search?.trim();
  if (search) {
    where.OR = [
      {
        customer: {
          user: {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      },
      {
        staff: {
          user: {
            OR: [
              { name: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      },
      { service: { name: { contains: search } } },
    ];
  }

  if (query.from || query.to) {
    where.bookingDate = {};
    if (query.from) where.bookingDate.gte = parseDateOnly(query.from);
    if (query.to) where.bookingDate.lte = parseDateOnly(query.to);
  }

  const [total, rows] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeBooking),
    pagination: buildPagination(page, limit, total),
  };
}

async function getAdminBookingById(id) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: bookingInclude,
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  return serializeBooking(booking);
}

module.exports = {
  listBookings,
  getBookingById,
  getAvailableStaff,
  getAvailableSlots,
  createBooking,
  cancelBooking,
  listStaffBookings,
  getStaffBookingById,
  transitionStaffBooking,
  listAdminBookings,
  getAdminBookingById,
  countPendingStaffBookings,
  countPendingAdminBookings,
  findStaffByUserId,
  findCustomerByUserId,
  serializeBooking,
  bookingInclude,
  formatDate,
};
