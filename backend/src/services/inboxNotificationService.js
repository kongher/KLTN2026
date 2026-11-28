const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { bookingCodeLabel } = require("./bookingCodeService");
const { parsePagination, buildPagination } = require("../utils/query");

function serializeInbox(row) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    actionLabel: row.actionLabel ?? null,
    actionPath: row.actionPath ?? null,
    isRead: row.isRead,
    createdAt: row.createdAt,
  };
}

async function countUnread(userId) {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

async function listInbox(userId, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const where = { userId };
  if (query.unreadOnly === "true" || query.unreadOnly === true) {
    where.isRead = false;
  }

  const [total, rows] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeInbox),
    unreadCount: await countUnread(userId),
    pagination: buildPagination(page, limit, total),
  };
}

async function getInboxItem(userId, id) {
  const row = await prisma.notification.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new AppError("Notification not found", 404);
  }
  return serializeInbox(row);
}

async function markRead(userId, id) {
  const row = await prisma.notification.findUnique({ where: { id } });
  if (!row || row.userId !== userId) {
    throw new AppError("Notification not found", 404);
  }
  if (row.isRead) {
    return serializeInbox(row);
  }
  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
  return serializeInbox(updated);
}

async function markAllRead(userId) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return { updated: result.count };
}

function formatBookingDateLabel(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("vi-VN");
}

function formatTimeHm(value) {
  if (!value) return "";
  return String(value).trim().slice(0, 5);
}

async function listActiveAdminUserIds() {
  const admins = await prisma.user.findMany({
    where: { status: "ACTIVE", role: { name: "ADMIN" } },
    select: { id: true },
  });
  return admins.map((row) => row.id);
}

async function notifyNewBookingCreated(booking) {
  const customerName = booking.customer?.user?.name || "Khách hàng";
  const serviceName = booking.service?.name || "Dịch vụ";
  const staffName = booking.staff?.user?.name || "Nhân viên";
  const dateLabel = formatBookingDateLabel(booking.bookingDate);
  const timeLabel = formatTimeHm(booking.startTime);

  const bookingRef = booking ? `\nMã lịch: ${bookingCodeLabel(booking)}` : "";
  const detail = `${customerName} đặt "${serviceName}" với ${staffName} vào ${dateLabel} lúc ${timeLabel}. Trạng thái: chờ xác nhận.`;

  const adminIds = await listActiveAdminUserIds();
  const staffUserId = booking.staff?.userId;
  const customerUserId = booking.customer?.userId;

  await createInboxNotificationsForUsers(adminIds, {
    title: "Lịch hẹn mới",
    message: `Có lịch hẹn mới cần theo dõi. ${detail}${bookingRef}`,
  });

  if (staffUserId) {
    await createInboxNotificationsForUsers([staffUserId], {
      title: "Có lịch hẹn mới",
      message: `${customerName} vừa đặt "${serviceName}" với bạn vào ${dateLabel} lúc ${timeLabel}. Vui lòng xác nhận hoặc từ chối lịch.${bookingRef}`,
    });
  }

}

async function createInboxNotificationsForUsers(
  userIds,
  { title, message, actionLabel, actionPath }
) {
  const titleTrimmed = String(title || "").trim();
  const messageTrimmed = String(message || "").trim();
  if (!titleTrimmed || !messageTrimmed) return { created: 0 };

  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return { created: 0 };

  const actionLabelValue = actionLabel ? String(actionLabel).trim().slice(0, 100) : null;
  const actionPathValue = actionPath ? String(actionPath).trim().slice(0, 255) : null;

  const result = await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      title: titleTrimmed.slice(0, 200),
      message: messageTrimmed,
      actionLabel: actionLabelValue,
      actionPath: actionPathValue,
      isRead: false,
    })),
  });

  return { created: result.count };
}

function buildBookingSummary(booking) {
  const serviceName = booking.service?.name || "Dịch vụ";
  const dateLabel = formatBookingDateLabel(booking.bookingDate);
  const timeLabel = formatTimeHm(booking.startTime);
  return { serviceName, dateLabel, timeLabel };
}

async function notifyBookingConfirmed(booking) {
  const customerUserId = booking.customer?.userId;
  if (!customerUserId) return;

  const { serviceName, dateLabel, timeLabel } = buildBookingSummary(booking);
  const code = bookingCodeLabel(booking);
  await createInboxNotificationsForUsers([customerUserId], {
    title: "Lịch hẹn đã được xác nhận",
    message: `Lịch hẹn "${serviceName}" (${code}) ngày ${dateLabel} lúc ${timeLabel} của bạn đã được xác nhận. Vui lòng đến trước giờ hẹn khoảng 10 phút.`,
  });
}

async function notifyBookingRejected(booking) {
  const customerUserId = booking.customer?.userId;
  if (!customerUserId) return;

  const { serviceName, dateLabel, timeLabel } = buildBookingSummary(booking);
  const code = bookingCodeLabel(booking);
  await createInboxNotificationsForUsers([customerUserId], {
    title: "Lịch hẹn bị từ chối",
    message: `Lịch "${serviceName}" (${code}) ngày ${dateLabel} lúc ${timeLabel} không được xác nhận. Bạn có thể chọn ngày khác hoặc đặt lịch với nhân viên khác.`,
  });
}

