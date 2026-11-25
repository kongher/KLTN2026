const express = require("express");
const authController = require("../controllers/authController");
const authValidator = require("../validators/authValidator");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.post("/register", authValidator.register, authController.register);
router.post("/login", authValidator.login, authController.login);
router.post(
  "/forgot-password",
  authValidator.forgotPassword,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authValidator.resetPassword,
  authController.resetPassword
);
router.post(
  "/change-password",
  authenticate,
  authValidator.changePassword,
  authController.changePassword
);
router.get("/me", authenticate, authController.me);
router.post("/logout", authenticate, authController.logout);

module.exports = router;
