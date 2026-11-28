const validate = require("../middlewares/validate");
const { isUuid } = require("./common");

const idParam = validate((req) => {
  if (!isUuid(req.params.id)) return ["Invalid notification id"];
  return [];
});

module.exports = { idParam };