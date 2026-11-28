const express = require("express");
const customerController = require("../controllers/customerController");
const customerValidator = require("../validators/customerValidator");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  customerValidator.listQuery,
  customerController.list
);

router.get(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  customerValidator.idParam,
  customerController.getById
);

module.exports = router;