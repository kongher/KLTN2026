const validate = require("../middlewares/validate");
const { isUuid } = require("./common");

const SCHEDULE_STATUSES = new Set(["AVAILABLE", "UNAVAILABLE", "OFF"]);
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

function toMinutes(value) {
  const [hours, minutes] = value.trim().split(":").map(Number);
  return hours * 60 + minutes;
}

function validateScheduleBody(body, { partial = false } = {}) {
  const errors = [];
  const { staffId, date, startTime, endTime, status } = body || {};

  if (!partial || staffId !== undefined) {
    if (!isUuid(staffId)) {
      errors.push("Invalid staffId");
    }
  }

  if (!partial || date !== undefined) {
    if (!isValidDate(date)) {
      errors.push("date must be YYYY-MM-DD");
    }
  }

  if (!partial || startTime !== undefined) {
    if (!isValidTime(startTime)) {
      errors.push("startTime must be HH:mm or HH:mm:ss");
    }
  }

  if (!partial || endTime !== undefined) {
    if (!isValidTime(endTime)) {
      errors.push("endTime must be HH:mm or HH:mm:ss");
    }
  }

  if (
    isValidTime(startTime) &&
    isValidTime(endTime) &&
    toMinutes(startTime) >= toMinutes(endTime)
  ) {
    errors.push("startTime must be before endTime");
  }

  if (status !== undefined && !SCHEDULE_STATUSES.has(status)) {
    errors.push("Status must be AVAILABLE, UNAVAILABLE, or OFF");
  }

  return errors;
}

const create = validate((req) => validateScheduleBody(req.body, { partial: false }));

const update = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid schedule id");
  }

  errors.push(...validateScheduleBody(req.body, { partial: true }));

  const { staffId, date, startTime, endTime, status } = req.body || {};
  if (
    staffId === undefined &&
    date === undefined &&
    startTime === undefined &&
    endTime === undefined &&
    status === undefined
  ) {
    errors.push("At least one field is required");
  }

  return errors;
});

const idParam = validate((req) => {
  if (!isUuid(req.params.id)) {
    return ["Invalid schedule id"];
  }
  return [];
});

const staffIdParam = validate((req) => {
  if (!isUuid(req.params.id)) {
    return ["Invalid staff id"];
  }
  return [];
});

const status = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid schedule id");
  }
  if (!SCHEDULE_STATUSES.has(req.body?.status)) {
    errors.push("Status must be AVAILABLE, UNAVAILABLE, or OFF");
  }
  return errors;
});

const listQuery = validate((req) => {
  const errors = [];
  const { staffId, date, from, to, status: statusQuery } = req.query || {};

  if (staffId !== undefined && !isUuid(staffId)) {
    errors.push("Invalid staffId");
  }
  if (date !== undefined && !isValidDate(date)) {
    errors.push("date must be YYYY-MM-DD");
  }
  if (from !== undefined && !isValidDate(from)) {
    errors.push("from must be YYYY-MM-DD");
  }
  if (to !== undefined && !isValidDate(to)) {
    errors.push("to must be YYYY-MM-DD");
  }
  if (
    statusQuery !== undefined &&
    statusQuery !== "ALL" &&
    !SCHEDULE_STATUSES.has(statusQuery)
  ) {
    errors.push("Invalid status filter");
  }

  return errors;
});

module.exports = {
  create,
  update,
  idParam,
  staffIdParam,
  status,
  listQuery,
  isValidTime,
  isValidDate,
  toMinutes,
  SCHEDULE_STATUSES,
};
