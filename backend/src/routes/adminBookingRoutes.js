const express = require("express");
const adminBookingController = require("../controllers/adminBookingController");
const bookingValidator = require("../validators/bookingValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.use(authenticate, authorizeRole("ADMIN"));

router.get("/pending-count", adminBookingController.pendingCount);
router.get("/", bookingValidator.listQuery, adminBookingController.list);
router.get("/:id", bookingValidator.idParam, adminBookingController.getById);

module.exports = router;
