const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");
const { uploadImageFile } = require("../services/uploadService");

const uploadImage = asyncHandler(async (req, res) => {
  const folder = typeof req.body?.folder === "string" && req.body.folder.trim()
    ? req.body.folder.trim()
    : "spa-management";

  const data = await uploadImageFile(req.file, folder);
  return success(res, "Image uploaded", data, 201);
});

module.exports = {
  uploadImage,
};
