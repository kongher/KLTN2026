const express = require("express");
const homeContentController = require("../controllers/homeContentController");
const homeSettingsValidator = require("../validators/homeSettingsValidator");
const optionalAuthenticate = require("../middlewares/optionalAuthenticate");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get("/", optionalAuthenticate, homeContentController.getHomeContent);
router.put(
  "/settings",
  authenticate,
  authorizeRole("ADMIN"),
  homeSettingsValidator.update,
  homeContentController.updateSettings
);

module.exports = router;
