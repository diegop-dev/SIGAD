const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { validateMateria } = require("../middlewares/materiaValidator");
const materiaController = require("../controllers/materiaController");

// ─── EP-04 SESA: GET /materias/catalogo ───────────────────────────────────────────────
// Soporta query params opcionales: ?id_programa_academico=X&cuatrimestre_id=Y&tipo_asignatura=Z
router.get("/catalogo", verifyToken, materiaController.ObtenerMaterias);
// ─────────────────────────────────────────────────────────────────────────────

// Ruta exclusiva para la API de sincronización externa (HU-37 / API-03)
router.get("/sincronizacion", verifyToken, materiaController.getMateriasParaSincronizacion);

// Rutas originales para el consumo interno del frontend de SIGAD
router.get("/", verifyToken, materiaController.getMaterias);
router.post("/", verifyToken, requireRole([1, 2]), validateMateria, materiaController.createMateria);
router.put("/:id", verifyToken, requireRole([1, 2]), validateMateria, materiaController.updateMateria);
router.delete("/:id", verifyToken, requireRole([1]), materiaController.deleteMateria);
router.patch("/:id/toggle", verifyToken, requireRole([1]), materiaController.toggleMateria);

module.exports = router;