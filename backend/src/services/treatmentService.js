const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { parsePagination, buildPagination } = require("../utils/query");
const {
  findStaffByUserId,
  findCustomerByUserId,
  formatDate,
} = require("./bookingService");

const treatmentInclude = {
  customer: {
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
    },
  },
  staff: {
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
    },
  },
  service: {
    select: {
      id: true,
      name: true,
      duration: true,
      price: true,
      image: true,
      status: true,
    },
  },
  booking: {
    select: {
      id: true,
      bookingDate: true,
      startTime: true,
      endTime: true,
      status: true,
      totalPrice: true,
    },
  },
};

function serializeTreatment(record) {
  return {
    id: record.id,
    customerId: record.customerId,
    bookingId: record.bookingId,
    serviceId: record.serviceId,
    staffId: record.staffId,
    note: record.note,
    beforeImage: record.beforeImage,
    afterImage: record.afterImage,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    customer: record.customer
      ? {
          id: record.customer.id,
          name: record.customer.user?.name,
          email: record.customer.user?.email,
          phone: record.customer.user?.phone,
          avatar: record.customer.user?.avatar,
        }
      : undefined,
    staff: record.staff
      ? {
          id: record.staff.id,
          specialization: record.staff.specialization,
          name: record.staff.user?.name,
          email: record.staff.user?.email,
          phone: record.staff.user?.phone,
          avatar: record.staff.user?.avatar,
        }
      : undefined,
    service: record.service
      ? {
          id: record.service.id,
          name: record.service.name,
          duration: record.service.duration,
          price: Number(record.service.price),
          image: record.service.image,
          status: record.service.status,
        }
      : undefined,
    booking: record.booking
      ? {
          id: record.booking.id,
          bookingDate: formatDate(record.booking.bookingDate),
          startTime: record.booking.startTime,
          endTime: record.booking.endTime,
          status: record.booking.status,
          totalPrice: Number(record.booking.totalPrice),
        }
      : undefined,
  };
}

async function createTreatment(userId, payload) {
  const staff = await findStaffByUserId(userId);
  const booking = await prisma.booking.findUnique({
    where: { id: payload.bookingId },
    include: { treatmentRecord: true },
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }

  if (booking.staffId !== staff.id) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  if (booking.status !== "COMPLETED") {
    throw new AppError("Only COMPLETED bookings can have a treatment record", 400);
  }

  if (booking.treatmentRecord) {
    throw new AppError("Treatment record already exists for this booking", 409);
  }

  const record = await prisma.treatmentRecord.create({
    data: {
      customerId: booking.customerId,
      bookingId: booking.id,
      serviceId: booking.serviceId,
      staffId: booking.staffId,
      note: payload.note?.trim() || null,
      beforeImage: payload.beforeImage?.trim() || null,
      afterImage: payload.afterImage?.trim() || null,
    },
    include: treatmentInclude,
  });

  return serializeTreatment(record);
}

async function getTreatmentById(id, actor) {
  const record = await prisma.treatmentRecord.findUnique({
    where: { id },
    include: treatmentInclude,
  });

  if (!record) {
    throw new AppError("Treatment record not found", 404);
  }

  if (actor.role === "CUSTOMER") {
    const customer = await findCustomerByUserId(actor.userId);
    if (record.customerId !== customer.id) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  } else if (actor.role === "STAFF") {
    const staff = await findStaffByUserId(actor.userId);
    if (record.staffId !== staff.id) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  } else if (actor.role !== "ADMIN") {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  return serializeTreatment(record);
}

async function updateTreatment(id, userId, payload) {
  const staff = await findStaffByUserId(userId);
  const existing = await prisma.treatmentRecord.findUnique({ where: { id } });

  if (!existing) {
    throw new AppError("Treatment record not found", 404);
  }

  if (existing.staffId !== staff.id) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  const data = {};
  if (payload.note !== undefined) {
    data.note = payload.note === "" || payload.note == null ? null : payload.note.trim();
  }
  if (payload.beforeImage !== undefined) {
    data.beforeImage =
      payload.beforeImage === "" || payload.beforeImage == null
        ? null
        : payload.beforeImage.trim();
  }
  if (payload.afterImage !== undefined) {
    data.afterImage =
      payload.afterImage === "" || payload.afterImage == null
        ? null
        : payload.afterImage.trim();
  }

  const record = await prisma.treatmentRecord.update({
    where: { id },
    data,
    include: treatmentInclude,
  });

  return serializeTreatment(record);
}

async function listTreatmentsForActor(query, actor) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (actor.role === "CUSTOMER") {
    const customer = await findCustomerByUserId(actor.userId);
    where.customerId = customer.id;
  } else if (actor.role === "STAFF") {
    const staff = await findStaffByUserId(actor.userId);
    where.staffId = staff.id;
  } else if (actor.role === "ADMIN") {
    if (query.customerId) where.customerId = query.customerId;
    if (query.staffId) where.staffId = query.staffId;
  } else {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  const [total, rows] = await Promise.all([
    prisma.treatmentRecord.count({ where }),
    prisma.treatmentRecord.findMany({
      where,
      include: treatmentInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeTreatment),
    pagination: buildPagination(page, limit, total),
  };
}

async function listTreatmentsByCustomer(customerId, actor, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = { customerId };

  if (actor.role === "CUSTOMER") {
    const customer = await findCustomerByUserId(actor.userId);
    if (customer.id !== customerId) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  } else if (actor.role === "STAFF") {
    const staff = await findStaffByUserId(actor.userId);
    where.staffId = staff.id;
  } else if (actor.role !== "ADMIN") {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  const [total, rows] = await Promise.all([
    prisma.treatmentRecord.count({ where }),
    prisma.treatmentRecord.findMany({
      where,
      include: treatmentInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeTreatment),
    pagination: buildPagination(page, limit, total),
  };
}

async function listCompletedBookingsWithoutTreatment(userId) {
  const staff = await findStaffByUserId(userId);
  const bookings = await prisma.booking.findMany({
    where: {
      staffId: staff.id,
      status: "COMPLETED",
      treatmentRecord: null,
    },
    include: {
      customer: {
        include: {
          user: { select: { name: true, email: true, phone: true, avatar: true } },
        },
      },
      service: true,
    },
    orderBy: [{ bookingDate: "desc" }, { startTime: "desc" }],
  });

  return bookings.map((booking) => ({
    id: booking.id,
    bookingDate: formatDate(booking.bookingDate),
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    totalPrice: Number(booking.totalPrice),
    customer: {
      id: booking.customer.id,
      name: booking.customer.user?.name,
      email: booking.customer.user?.email,
      phone: booking.customer.user?.phone,
    },
    service: {
      id: booking.service.id,
      name: booking.service.name,
      duration: booking.service.duration,
      price: Number(booking.service.price),
    },
  }));
}

module.exports = {
  createTreatment,
  getTreatmentById,
  updateTreatment,
  listTreatmentsForActor,
  listTreatmentsByCustomer,
  listCompletedBookingsWithoutTreatment,
};
