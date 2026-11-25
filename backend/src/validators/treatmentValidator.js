const validate = require("../middlewares/validate");
const { isUuid, optionalString } = require("./common");

const create = validate((req) => {
  const errors = [];
  const { bookingId, note, beforeImage, afterImage } = req.body || {};

  if (!isUuid(bookingId)) errors.push("Invalid bookingId");
  if (!optionalString(note, 5000)) errors.push("Note is too long");
  if (!optionalString(beforeImage, 500)) errors.push("beforeImage URL is too long");
  if (!optionalString(afterImage, 500)) errors.push("afterImage URL is too long");

  return errors;
});

const update = validate((req) => {
  const errors = [];
  if (!isUuid(req.params.id)) errors.push("Invalid treatment id");

  const { note, beforeImage, afterImage } = req.body || {};
  if (!optionalString(note, 5000)) errors.push("Note is too long");
  if (!optionalString(beforeImage, 500)) errors.push("beforeImage URL is too long");
  if (!optionalString(afterImage, 500)) errors.push("afterImage URL is too long");

  if (note === undefined && beforeImage === undefined && afterImage === undefined) {
    errors.push("At least one field is required");
  }

  return errors;
});

const idParam = validate((req) => {
  if (!isUuid(req.params.id)) return ["Invalid treatment id"];
  return [];
});

const customerIdParam = validate((req) => {
  if (!isUuid(req.params.customerId)) return ["Invalid customer id"];
  return [];
});

module.exports = {
  create,
  update,
  idParam,
  customerIdParam,
};
