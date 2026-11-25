const express = require("express");
const treatmentController = require("../controllers/treatmentController");
const authenticate = require("../middlewares/authenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRole("STAFF"),
  treatmentController.listMine
);

module.exports = router;
