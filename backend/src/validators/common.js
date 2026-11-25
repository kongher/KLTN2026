function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isPhone(value) {
  const normalized = String(value).replace(/[\s.-]/g, "");
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(normalized);
}

function isPassword(value) {
  if (typeof value !== "string") return false;
  if (value.length < 8 || value.length > 72) return false;
  return /[A-Za-z]/.test(value) && /\d/.test(value);
}

function optionalString(value, max) {
  if (value === undefined || value === null || value === "") return true;
  return typeof value === "string" && value.length <= max;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function isNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function isPositiveInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0;
}

module.exports = {
  isNonEmptyString,
  isEmail,
  isPhone,
  isPassword,
  optionalString,
  isUuid,
  isNonNegativeNumber,
  isPositiveInteger,
};
