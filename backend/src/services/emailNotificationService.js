const prisma = require("../config/prisma");
const AppError = require("../utils/appError");
const { createInboxNotificationsForUsers } = require("./inboxNotificationService");
const { parsePagination, buildPagination } = require("../utils/query");
const { sendBroadcastEmail } = require("./mailService");

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 400;

const TARGET_TYPES = new Set(["ALL_STAFF", "ALL_CUSTOMER", "SPECIFIC"]);
const CATEGORIES = new Set(["OPERATIONAL", "PROMOTIONAL"]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serializeRecipient(row) {
  return {
    id: row.id,
    notificationId: row.notificationId,
    userId: row.userId,
    email: row.email,
    status: row.status,
    sentAt: row.sentAt,
    errorMessage: row.errorMessage,
    userName: row.user?.name || null,
    userRole: row.user?.role?.name || null,
  };
}

function serializeNotification(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    targetType: row.targetType,
    category: row.category,
    createdById: row.createdById,
    sentSuccess: row.sentSuccess,
    sentFailed: row.sentFailed,
    createdAt: row.createdAt,
    createdByName: row.createdBy?.name || null,
    recipientCount: row._count?.recipients ?? row.recipientCount,
  };
}

async function resolveRecipients({ targetType, userIds = [], category }) {
  const baseWhere = {
    status: { in: ["ACTIVE", "INACTIVE"] },
    email: { not: "" },
    NOT: { role: { name: "ADMIN" } },
  };

  if (category === "PROMOTIONAL") {
    baseWhere.marketingEmailOptIn = true;
  }

  if (targetType === "ALL_STAFF") {
    return prisma.user.findMany({
      where: { ...baseWhere, role: { name: "STAFF" } },
      select: { id: true, email: true, name: true },
    });
  }

  if (targetType === "ALL_CUSTOMER") {
    return prisma.user.findMany({
      where: { ...baseWhere, role: { name: "CUSTOMER" } },
      select: { id: true, email: true, name: true },
    });
  }

  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new AppError("At least one recipient is required", 400);
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      ...baseWhere,
      role: { name: { in: ["STAFF", "CUSTOMER"] } },
    },
    select: { id: true, email: true, name: true },
  });

  if (users.length === 0) {
    throw new AppError("No valid recipients found", 400);
  }

  return users;
}

async function sendToRecipients(notification, recipients) {
  let success = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    // eslint-disable-next-line no-await-in-loop
    await Promise.all(
      batch.map(async (recipient) => {
        try {
          await sendBroadcastEmail({
            to: recipient.email,
            name: recipient.user?.name,
            title: notification.title,
            content: notification.content,
            sentAt: new Date(),
          });

          await prisma.emailNotificationRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              errorMessage: null,
            },
          });
          success += 1;
        } catch (error) {
          const message =
            error?.message && error.message.length < 500
              ? error.message
              : "Send failed";
          await prisma.emailNotificationRecipient.update({
            where: { id: recipient.id },
            data: {
              status: "FAILED",
              errorMessage: message,
            },
          });
          failed += 1;
        }
      })
    );

    if (i + BATCH_SIZE < recipients.length) {
      // eslint-disable-next-line no-await-in-loop
      await sleep(BATCH_DELAY_MS);
    }
  }

  const sentSuccess = await prisma.emailNotificationRecipient.count({
    where: { notificationId: notification.id, status: "SENT" },
  });
  const sentFailed = await prisma.emailNotificationRecipient.count({
    where: { notificationId: notification.id, status: "FAILED" },
  });

  await prisma.emailNotification.update({
    where: { id: notification.id },
    data: { sentSuccess, sentFailed },
  });

  return { success, failed };
}

