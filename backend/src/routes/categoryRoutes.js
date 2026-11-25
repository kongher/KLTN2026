const express = require("express");
const categoryController = require("../controllers/categoryController");
const categoryValidator = require("../validators/categoryValidator");
const authenticate = require("../middlewares/authenticate");
const optionalAuthenticate = require("../middlewares/optionalAuthenticate");
const authorizeRole = require("../middlewares/authorizeRole");

const router = express.Router();

router.get("/", optionalAuthenticate, categoryController.list);
router.get("/:id", optionalAuthenticate, categoryValidator.idParam, categoryController.getById);
router.post(
  "/",
  authenticate,
  authorizeRole("ADMIN"),
  categoryValidator.create,
  categoryController.create
);
router.put(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  categoryValidator.update,
  categoryController.update
);
router.delete(
  "/:id",
  authenticate,
  authorizeRole("ADMIN"),
  categoryValidator.idParam,
  categoryController.remove
);

module.exports = router;
