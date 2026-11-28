const express = require("express");
const reviewController = require("../controllers/reviewController");
const reviewValidator = require("../validators/reviewValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");
const optionalAuthenticate = require("../middlewares/optionalAuthenticate");

const router = express.Router();

router.get(
  "/service/:serviceId",
  optionalAuthenticate,
  reviewValidator.serviceIdParam,
  reviewController.listByService
);

router.get(
  "/my-reviews",
  authenticate,
  authorizeRole("CUSTOMER"),
  reviewController.listMine
);

router.get("/", authenticate, authorizeRole("ADMIN"), reviewController.listAdmin);

router.get(
  "/staff-assigned",
  authenticate,
  authorizeRole("STAFF"),
  reviewController.listStaff
);

router.post(
  "/",
  authenticate,
  authorizeRole("CUSTOMER"),
  reviewValidator.create,
  reviewController.create
);

router.get(
  "/:id",
  authenticate,
  reviewValidator.idParam,
  reviewController.getById
);

router.put(
  "/:id",
  authenticate,
  authorizeRole("CUSTOMER"),
  reviewValidator.idParam,
  reviewValidator.update,
  reviewController.update
);

router.patch(
  "/:id/status",
  authenticate,
  authorizeRole("ADMIN"),
  reviewValidator.idParam,
  reviewValidator.status,
  reviewController.changeStatus
);

module.exports = router;