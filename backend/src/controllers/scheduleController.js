const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const scheduleService = require("../services/scheduleService");

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await scheduleService.listSchedules(req.query, {
    role: req.user.role,
    userId: req.user.userId,
  });
  return success(res, "Schedules fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await scheduleService.getScheduleById(req.params.id, {
    role: req.user.role,
    userId: req.user.userId,
  });
  return success(res, "Schedule fetched", data);
});

const listByStaff = asyncHandler(async (req, res) => {
  const { items, pagination } = await scheduleService.listSchedulesByStaff(
    req.params.id,
    req.query,
    {
      role: req.user.role,
      userId: req.user.userId,
    }
  );
  return success(res, "Staff schedules fetched", items, 200, { pagination });
});

const create = asyncHandler(async (req, res) => {
  const data = await scheduleService.createSchedule(req.body);
  return success(res, "Schedule created", data, 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await scheduleService.updateSchedule(req.params.id, req.body);
  return success(res, "Schedule updated", data);
});

const changeStatus = asyncHandler(async (req, res) => {
  const data = await scheduleService.changeScheduleStatus(req.params.id, req.body.status);
  return success(res, "Schedule status updated", data);
});

const remove = asyncHandler(async (req, res) => {
  await scheduleService.deleteSchedule(req.params.id);
  return success(res, "Schedule deleted");
});

module.exports = {
  list,
  getById,
  listByStaff,
  create,
  update,
  changeStatus,
  remove,
};
