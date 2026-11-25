const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const treatmentService = require("../services/treatmentService");

const create = asyncHandler(async (req, res) => {
  const data = await treatmentService.createTreatment(req.user.userId, req.body);
  return success(res, "Treatment record created", data, 201);
});

const getById = asyncHandler(async (req, res) => {
  const data = await treatmentService.getTreatmentById(req.params.id, {
    role: req.user.role,
    userId: req.user.userId,
  });
  return success(res, "Treatment record fetched", data);
});

const update = asyncHandler(async (req, res) => {
  const data = await treatmentService.updateTreatment(req.params.id, req.user.userId, req.body);
  return success(res, "Treatment record updated", data);
});

const listMine = asyncHandler(async (req, res) => {
  const { items, pagination } = await treatmentService.listTreatmentsForActor(req.query, {
    role: req.user.role,
    userId: req.user.userId,
  });
  return success(res, "Treatment records fetched", items, 200, { pagination });
});

const listByCustomer = asyncHandler(async (req, res) => {
  const { items, pagination } = await treatmentService.listTreatmentsByCustomer(
    req.params.customerId,
    {
      role: req.user.role,
      userId: req.user.userId,
    }
  );
  return success(res, "Customer treatment records fetched", items, 200, { pagination });
});

const listCompletedBookings = asyncHandler(async (req, res) => {
  const data = await treatmentService.listCompletedBookingsWithoutTreatment(req.user.userId);
  return success(res, "Completed bookings without treatment fetched", data);
});

module.exports = {
  create,
  getById,
  update,
  listMine,
  listByCustomer,
  listCompletedBookings,
};
