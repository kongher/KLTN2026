const express = require("express");
const scheduleController = require("../controllers/scheduleController");
const scheduleValidator = require("../validators/scheduleValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRole("ADMIN", "STAFF"),
  scheduleValidator.listQuery,
  scheduleController.list
);

router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  scheduleValidator.create,
  scheduleController.create
);

router.get(
  "/:id",
  authenticate,
  authorizeRole("ADMIN", "STAFF"),
  scheduleValidator.idParam,
  scheduleController.getById
);

router.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  scheduleValidator.update,
  scheduleController.update
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRole("ADMIN"),
  scheduleValidator.status,
  scheduleController.changeStatus
);

router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  scheduleValidator.idParam,
  scheduleController.remove
);

module.exports = router;
