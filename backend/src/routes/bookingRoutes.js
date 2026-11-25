const express = require("express");
const bookingController = require("../controllers/bookingController");
const bookingValidator = require("../validators/bookingValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.use(authenticate);

router.get(
  "/available-staff",
  authorizeRole("CUSTOMER"),
  bookingValidator.availableStaffQuery,
  bookingController.availableStaff
);

router.get(
  "/available-slots",
  authorizeRole("CUSTOMER"),
  bookingValidator.availableSlotsQuery,
  bookingController.availableSlots
);

router.get(
  "/",
  authorizeRole("CUSTOMER"),
  bookingValidator.listQuery,
  bookingController.list
);

router.post(
  "/",
  authorizeRole("CUSTOMER"),
  bookingValidator.create,
  bookingController.create
);

router.get(
  "/:id",
  authorizeRole("CUSTOMER"),
  bookingValidator.idParam,
  bookingController.getById
);

router.patch(
  "/:id/cancel",
  authorizeRole("CUSTOMER"),
  bookingValidator.idParam,
  bookingController.cancel
);

module.exports = router;
