const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const serviceService = require("../services/serviceService");

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await serviceService.listServices(
    req.query,
    req.user?.role
  );
  return success(res, "Services fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await serviceService.getServiceById(req.params.id, req.user?.role);
  return success(res, "Service fetched", data);
});

const create = asyncHandler(async (req, res) => {
  const data = await serviceService.createService(req.body);
  return success(res, "Service created", data, 201);
});

const update = asyncHandler(async (req, res) => {
  const data = await serviceService.updateService(req.params.id, req.body);
  return success(res, "Service updated", data);
});

const changeStatus = asyncHandler(async (req, res) => {
  const data = await serviceService.changeServiceStatus(req.params.id, req.body.status);
  return success(res, "Service status updated", data);
});

const remove = asyncHandler(async (req, res) => {
  await serviceService.deleteService(req.params.id);
  return success(res, "Service deleted");
});

module.exports = {
  list,
  getById,
  create,
  update,
  changeStatus,
  remove,
};
