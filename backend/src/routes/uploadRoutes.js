const express = require("express");
const uploadController = require("../controllers/uploadController");
const { upload } = require("../services/uploadService");
const authenticate = require("../middlewares/authenticate");
const AppError = require("../utils/appError");

const router = express.Router();

function handleMulter(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (!err) {
      if (!req.file) {
        return next(new AppError("Image file is required", 400));
      }
      return next();
    }

    if (err instanceof AppError) return next(err);
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("Image must be 5MB or smaller", 400));
    }
    return next(new AppError(err.message || "Invalid upload", 400));
  });
}

router.post("/image", authenticate, handleMulter, uploadController.uploadImage);

module.exports = router;
