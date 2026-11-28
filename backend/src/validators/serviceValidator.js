const validate = require("../middlewares/validate");
const {
  isNonEmptyString,
  optionalString,
  isUuid,
  isNonNegativeNumber,
  isPositiveInteger,
} = require("./common");

const STATUSES = new Set(["ACTIVE", "INACTIVE"]);

const CODE_PATTERN = /^[A-Za-z0-9_-]{2,50}$/;

function validateServiceBody(body, { partial = false } = {}) {
  const errors = [];
  const { code, name, description, price, duration, categoryId, image, status } = body || {};

  if (!partial || code !== undefined) {
    if (!partial) {
      if (!isNonEmptyString(code) || !CODE_PATTERN.test(String(code).trim())) {
        errors.push("Service code is required (2-50 chars: letters, numbers, _, -)");
      }
    } else if (code !== undefined) {
      if (!isNonEmptyString(code) || !CODE_PATTERN.test(String(code).trim())) {
        errors.push("Invalid service code");
      }
    }
  }

  if (!partial || name !== undefined) {
    if (!isNonEmptyString(name) || name.trim().length < 2) {
      errors.push("Service name is required");
    }
  }

  if (!optionalString(description, 5000)) {
    errors.push("Description is too long");
  }

  if (!partial || price !== undefined) {
    if (!isNonNegativeNumber(price)) {
      errors.push("Price must be greater than or equal to 0");
    }
  }

  if (!partial || duration !== undefined) {
    if (!isPositiveInteger(Number(duration))) {
      errors.push("Duration must be greater than 0");
    }
  }

  if (!partial || categoryId !== undefined) {
    if (!isUuid(categoryId)) {
      errors.push("Invalid categoryId");
    }
  }

  if (!optionalString(image, 500)) {
    errors.push("Image URL is too long");
  }

  if (status !== undefined && !STATUSES.has(status)) {
    errors.push("Status must be ACTIVE or INACTIVE");
  }

  return errors;
}

const create = validate((req) => validateServiceBody(req.body, { partial: false }));

const update = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid service id");
  }
  errors.push(...validateServiceBody(req.body, { partial: true }));
  const { code, name, description, price, duration, categoryId, image, status } = req.body || {};
  if (
    code === undefined &&
    name === undefined &&
    description === undefined &&
    price === undefined &&
    duration === undefined &&
    categoryId === undefined &&
    image === undefined &&
    status === undefined
  ) {
    errors.push("At least one field is required");
  }
  return errors;
});

const idParam = validate((req) => {
  if (!isUuid(req.params.id)) {
    return ["Invalid service id"];
  }
  return [];
});

const status = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid service id");
  }
  if (!STATUSES.has(req.body?.status)) {
    errors.push("Status must be ACTIVE or INACTIVE");
  }
  return errors;
});

module.exports = {
  create,
  update,
  idParam,
  status,
};
