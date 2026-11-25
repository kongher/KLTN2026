const express = require("express");
const staffController = require("../controllers/staffController");
const scheduleController = require("../controllers/scheduleController");
const staffValidator = require("../validators/staffValidator");
const scheduleValidator = require("../validators/scheduleValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get("/profile", authenticate, authorizeRole("STAFF"), staffController.getProfile);
router.put(
  "/profile",
  authenticate,
  authorizeRole("STAFF"),
  staffValidator.updateProfile,
  staffController.updateProfile
);

router.get("/", authenticate, authorizeRole("ADMIN"), staffController.list);
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  staffValidator.create,
  staffController.create
);

router.get(
  "/:id/services",
  authenticate,
  authorizeRole("ADMIN"),
  staffValidator.idParam,
  staffController.getServices
);
router.put(
  "/:id/services",
  authenticate,
  authorizeRole("ADMIN"),
  staffValidator.assignServices,
  staffController.assignServices
);

router.get(
  "/:id/schedules",
  authenticate,
  authorizeRole("ADMIN", "STAFF"),
  scheduleValidator.staffIdParam,
  scheduleValidator.listQuery,
  scheduleController.listByStaff
);

router.get(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  staffValidator.idParam,
  staffController.getById
);
router.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  staffValidator.update,
  staffController.update
);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRole("ADMIN"),
  staffValidator.status,
  staffController.changeStatus
);
router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  staffValidator.idParam,
  staffController.remove
);

module.exports = router;