async function notifyBookingCompleted(booking) {
  const customerUserId = booking.customer?.userId;
  if (!customerUserId) return;

  const { serviceName, dateLabel, timeLabel } = buildBookingSummary(booking);
  const code = bookingCodeLabel(booking);
  await createInboxNotificationsForUsers([customerUserId], {
    title: "Hoàn thành dịch vụ",
    message: `Liệu trình "${serviceName}" (${code}) ngày ${dateLabel} lúc ${timeLabel} đã hoàn thành. Cảm ơn bạn đã tin tưởng Lumina Spa!`,
    actionLabel: "Đánh giá dịch vụ",
    actionPath: `/customer/bookings?reviewBookingId=${booking.id}`,
  });
}

function formatReviewStars(rating) {
  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) return `${rating} sao`;
  return `${value}/5 sao ${"⭐".repeat(value)}`;
}

const REVIEW_NOTIFY_TZ = process.env.APP_TIMEZONE || "Asia/Ho_Chi_Minh";

function formatReviewCreatedAt(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", { timeZone: REVIEW_NOTIFY_TZ });
}

function resolveAssignedStaffName(review) {
  const name = review?.staff?.user?.name?.trim();
  if (name) return name;
  return "Chưa phân công nhân viên";
}

function buildAdminReviewNotificationMessage(review) {
  const customerName = review.customer?.user?.name || review.customerName || "Khách hàng";
  const serviceName = review.service?.name || review.serviceName || "Dịch vụ";
  const staffName = resolveAssignedStaffName(review);
  const stars = formatReviewStars(review.rating);
  const reviewedAt = formatReviewCreatedAt(review.createdAt);
  const bookingCode =
    review.booking?.bookingCode ||
    review.bookingCode ||
    review.bookingId ||
    "—";

  return `Khách hàng ${customerName} vừa đánh giá dịch vụ ${serviceName} do nhân viên ${staffName} thực hiện.

Đánh giá: ${stars}
Mã Booking: ${bookingCode}
Thời gian đánh giá: ${reviewedAt}`;
}

async function inboxAlreadySentReviewForBooking(userId, title, bookingCode) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      title,
      message: { contains: `Mã Booking: ${bookingCode}` },
    },
    select: { id: true },
  });
  return Boolean(existing);
}

async function notifyReviewCreated(review) {
  if (!review?.id || !review.bookingId) return;

  let fullReview = review;
  if (!review.staff?.user?.name || !review.booking?.bookingCode) {
    fullReview =
      (await prisma.review.findUnique({
        where: { id: review.id },
        include: {
          customer: { include: { user: { select: { name: true } } } },
          service: { select: { name: true } },
          staff: { include: { user: { select: { name: true } } } },
          booking: { select: { bookingCode: true } },
        },
      })) || review;
  }

  const customerName = fullReview.customer?.user?.name || "Khách hàng";
  const serviceName = fullReview.service?.name || "Dịch vụ";
  const stars = formatReviewStars(fullReview.rating);
  const bookingRef =
    fullReview.booking?.bookingCode ||
    (
      await prisma.booking.findUnique({
        where: { id: fullReview.bookingId },
        select: { bookingCode: true },
      })
    )?.bookingCode ||
    fullReview.bookingId;
  const adminTitle = "Đánh giá dịch vụ mới";
  const staffTitle = "Bạn vừa nhận được đánh giá mới";

  const adminIds = await listActiveAdminUserIds();
  const adminRecipients = [];
  for (const adminId of adminIds) {
    if (!(await inboxAlreadySentReviewForBooking(adminId, adminTitle, bookingRef))) {
      adminRecipients.push(adminId);
    }
  }

  if (adminRecipients.length > 0) {
    await createInboxNotificationsForUsers(adminRecipients, {
      title: adminTitle,
      message: buildAdminReviewNotificationMessage(fullReview),
      actionLabel: "Xem đánh giá",
      actionPath: `/admin/reviews/${fullReview.id}`,
    });
  }

  const staffUserId =
    fullReview.staff?.userId ||
    (
      await prisma.staff.findUnique({
        where: { id: fullReview.staffId },
        select: { userId: true },
      })
    )?.userId;

  if (
    staffUserId &&
    !(await inboxAlreadySentReviewForBooking(staffUserId, staffTitle, bookingRef))
  ) {
    await createInboxNotificationsForUsers([staffUserId], {
      title: staffTitle,
      message: `Khách hàng ${customerName} đã đánh giá Booking mà bạn thực hiện.
Số sao: ${stars}
Dịch vụ: ${serviceName}
Mã Booking: ${bookingRef}`,
      actionLabel: "Xem lịch hẹn",
      actionPath: `/staff/bookings/${fullReview.bookingId}`,
    });
  }
}

module.exports = {
  countUnread,
  listInbox,
  getInboxItem,
  markRead,
  markAllRead,
  createInboxNotificationsForUsers,
  notifyNewBookingCreated,
  notifyBookingConfirmed,
  notifyBookingRejected,
  notifyBookingCompleted,
  notifyReviewCreated,
  listActiveAdminUserIds,
};