const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const bookingService = require("../services/bookingService");

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await bookingService.listAdminBookings(req.query);
  return success(res, "Admin bookings fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await bookingService.getAdminBookingById(req.params.id);
  return success(res, "Admin booking fetched", data);
});

const pendingCount = asyncHandler(async (req, res) => {
  const count = await bookingService.countPendingAdminBookings();
  return success(res, "Pending bookings count", { count });
});

module.exports = {
  list,
  getById,
  pendingCount,
};
