const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const userService = require("../services/userService");

const updateProfile = asyncHandler(async (req, res) => {
  const data = await userService.updateProfile(req.user.userId, req.body);
  return success(res, "Profile updated", data);
});

module.exports = {
  updateProfile,
};
