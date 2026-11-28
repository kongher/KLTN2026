const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const couponService = require("../services/couponService");

const create = asyncHandler(async (req, res) => {
  const data = await couponService.createCouponAndAssign(req.body);
  return success(res, "Coupon created and assigned", data, 201);
});

const list = asyncHandler(async (req, res) => {
  const { items, pagination } = await couponService.listCoupons(req.query);
  return success(res, "Coupons fetched", items, 200, { pagination });
});

const getById = asyncHandler(async (req, res) => {
  const data = await couponService.getCouponById(req.params.id);
  return success(res, "Coupon fetched", data);
});

const update = asyncHandler(async (req, res) => {
  const data = await couponService.updateCoupon(req.params.id, req.body);
  return success(res, "Coupon updated", data);
});

const patchStatus = asyncHandler(async (req, res) => {
  const data = await couponService.patchCouponStatus(req.params.id, req.body.status);
  return success(res, "Coupon status updated", data);
});

const listCustomers = asyncHandler(async (req, res) => {
  const { items, pagination } = await couponService.listCouponCustomers(req.params.id, req.query);
  return success(res, "Coupon recipients fetched", items, 200, { pagination });
});

const retryEmails = asyncHandler(async (req, res) => {
  const data = await couponService.retryFailedEmails(req.params.id);
  return success(res, "Email retry completed", data);
});

const searchCustomers = asyncHandler(async (req, res) => {
  const data = await couponService.searchCustomers(req.query);
  return success(res, "Customers fetched", data);
});

const myCoupons = asyncHandler(async (req, res) => {
  const data = await couponService.listMyCoupons(req.user.userId);
  return success(res, "My coupons fetched", data);
});

const available = asyncHandler(async (req, res) => {
  const data = await couponService.getAvailableCouponsForBooking(
    req.user.userId,
    req.query.serviceId
  );
  return success(res, "Available coupons fetched", data);
});

const apply = asyncHandler(async (req, res) => {
  const data = await couponService.applyCoupon(req.user.userId, req.body);
  return success(res, "Coupon applied", data);
});

module.exports = {
  create,
  list,
  getById,
  update,
  patchStatus,
  listCustomers,
  retryEmails,
  searchCustomers,
  myCoupons,
  available,
  apply,
};