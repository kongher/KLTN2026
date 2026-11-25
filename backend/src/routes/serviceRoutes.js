const express = require("express");
const serviceController = require("../controllers/serviceController");
const serviceValidator = require("../validators/serviceValidator");
const authenticate = require("../middlewares/authenticate");
const optionalAuthenticate = require("../middlewares/optionalAuthenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get("/", optionalAuthenticate, serviceController.list);
router.get("/:id", optionalAuthenticate, serviceValidator.idParam, serviceController.getById);
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  serviceValidator.create,
  serviceController.create
);
router.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  serviceValidator.update,
  serviceController.update
);
router.patch(
  "/:id/status",
  authenticate,
  authorizeRole("ADMIN"),
  serviceValidator.status,
  serviceController.changeStatus
);
router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  serviceValidator.idParam,
  serviceController.remove
);

module.exports = router;
