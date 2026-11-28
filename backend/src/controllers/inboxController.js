const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const inboxNotificationService = require("../services/inboxNotificationService");

const unreadCount = asyncHandler(async (req, res) => {
  const count = await inboxNotificationService.countUnread(req.user.userId);
  return success(res, "Unread count", { count });
});

const list = asyncHandler(async (req, res) => {
  const { items, pagination, unreadCount: unread } = await inboxNotificationService.listInbox(
    req.user.userId,
    req.query
  );
  return success(res, "Inbox fetched", items, 200, { pagination, unreadCount: unread });
});

const getById = asyncHandler(async (req, res) => {
  const data = await inboxNotificationService.getInboxItem(req.user.userId, req.params.id);
  return success(res, "Notification fetched", data);
});

const read = asyncHandler(async (req, res) => {
  const data = await inboxNotificationService.markRead(req.user.userId, req.params.id);
  return success(res, "Marked as read", data);
});

const readAll = asyncHandler(async (req, res) => {
  const data = await inboxNotificationService.markAllRead(req.user.userId);
  return success(res, "All marked as read", data);
});

module.exports = {
  unreadCount,
  list,
  getById,
  read,
  readAll,
};