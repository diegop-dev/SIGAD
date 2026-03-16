const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { validateMateria } = require("../middlewares/materiaValidator");
const materiaController = require("../controllers/materiaController");

// ruta exclusiva para la API de sincronización externa (HU-37 / API-03)
// el sistema externo deberá consumir: GET /api/materias/sincronizacion?carrera_id=X&cuatrimestre_id=Y
router.get("/sincronizacion", verifyToken, materiaController.getMateriasParaSincronizacion);

// rutas originales para el consumo interno del frontend de SIGAD
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

router.patch(
  "/:id/toggle",
  verifyToken,
  requireRole([1]),
  materiaController.toggleMateria
);

module.exports = router;