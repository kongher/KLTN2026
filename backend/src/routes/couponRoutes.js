const express = require("express");
const couponController = require("../controllers/couponController");
const couponValidator = require("../validators/couponValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.use(authenticate);

router.get(
  "/my-coupons",
  authorizeRole("CUSTOMER"),
  couponController.myCoupons
);
router.get(
  "/available",
  authorizeRole("CUSTOMER"),
  couponValidator.available,
  couponController.available
);
router.post(
  "/apply",
  authorizeRole("CUSTOMER"),
  couponValidator.apply,
  couponController.apply
);

router.get(
  "/customers/search",
  authorizeRole("ADMIN"),
  couponController.searchCustomers
);
router.post("/", authorizeRole("ADMIN"), couponValidator.create, couponController.create);
router.get("/", authorizeRole("ADMIN"), couponController.list);
router.get("/:id", authorizeRole("ADMIN"), couponValidator.idParam, couponController.getById);
router.put("/:id", authorizeRole("ADMIN"), couponValidator.idParam, couponValidator.update, couponController.update);
router.patch(
  "/:id/status",
  authorizeRole("ADMIN"),
  couponValidator.idParam,
  couponValidator.status,
  couponController.patchStatus
);
router.get(
  "/:id/customers",
  authorizeRole("ADMIN"),
  couponValidator.idParam,
  couponController.listCustomers
);
router.post(
  "/:id/retry-emails",
  authorizeRole("ADMIN"),
  couponValidator.idParam,
  couponController.retryEmails
);

module.exports = router;