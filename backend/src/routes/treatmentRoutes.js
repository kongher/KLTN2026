const express = require("express");
const treatmentController = require("../controllers/treatmentController");
const treatmentValidator = require("../validators/treatmentValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  authorizeRole("STAFF"),
  treatmentValidator.create,
  treatmentController.create
);

router.get(
  "/completed-bookings",
  authorizeRole("STAFF"),
  treatmentController.listCompletedBookings
);

router.get(
  "/customer/:customerId",
  authorizeRole("ADMIN", "STAFF", "CUSTOMER"),
  treatmentValidator.customerIdParam,
  treatmentController.listByCustomer
);

router.get(
  "/:id",
  authorizeRole("ADMIN", "STAFF", "CUSTOMER"),
  treatmentValidator.idParam,
  treatmentController.getById
);

router.put(
  "/:id",
  authorizeRole("STAFF"),
  treatmentValidator.update,
  treatmentController.update
);

module.exports = router;
