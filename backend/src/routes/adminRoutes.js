const express = require("express");
const adminController = require("../controllers/adminController");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get(
  "/access-check",
  authenticate,
  authorizeRole("ADMIN"),
  adminController.accessCheck
);

module.exports = router;
