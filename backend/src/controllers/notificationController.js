const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const emailNotificationService = require("../services/emailNotificationService");

const create = asyncHandler(async (req, res) => {
  const data = await emailNotificationService.createAndSend(req.user.userId, req.body);
  return success(res, "Notification sent", data, 201);
});

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await emailNotificationService.listNotifications(req.query);
  return success(res, "Notifications fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await emailNotificationService.getNotificationById(req.params.id);
  return success(res, "Notification fetched", data);
});

const listRecipients = asyncHandler(async (req, res) => {
  const { items, pagination } = await emailNotificationService.listRecipients(
    req.params.id,
    req.query
  );
  return success(res, "Recipients fetched", items, 200, { pagination });
});

const retry = asyncHandler(async (req, res) => {
  const data = await emailNotificationService.retryFailed(req.params.id);
  return success(res, "Retry completed", data);
});

const searchRecipients = asyncHandler(async (req, res) => {
  const data = await emailNotificationService.searchRecipientUsers(req.query);
  return success(res, "Users fetched", data);
});

module.exports = {
  create,
  list,
  getById,
  listRecipients,
  retry,
  searchRecipients,
};