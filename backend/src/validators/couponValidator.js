const validate = require("../middlewares/validate");
const { isNonEmptyString, isUuid } = require("./common");

function validateCreate(req) {
  const errors = [];
  const body = req.body || {};
  if (!isNonEmptyString(body.name)) errors.push("Program name is required");
  if (!isNonEmptyString(body.code)) errors.push("Coupon code is required");
  if (!["PERCENTAGE", "FIXED"].includes(body.type)) errors.push("Invalid type");
  if (body.value === undefined || Number(body.value) <= 0) errors.push("Invalid value");
  const usageLimit = Number(body.usageLimit);
  if (
    body.usageLimit === undefined ||
    body.usageLimit === null ||
    body.usageLimit === "" ||
    !Number.isFinite(usageLimit) ||
    !Number.isInteger(usageLimit) ||
    usageLimit < 1
  ) {
    errors.push("Usage limit must be a positive integer");
  }
  if (!body.startDate || !body.endDate) errors.push("Start and end dates are required");

  const hasUsers = Array.isArray(body.customerUserIds) && body.customerUserIds.length > 0;
  const assignAll = body.assignAllCustomers === true;
  if (!hasUsers && !assignAll) {
    errors.push("Select customers or assign to all customers");
  }

  if (hasUsers) {
    for (const id of body.customerUserIds) {
      if (!isUuid(id)) errors.push("Invalid customer user id");
    }
  }

  return errors;
}

function validateUpdate(req) {
  const errors = [];
  const body = req.body || {};
  if (body.name !== undefined && !isNonEmptyString(body.name)) errors.push("Invalid name");
  if (body.type !== undefined && !["PERCENTAGE", "FIXED"].includes(body.type)) {
    errors.push("Invalid type");
  }
  if (body.value !== undefined && Number(body.value) <= 0) errors.push("Invalid value");
  return errors;
}

function validateStatus(req) {
  const errors = [];
  if (!["ACTIVE", "INACTIVE"].includes(req.body?.status)) {
    errors.push("Invalid status");
  }
  return errors;
}

function validateApply(req) {
  const errors = [];
  if (!isUuid(req.body?.customerCouponId)) errors.push("Invalid customerCouponId");
  if (!isUuid(req.body?.serviceId)) errors.push("Invalid serviceId");
  return errors;
}

function validateAvailable(req) {
  const errors = [];
  if (!isUuid(req.query?.serviceId)) errors.push("Invalid serviceId");
  return errors;
}

const create = validate(validateCreate);
const update = validate(validateUpdate);
const status = validate(validateStatus);
const apply = validate(validateApply);
const available = validate(validateAvailable);
const idParam = validate((req) => {
  const errors = [];
  if (!isUuid(req.params?.id)) errors.push("Invalid id");
  return errors;
});

module.exports = {
  create,
  update,
  status,
  apply,
  available,
  idParam,
};