const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { validateMateria } = require("../middlewares/materiaValidator");
const materiaController = require("../controllers/materiaController");

router.get("/", verifyToken, materiaController.getMaterias);

router.post(
  "/",
  verifyToken,
  requireRole([1, 2]),
  validateMateria,
  materiaController.createMateria
);

router.put(
  "/:id",
  verifyToken,
  requireRole([1, 2]),
  validateMateria,
  materiaController.updateMateria
);

router.delete(
  "/:id",
  verifyToken,
  requireRole([1]),
  materiaController.deleteMateria
);

module.exports = router;