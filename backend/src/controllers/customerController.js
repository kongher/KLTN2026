const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const customerService = require("../services/customerService");

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await customerService.listCustomers(req.query);
  return success(res, "Customers fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await customerService.getCustomerById(req.params.id);
  return success(res, "Customer fetched", data);
});

module.exports = {
  list,
  getById,
};