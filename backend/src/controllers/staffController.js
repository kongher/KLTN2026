const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const staffService = require("../services/staffService");

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await staffService.listStaff(req.query);
  return success(res, "Staff fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await staffService.getStaffById(req.params.id);
  return success(res, "Staff fetched", data);
});

const create = asyncHandler(async (req, res) => {
  const data = await staffService.createStaff(req.body);
  return success(res, "Staff created", data, 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await staffService.updateStaff(req.params.id, req.body, {
    actorUserId: req.user.userId,
  });
  return success(res, "Staff updated", data);
});

const changeStatus = asyncHandler(async (req, res) => {
  const data = await staffService.changeStaffStatus(req.params.id, req.body, {
    actorUserId: req.user.userId,
  });
  return success(res, "Staff status updated", data);
});

const remove = asyncHandler(async (req, res) => {
  await staffService.deleteStaff(req.params.id, { actorUserId: req.user.userId });
  return success(res, "Staff deleted");
});

const getServices = asyncHandler(async (req, res) => {
  const data = await staffService.getStaffServices(req.params.id);
  return success(res, "Staff services fetched", data);
});

const assignServices = asyncHandler(async (req, res) => {
  const data = await staffService.assignStaffServices(req.params.id, req.body.serviceIds);
  return success(res, "Staff services updated", data);
});

const getProfile = asyncHandler(async (req, res) => {
  const data = await staffService.getMyProfile(req.user.userId);
  return success(res, "Staff profile fetched", data);
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await staffService.updateMyProfile(req.user.userId, req.body);
  return success(res, "Staff profile updated", data);
});

module.exports = {
  list,
  getById,
  create,
  update,
  changeStatus,
  remove,
  getServices,
  assignServices,
  getProfile,
  updateProfile,
};
