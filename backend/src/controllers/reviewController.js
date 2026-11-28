const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const reviewService = require("../services/reviewService");

const create = asyncHandler(async (req, res) => {
  const data = await reviewService.createReview(req.user.userId, req.body);
  return success(res, "Review created", data, 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await reviewService.updateReview(req.user.userId, req.params.id, req.body);
  return success(res, "Review updated", data);
});

const listMine = asyncHandler(async (req, res) => {
  const { items, pagination } = await reviewService.listMyReviews(req.user.userId, req.query);
  return success(res, "Reviews fetched", items, 200, { pagination });
});

const listByService = asyncHandler(async (req, res) => {
  const result = await reviewService.listByService(req.params.serviceId, req.query);
  return success(res, "Service reviews fetched", result.items, 200, {
    pagination: result.pagination,
    summary: result.summary,
  });
});

const listAdmin = asyncHandler(async (req, res) => {
  const { items, pagination } = await reviewService.listAdminReviews(req.query);
  return success(res, "Reviews fetched", items, 200, { pagination });
});

const listStaff = asyncHandler(async (req, res) => {
  const { items, pagination } = await reviewService.listStaffReviews(req.user.userId, req.query);
  return success(res, "Reviews fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await reviewService.getReviewById(req.params.id, req.user);
  return success(res, "Review fetched", data);
});

const changeStatus = asyncHandler(async (req, res) => {
  const data = await reviewService.changeReviewStatus(req.params.id, req.body.status);
  return success(res, "Review status updated", data);
});

module.exports = {
  create,
  update,
  listMine,
  listByService,
  listAdmin,
  listStaff,
  getById,
  changeStatus,
};