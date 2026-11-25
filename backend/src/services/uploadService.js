const multer = require("multer");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");
const AppError = require("../utils/appError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype?.startsWith("image/")) {
      cb(new AppError("Only image files are allowed", 400));
      return;
    }
    cb(null, true);
  },
});

function uploadBufferToCloudinary(buffer, folder = "spa-management") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function uploadImageFile(file, folder = "spa-management") {
  if (!isCloudinaryConfigured()) {
    throw new AppError("Cloudinary is not configured", 500);
  }

  if (!file) {
    throw new AppError("Image file is required", 400);
  }

  const safeFolder =
    String(folder || "spa-management")
      .replace(/[^a-zA-Z0-9/_-]/g, "")
      .replace(/\/+/g, "/")
      .replace(/^\/|\/$/g, "")
      .slice(0, 120) || "spa-management";

  try {
    const result = await uploadBufferToCloudinary(file.buffer, safeFolder);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    throw new AppError(error.message || "Failed to upload image", 500);
  }
}

module.exports = {
  upload,
  uploadImageFile,
};
