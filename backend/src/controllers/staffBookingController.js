const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const bookingService = require("../services/bookingService");

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await bookingService.listStaffBookings(
    req.query,
    req.user.userId
  );
  return success(res, "Staff bookings fetched", items, 200, { pagination });
});

const pendingCount = asyncHandler(async (req, res) => {
  const count = await bookingService.countPendingStaffBookings(req.user.userId);
  return success(res, "Pending bookings count", { count });
});

const getById = asyncHandler(async (req, res) => {
  const data = await bookingService.getStaffBookingById(req.params.id, req.user.userId);
  return success(res, "Staff booking fetched", data);
});

const confirm = asyncHandler(async (req, res) => {
  const data = await bookingService.transitionStaffBooking(
    req.params.id,
    req.user.userId,
    "confirm"
  );
  return success(res, "Booking confirmed", data);
});

const reject = asyncHandler(async (req, res) => {
  const data = await bookingService.transitionStaffBooking(
    req.params.id,
    req.user.userId,
    "reject"
  );
  return success(res, "Booking rejected", data);
});

const cancel = asyncHandler(async (req, res) => {
  const data = await bookingService.transitionStaffBooking(
    req.params.id,
    req.user.userId,
    "cancel"
  );
  return success(res, "Booking cancelled", data);
});

const complete = asyncHandler(async (req, res) => {
  const data = await bookingService.transitionStaffBooking(
    req.params.id,
    req.user.userId,
    "complete"
  );
  return success(res, "Booking completed", data);
});

module.exports = {
  list,
  pendingCount,
  getById,
  confirm,
  reject,
  cancel,
  complete,
};
