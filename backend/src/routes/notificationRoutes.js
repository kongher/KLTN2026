const express = require("express");
const notificationController = require("../controllers/notificationController");
const notificationValidator = require("../validators/notificationValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.use(authenticate);
router.use(authorizeRole("ADMIN"));

router.get("/recipients/search", notificationController.searchRecipients);

router.post("/", notificationValidator.create, notificationController.create);
router.get("/", notificationController.list);
router.get("/:id", notificationValidator.idParam, notificationController.getById);
router.get(
  "/:id/recipients",
  notificationValidator.idParam,
  notificationController.listRecipients
);
router.post("/:id/retry", notificationValidator.idParam, notificationController.retry);

module.exports = router;