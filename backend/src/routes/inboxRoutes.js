const express = require("express");
const inboxController = require("../controllers/inboxController");
const inboxValidator = require("../validators/inboxValidator");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

router.use(authenticate);

router.get("/unread-count", inboxController.unreadCount);
router.get("/", inboxController.list);
router.patch("/read-all", inboxController.readAll);
router.get("/:id", inboxValidator.idParam, inboxController.getById);
router.patch("/:id/read", inboxValidator.idParam, inboxController.read);

module.exports = router;