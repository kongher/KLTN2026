const validate = require("../middlewares/validate");
const { isUuid } = require("./common");

const ACCOUNT_STATUSES = new Set(["ACTIVE", "INACTIVE", "LOCKED", "BANNED"]);

const listQuery = validate((req) => {
  const errors = [];
  const { accountStatus, sortBy, order } = req.query || {};

  if (accountStatus !== undefined && accountStatus !== "" && accountStatus !== "ALL") {
    if (!ACCOUNT_STATUSES.has(accountStatus)) {
      errors.push("Invalid accountStatus");
    }
  }

  if (sortBy !== undefined && sortBy !== "" && sortBy !== "createdAt" && sortBy !== "name") {
    errors.push("sortBy must be createdAt or name");
  }

  if (order !== undefined && order !== "" && order !== "asc" && order !== "desc") {
    errors.push("order must be asc or desc");
  }

  return errors;
});

const idParam = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) {
    errors.push("Invalid customer id");
  }
  return errors;
});

module.exports = {
  listQuery,
  idParam,
};