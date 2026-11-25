const validate = require("../middlewares/validate");
const {
  isNonEmptyString,
  optionalString,
  isUuid,
} = require("./common");

const STATUSES = new Set(["ACTIVE", "INACTIVE"]);

const create = validate((req) => {
  const errors = [];
  const { name, description, status } = req.body || {};

  if (!isNonEmptyString(name) || name.trim().length < 2) {
    errors.push("Category name is required");
  }

  if (!optionalString(description, 2000)) {
    errors.push("Description is too long");
  }

  if (status !== undefined && !STATUSES.has(status)) {
    errors.push("Status must be ACTIVE or INACTIVE");
  }

  return errors;
});

const update = validate((req) => {
  const errors = [];
  const { name, description, status } = req.body || {};

  if (!isUuid(req.params.id)) {
    errors.push("Invalid category id");
  }

  if (name !== undefined && (!isNonEmptyString(name) || name.trim().length < 2)) {
    errors.push("Category name must be at least 2 characters");
  }

  if (!optionalString(description, 2000)) {
    errors.push("Description is too long");
  }

  if (status !== undefined && !STATUSES.has(status)) {
    errors.push("Status must be ACTIVE or INACTIVE");
  }

  if (name === undefined && description === undefined && status === undefined) {
    errors.push("At least one field is required");
  }

  return errors;
});

const idParam = validate((req) => {
  if (!isUuid(req.params.id)) {
    return ["Invalid category id"];
  }
  return [];
});

module.exports = {
  create,
  update,
  idParam,
};