async function createAndSend(adminUserId, payload) {
  const { title, content, targetType, category, userIds } = payload;

  if (!TARGET_TYPES.has(targetType)) {
    throw new AppError("Invalid target type", 400);
  }
  const categoryValue = CATEGORIES.has(category) ? category : "OPERATIONAL";

  const titleTrimmed = String(title || "").trim();
  const contentTrimmed = String(content || "").trim();
  if (titleTrimmed.length < 2 || titleTrimmed.length > 200) {
    throw new AppError("Title must be 2-200 characters", 400);
  }
  if (contentTrimmed.length < 2 || contentTrimmed.length > 5000) {
    throw new AppError("Content must be 2-5000 characters", 400);
  }

  const users = await resolveRecipients({
    targetType,
    userIds,
    category: categoryValue,
  });

  const uniqueUsers = Array.from(new Map(users.map((user) => [user.id, user])).values());

  const notification = await prisma.$transaction(async (tx) => {
    const created = await tx.emailNotification.create({
      data: {
        title: titleTrimmed,
        content: contentTrimmed,
        targetType,
        category: categoryValue,
        createdById: adminUserId,
      },
    });

    if (uniqueUsers.length > 0) {
      await tx.emailNotificationRecipient.createMany({
        data: uniqueUsers.map((user) => ({
          notificationId: created.id,
          userId: user.id,
          email: user.email.trim().toLowerCase(),
          status: "PENDING",
        })),
      });
    }

    return created;
  });

  const pendingRecipients = await prisma.emailNotificationRecipient.findMany({
    where: { notificationId: notification.id, status: "PENDING" },
    include: { user: { select: { name: true } } },
  });

  const stats = await sendToRecipients(notification, pendingRecipients);

  await createInboxNotificationsForUsers(
    uniqueUsers.map((user) => user.id),
    { title: titleTrimmed, message: contentTrimmed }
  );

  return {
    notification: serializeNotification({
      ...notification,
      sentSuccess: stats.success,
      sentFailed: stats.failed,
      recipientCount: uniqueUsers.length,
    }),
    stats,
  };
}

async function listNotifications(query = {}) {
  const { page, limit, skip } = parsePagination(query);

  const [total, rows] = await Promise.all([
    prisma.emailNotification.count(),
    prisma.emailNotification.findMany({
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { recipients: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeNotification),
    pagination: buildPagination(page, limit, total),
  };
}

async function getNotificationById(id) {
  const row = await prisma.emailNotification.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { recipients: true } },
    },
  });

  if (!row) {
    throw new AppError("Notification not found", 404);
  }

  return serializeNotification(row);
}

async function listRecipients(notificationId, query = {}) {
  const notification = await prisma.emailNotification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  const { page, limit, skip } = parsePagination(query);
  const where = { notificationId };

  if (query.status === "PENDING" || query.status === "SENT" || query.status === "FAILED") {
    where.status = query.status;
  }

  const [total, rows] = await Promise.all([
    prisma.emailNotificationRecipient.count({ where }),
    prisma.emailNotificationRecipient.findMany({
      where,
      include: {
        user: {
          select: { name: true, role: { select: { name: true } } },
        },
      },
      orderBy: { email: "asc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(serializeRecipient),
    pagination: buildPagination(page, limit, total),
  };
}

async function refreshStats(notificationId) {
  const [sentSuccess, sentFailed] = await Promise.all([
    prisma.emailNotificationRecipient.count({
      where: { notificationId, status: "SENT" },
    }),
    prisma.emailNotificationRecipient.count({
      where: { notificationId, status: "FAILED" },
    }),
  ]);

  await prisma.emailNotification.update({
    where: { id: notificationId },
    data: { sentSuccess, sentFailed },
  });
}

async function retryFailed(notificationId) {
  const notification = await prisma.emailNotification.findUnique({
    where: { id: notificationId },
  });
  if (!notification) {
    throw new AppError("Notification not found", 404);
  }

  const failedRecipients = await prisma.emailNotificationRecipient.findMany({
    where: { notificationId, status: "FAILED" },
    include: { user: { select: { name: true } } },
  });

  if (failedRecipients.length === 0) {
    throw new AppError("No failed recipients to retry", 400);
  }

  await sendToRecipients(notification, failedRecipients);
  await refreshStats(notificationId);

  return getNotificationById(notificationId);
}

async function searchRecipientUsers(query = {}) {
  const search = query.search?.trim();
  const roleFilter = query.role;

  const where = {
    status: "ACTIVE",
    role: { name: { in: ["STAFF", "CUSTOMER"] } },
  };

  if (roleFilter === "STAFF" || roleFilter === "CUSTOMER") {
    where.role = { name: roleFilter };
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    take: 20,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      marketingEmailOptIn: true,
      role: { select: { name: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role.name,
    marketingEmailOptIn: user.marketingEmailOptIn,
  }));
}

module.exports = {
  createAndSend,
  listNotifications,
  getNotificationById,
  listRecipients,
  retryFailed,
  searchRecipientUsers,
};