const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

const accessCheck = asyncHandler(async (req, res) => {
  return success(res, "Admin access granted", {
    userId: req.user.userId,
    role: req.user.role,
  });
});

module.exports = {
  accessCheck,
};
