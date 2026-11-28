const validate = require("../middlewares/validate");
const { isUuid, optionalString } = require("./common");

const BOOKING_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
  "REJECTED",
]);
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidTime(value) {
  return typeof value === "string" && TIME_PATTERN.test(value.trim());
}

function isValidDate(value) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value.trim())) return false;
  const date = new Date(`${value.trim()}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime());
}

const create = validate((req) => {
  const errors = [];
  const { serviceId, staffId, bookingDate, startTime, note, voucherId, customerCouponId } =
    req.body || {};

  if (!isUuid(serviceId)) errors.push("Invalid serviceId");
  if (!isUuid(staffId)) errors.push("Invalid staffId");
  if (!isValidDate(bookingDate)) errors.push("bookingDate must be YYYY-MM-DD");
  if (!isValidTime(startTime)) errors.push("startTime must be HH:mm or HH:mm:ss");
  if (!optionalString(note, 2000)) errors.push("Note is too long");
  if (voucherId !== undefined && voucherId !== null && voucherId !== "" && !isUuid(voucherId)) {
    errors.push("Invalid voucherId");
  }
  if (
    customerCouponId !== undefined &&
    customerCouponId !== null &&
    customerCouponId !== "" &&
    !isUuid(customerCouponId)
  ) {
    errors.push("Invalid customerCouponId");
  }

  return errors;
});

const idParam = validate((req) => {
  if (!isUuid(req.params.id)) return ["Invalid booking id"];
  return [];
});

const listQuery = validate((req) => {
  const errors = [];
  const { status, from, to, search } = req.query || {};

  if (status !== undefined && status !== "ALL" && !BOOKING_STATUSES.has(status)) {
    errors.push("Invalid status filter");
  }
  if (from !== undefined && !isValidDate(from)) errors.push("from must be YYYY-MM-DD");
  if (to !== undefined && !isValidDate(to)) errors.push("to must be YYYY-MM-DD");
  if (search !== undefined && typeof search !== "string") {
    errors.push("search must be a string");
  }

  return errors;
});

const availableStaffQuery = validate((req) => {
  const errors = [];
  const { serviceId, bookingDate } = req.query || {};

  if (!isUuid(serviceId)) errors.push("Invalid serviceId");
  if (bookingDate !== undefined && bookingDate !== "" && !isValidDate(bookingDate)) {
    errors.push("bookingDate must be YYYY-MM-DD");
  }

  return errors;
});

const availableSlotsQuery = validate((req) => {
  const errors = [];
  const { serviceId, staffId, bookingDate } = req.query || {};

  if (!isUuid(serviceId)) errors.push("Invalid serviceId");
  if (!isUuid(staffId)) errors.push("Invalid staffId");
  if (!isValidDate(bookingDate)) errors.push("bookingDate must be YYYY-MM-DD");

  return errors;
});

module.exports = {
  create,
  idParam,
  listQuery,
  availableStaffQuery,
  availableSlotsQuery,
  BOOKING_STATUSES,
};
