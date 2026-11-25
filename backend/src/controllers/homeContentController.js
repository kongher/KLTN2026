const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const homeContentService = require("../services/homeContentService");

const getHomeContent = asyncHandler(async (_req, res) => {
  const data = await homeContentService.getHomeContent();
  return success(res, "Home content fetched", data);
});

const updateSettings = asyncHandler(async (req, res) => {
  const data = await homeContentService.updateHomeSettings(req.body);
  return success(res, "Home settings updated", data);
});

module.exports = { getHomeContent, updateSettings };
