const validate = require("../middlewares/validate");
const { isNonEmptyString, isUuid } = require("./common");

const create = validate((req) => {
  const errors = [];
  const { title, content, targetType, category, userIds } = req.body || {};

  if (!isNonEmptyString(title) || title.trim().length < 2 || title.trim().length > 200) {
    errors.push("Title must be 2-200 characters");
  }

  if (!isNonEmptyString(content) || content.trim().length < 2 || content.trim().length > 5000) {
    errors.push("Content must be 2-5000 characters");
  }

  if (!["ALL_STAFF", "ALL_CUSTOMER", "SPECIFIC"].includes(targetType)) {
    errors.push("Invalid target type");
  }

  if (
    category !== undefined &&
    category !== "OPERATIONAL" &&
    category !== "PROMOTIONAL"
  ) {
    errors.push("Invalid category");
  }

  if (targetType === "SPECIFIC") {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      errors.push("userIds is required for specific recipients");
    } else if (userIds.some((id) => !isUuid(id))) {
      errors.push("Invalid user id in userIds");
    }
  }

  return errors;
});

const idParam = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) errors.push("Invalid notification id");
  return errors;
});

module.exports = { create, idParam };