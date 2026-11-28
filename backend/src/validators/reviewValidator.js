const validate = require("../middlewares/validate");
const { isNonEmptyString, isUuid } = require("./common");

const create = validate((req) => {
  const errors = [];
  const { bookingId, rating, comment } = req.body || {};

  if (!isUuid(bookingId)) {
    errors.push("Invalid bookingId");
  }

  const value = Number(rating);
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    errors.push("Rating must be between 1 and 5");
  }

  if (comment !== undefined && comment !== null && comment !== "") {
    if (typeof comment !== "string" || comment.trim().length > 1000) {
      errors.push("Comment must be at most 1000 characters");
    }
  }

  return errors;
});

const update = validate((req) => {
  const errors = [];
  const body = req.body || {};
  const { rating, comment } = body;

  const forbiddenKeys = ["bookingId", "customerId", "serviceId", "staffId", "status", "id"];
  for (const key of forbiddenKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      errors.push(`${key} cannot be changed`);
    }
  }

  if (rating !== undefined) {
    const value = Number(rating);
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      errors.push("Rating must be between 1 and 5");
    }
  }

  if (comment !== undefined && comment !== null && comment !== "") {
    if (typeof comment !== "string" || comment.trim().length > 1000) {
      errors.push("Comment must be at most 1000 characters");
    }
  }

  if (rating === undefined && comment === undefined) {
    errors.push("At least one field is required");
  }

  return errors;
});

const idParam = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) errors.push("Invalid review id");
  return errors;
});

const serviceIdParam = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.serviceId)) errors.push("Invalid service id");
  return errors;
});

const status = validate((req) => {
  const errors = [];
  const value = req.body?.status;
  if (value !== "VISIBLE" && value !== "HIDDEN") {
    errors.push("Status must be VISIBLE or HIDDEN");
  }
  return errors;
});

module.exports = {
  create,
  update,
  idParam,
  serviceIdParam,
  status,
};