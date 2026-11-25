const express = require("express");
const userController = require("../controllers/userController");
const userValidator = require("../validators/userValidator");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.put(
  "/profile",
  authenticate,
  userValidator.updateProfile,
  userController.updateProfile
);

module.exports = router;
