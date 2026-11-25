const validate = require("../middlewares/validate");
const { isNonEmptyString, isEmail, isPhone, isPassword } = require("./common");

const register = validate((req) => {
  const errors = [];
  const { name, email, phone, password } = req.body || {};

  if (!isNonEmptyString(name) || name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters");
  }

  if (!isEmail(email)) {
    errors.push("A valid email is required");
  }

  if (!isPhone(phone)) {
    errors.push("A valid Vietnamese phone number is required");
  }

  if (!isPassword(password)) {
    errors.push(
      "Password must be 8-72 characters and include at least one letter and one number"
    );
  }

  return errors;
});

const login = validate((req) => {
  const errors = [];
  const { email, phone, identifier, password } = req.body || {};
  const loginId = identifier || email || phone;

  if (!isNonEmptyString(loginId)) {
    errors.push("Email or phone is required");
  }

  if (!isNonEmptyString(password)) {
    errors.push("Password is required");
  }

  return errors;
});

const forgotPassword = validate((req) => {
  const errors = [];
  if (!isEmail(req.body?.email)) {
    errors.push("A valid email is required");
  }
  return errors;
});

const resetPassword = validate((req) => {
  const errors = [];
  const { token, newPassword } = req.body || {};

  if (!isNonEmptyString(token)) {
    errors.push("Reset token is required");
  }

  if (!isPassword(newPassword)) {
    errors.push(
      "Password must be 8-72 characters and include at least one letter and one number"
    );
  }

  return errors;
});

const changePassword = validate((req) => {
  const errors = [];
  const { currentPassword, newPassword } = req.body || {};

  if (!isNonEmptyString(currentPassword)) {
    errors.push("Current password is required");
  }

  if (!isPassword(newPassword)) {
    errors.push(
      "Password must be 8-72 characters and include at least one letter and one number"
    );
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push("New password must be different from current password");
  }

  return errors;
});

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
};
