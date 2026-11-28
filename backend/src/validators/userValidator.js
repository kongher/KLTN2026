const validate = require("../middlewares/validate");
const { isNonEmptyString, isPhone, optionalString } = require("./common");

const updateProfile = validate((req) => {
  const errors = [];
  const { name, phone, avatar, marketingEmailOptIn } = req.body || {};

  if (name !== undefined && (!isNonEmptyString(name) || name.trim().length < 2)) {
    errors.push("Name must be at least 2 characters");
  }

  if (phone !== undefined && !isPhone(phone)) {
    errors.push("A valid Vietnamese phone number is required");
  }

  if (!optionalString(avatar, 500)) {
    errors.push("Avatar URL is too long");
  }

  if (
    marketingEmailOptIn !== undefined &&
    typeof marketingEmailOptIn !== "boolean"
  ) {
    errors.push("marketingEmailOptIn must be a boolean");
  }

  if (
    name === undefined &&
    phone === undefined &&
    avatar === undefined &&
    marketingEmailOptIn === undefined
  ) {
    errors.push("At least one field is required");
  }

  return errors;
});

module.exports = {
  updateProfile,
};
