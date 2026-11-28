const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { parsePagination, buildPagination } = require("../utils/query");
const { notifyReviewCreated } = require("./inboxNotificationService");

const MAX_COMMENT_LENGTH = 1000;

const reviewInclude = {
  customer: {
    include: {
      user: { select: { name: true, avatar: true, id: true, email: true, phone: true } },
    },
  },
  service: { select: { id: true, name: true } },
  staff: {
    include: {
      user: { select: { name: true } },
    },
  },
  booking: {
    select: {
      id: true,
      bookingCode: true,
      bookingDate: true,
      status: true,
      startTime: true,
      endTime: true,
    },
  },
};

function serializeReview(review) {
  return {
    id: review.id,
    customerId: review.customerId,
    serviceId: review.serviceId,
    staffId: review.staffId,
    bookingId: review.bookingId,
    bookingCode: review.booking?.bookingCode || null,
    rating: review.rating,
    comment: review.comment,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    customerName: review.customer?.user?.name || "Khách hàng",
    customerAvatar: review.customer?.user?.avatar || null,
    serviceName: review.service?.name || null,
    staffName: review.staff?.user?.name?.trim() || null,
    customerEmail: review.customer?.user?.email || null,
    customerPhone: review.customer?.user?.phone || null,
    bookingDate: review.booking?.bookingDate
      ? review.booking.bookingDate.toISOString().slice(0, 10)
      : null,
    bookingStatus: review.booking?.status || null,
    bookingStartTime: review.booking?.startTime || null,
    bookingEndTime: review.booking?.endTime || null,
  };
}

async function findCustomerByUserId(userId) {
  const customer = await prisma.customer.findUnique({ where: { userId } });
  if (!customer) {
    throw new AppError("Customer profile not found", 404);
  }
  return customer;
}

async function findStaffByUserId(userId) {
  const staff = await prisma.staff.findUnique({ where: { userId } });
  if (!staff) {
    throw new AppError("Staff profile not found", 404);
  }
  return staff;
}

function normalizeComment(comment) {
  if (comment === undefined || comment === null || comment === "") return null;
  const trimmed = String(comment).trim();
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    throw new AppError(`Comment must be at most ${MAX_COMMENT_LENGTH} characters`, 400);
  }
  return trimmed;
}

function validateRating(rating) {
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new AppError("Rating must be between 1 and 5", 400);
  }
  return value;
}

async function getBookingForReview(bookingId, customerId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { reviews: { select: { id: true } } },
  });

  if (!booking) {
    throw new AppError("Booking not found", 404);
  }
  if (booking.customerId !== customerId) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }
  if (booking.status !== "COMPLETED") {
    throw new AppError("Only completed bookings can be reviewed", 400);
  }
  if (booking.reviews.length > 0) {
    throw new AppError("This booking already has a review", 409);
  }

  return booking;
}

async function createReview(userId, { bookingId, rating, comment }) {
  const customer = await findCustomerByUserId(userId);
  const booking = await getBookingForReview(bookingId, customer.id);
  const ratingValue = validateRating(rating);
  const commentValue = normalizeComment(comment);

  let review;
  try {
    review = await prisma.review.create({
      data: {
        customerId: customer.id,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        bookingId: booking.id,
        rating: ratingValue,
        comment: commentValue,
        status: "VISIBLE",
      },
      include: reviewInclude,
    });
  } catch (err) {
    if (err?.code === "P2002") {
      throw new AppError("This booking already has a review", 409);
    }
    throw err;
  }

  void notifyReviewCreated(review).catch((error) => {
    console.error("notifyReviewCreated failed:", error);
  });

  return serializeReview(review);
}

async function updateReview(userId, reviewId, { rating, comment }) {
  const customer = await findCustomerByUserId(userId);
  const existing = await prisma.review.findUnique({ where: { id: reviewId } });

  if (!existing) {
    throw new AppError("Review not found", 404);
  }
  if (existing.customerId !== customer.id) {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  const data = {};
  if (rating !== undefined) data.rating = validateRating(rating);
  if (comment !== undefined) data.comment = normalizeComment(comment);

  const review = await prisma.review.update({
    where: { id: reviewId },
    data,
    include: reviewInclude,
  });

  return serializeReview(review);
}

async function listMyReviews(userId, query = {}) {
  const customer = await findCustomerByUserId(userId);
  const { page, limit, skip } = parsePagination(query);
  const where = { customerId: customer.id };

  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeReview),
    pagination: buildPagination(page, limit, total),
  };
}

async function listByService(serviceId, query = {}) {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) {
    throw new AppError("Service not found", 404);
  }

  const { page, limit, skip } = parsePagination(query);
  const where = { serviceId, status: "VISIBLE" };

  const [total, rows, aggregate] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  return {
    items: rows.map(serializeReview),
    pagination: buildPagination(page, limit, total),
    summary: {
      averageRating: aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0,
      totalReviews: aggregate._count._all || 0,
    },
  };
}

async function listAdminReviews(query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = {};

  if (query.serviceId) {
    where.serviceId = query.serviceId;
  }

  if (query.rating) {
    const rating = Number(query.rating);
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) {
      where.rating = rating;
    }
  }

  if (query.status === "VISIBLE" || query.status === "HIDDEN") {
    where.status = query.status;
  }

  const search = query.search?.trim();
  if (search) {
    where.customer = {
      user: { name: { contains: search } },
    };
  }

  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeReview),
    pagination: buildPagination(page, limit, total),
  };
}

async function getReviewById(id, actor) {
  const review = await prisma.review.findUnique({
    where: { id },
    include: reviewInclude,
  });

  if (!review) {
    throw new AppError("Review not found", 404);
  }

  if (actor?.role === "CUSTOMER") {
    const customer = await findCustomerByUserId(actor.userId);
    if (review.customerId !== customer.id) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  } else if (actor?.role === "STAFF") {
    const staff = await findStaffByUserId(actor.userId);
    if (review.staffId !== staff.id) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }
  } else if (actor?.role !== "ADMIN") {
    throw new AppError("Forbidden: insufficient permissions", 403);
  }

  return serializeReview(review);
}

async function listStaffReviews(userId, query = {}) {
  const staff = await findStaffByUserId(userId);
  const { page, limit, skip } = parsePagination(query);
  const where = { staffId: staff.id };

  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeReview),
    pagination: buildPagination(page, limit, total),
  };
}

async function changeReviewStatus(id, status) {
  if (status !== "VISIBLE" && status !== "HIDDEN") {
    throw new AppError("Invalid status", 400);
  }

  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Review not found", 404);
  }

  const review = await prisma.review.update({
    where: { id },
    data: { status },
    include: reviewInclude,
  });

  return serializeReview(review);
}

async function getReviewByBookingForCustomer(userId, bookingId) {
  const customer = await findCustomerByUserId(userId);
  const review = await prisma.review.findUnique({
    where: { bookingId },
    include: reviewInclude,
  });

  if (!review || review.customerId !== customer.id) {
    return null;
  }

  return serializeReview(review);
}

module.exports = {
  createReview,
  updateReview,
  listMyReviews,
  listByService,
  listAdminReviews,
  listStaffReviews,
  getReviewById,
  changeReviewStatus,
  getReviewByBookingForCustomer,
};