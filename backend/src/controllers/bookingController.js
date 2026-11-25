const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const bookingService = require("../services/bookingService");

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await bookingService.listBookings(req.query, {
    role: req.user.role,
    userId: req.user.userId,
  });
  return success(res, "Bookings fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await bookingService.getBookingById(req.params.id, {
    role: req.user.role,
    userId: req.user.userId,
  });
  return success(res, "Booking fetched", data);
});

const create = asyncHandler(async (req, res) => {
  const data = await bookingService.createBooking(req.user.userId, req.body);
  return success(res, "Booking created", data, 201);
});

const cancel = asyncHandler(async (req, res) => {
  const data = await bookingService.cancelBooking(req.params.id, req.user.userId);
  return success(res, "Booking cancelled", data);
});

const availableStaff = asyncHandler(async (req, res) => {
  const data = await bookingService.getAvailableStaff(req.query);
  return success(res, "Available staff fetched", data);
});

const availableSlots = asyncHandler(async (req, res) => {
  const data = await bookingService.getAvailableSlots(req.query);
  return success(res, "Available slots fetched", data);
});

module.exports = {
  list,
  getById,
  create,
  cancel,
  availableStaff,
  availableSlots,
};
