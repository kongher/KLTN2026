const validate = require("../middlewares/validate");
const {
  isNonEmptyString,
  isEmail,
  isPhone,
  isPassword,
  optionalString,
  isUuid,
} = require("./common");

const STAFF_STATUSES = new Set(["ACTIVE", "INACTIVE"]);
const ACCOUNT_ROLES = new Set(["STAFF", "ADMIN"]);

function validateStaffFields(body, { partial = false, requirePassword = false } = {}) {
  const errors = [];
  const { name, email, phone, password, specialization, avatar, status, role } = body || {};

  if (!partial || name !== undefined) {
    if (!isNonEmptyString(name) || name.trim().length < 2) {
      errors.push("Name is required and must be at least 2 characters");
    }
  }

  if (!partial || email !== undefined) {
    if (!isEmail(email)) {
      errors.push("A valid email is required");
    }
  }

  if (!partial || phone !== undefined) {
    if (!isPhone(phone)) {
      errors.push("A valid Vietnamese phone number is required");
    }
  }

  if (requirePassword || password !== undefined) {
    if (!isPassword(password)) {
      errors.push(
        "Password must be 8-72 characters and include at least one letter and one number"
      );
    }
  }

  if (!optionalString(specialization, 150)) {
    errors.push("Specialization is too long");
  }

  if (!optionalString(avatar, 500)) {
    errors.push("Avatar URL is too long");
  }

  if (status !== undefined && !STAFF_STATUSES.has(status)) {
    errors.push("Status must be ACTIVE or INACTIVE");
  }

  if (role !== undefined && !ACCOUNT_ROLES.has(role)) {
    errors.push("Role must be STAFF or ADMIN");
  }

  return errors;
}

const create = validate((req) =>
  validateStaffFields(req.body, { partial: false, requirePassword: true })
);

const update = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid staff id");
  }

  errors.push(...validateStaffFields(req.body, { partial: true, requirePassword: false }));

  const { name, email, phone, password, specialization, avatar, status, role } = req.body || {};
  if (
    name === undefined &&
    email === undefined &&
    phone === undefined &&
    password === undefined &&
    specialization === undefined &&
    avatar === undefined &&
    status === undefined &&
    role === undefined
  ) {
    errors.push("At least one field is required");
  }

  return errors;
});

const idParam = validate((req) => {
  if (!isUuid(req.params.id)) {
    return ["Invalid staff id"];
  }
  return [];
});

const status = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid staff id");
  }

  const { status: nextStatus, locked } = req.body || {};
  const hasStatus = nextStatus !== undefined;
  const hasLocked = locked !== undefined;

  if (!hasStatus && !hasLocked) {
    errors.push("Status or locked is required");
  }

  if (hasStatus && !STAFF_STATUSES.has(nextStatus)) {
    errors.push("Status must be ACTIVE or INACTIVE");
  }

  if (hasLocked && typeof locked !== "boolean") {
    errors.push("locked must be a boolean");
  }

  return errors;
});

const assignServices = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid staff id");
  }

  const serviceIds = req.body?.serviceIds;
  if (!Array.isArray(serviceIds)) {
    errors.push("serviceIds must be an array");
    return errors;
  }

  if (serviceIds.some((id) => !isUuid(id))) {
    errors.push("All serviceIds must be valid UUIDs");
  }

  return errors;
});

const updateProfile = validate((req) => {
  const errors = validateStaffFields(req.body, {
    partial: true,
    requirePassword: false,
  });

  if (req.body?.status !== undefined) {
    errors.push("Staff cannot change status");
  }

  if (req.body?.role !== undefined || req.body?.roleId !== undefined) {
    errors.push("Staff cannot change role");
  }

  const { name, email, phone, specialization, avatar } = req.body || {};
  if (
    name === undefined &&
    email === undefined &&
    phone === undefined &&
    specialization === undefined &&
    avatar === undefined
  ) {
    errors.push("At least one field is required");
  }

  return errors;
});

module.exports = {
  create,
  update,
  idParam,
  status,
  assignServices,
  updateProfile,
};
