const express = require("express");
const staffBookingController = require("../controllers/staffBookingController");
const bookingValidator = require("../validators/bookingValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.use(authenticate, authorizeRole("STAFF"));

router.get("/pending-count", staffBookingController.pendingCount);
router.get("/", bookingValidator.listQuery, staffBookingController.list);
router.patch("/:id/confirm", bookingValidator.idParam, staffBookingController.confirm);
router.patch("/:id/reject", bookingValidator.idParam, staffBookingController.reject);
router.patch("/:id/cancel", bookingValidator.idParam, staffBookingController.cancel);
router.patch("/:id/complete", bookingValidator.idParam, staffBookingController.complete);
router.get("/:id", bookingValidator.idParam, staffBookingController.getById);

module.exports = router;
