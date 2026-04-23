const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middlewares/authMiddleware");
const { validarMateria } = require("../middlewares/materiaValidator");
const materiaController = require("../controllers/materiaController");

// ─── EP-04 SESA: GET /materias/catalogo ───────────────────────────────────────────────
// Soporta query params opcionales: ?id_programa_academico=X&cuatrimestre_id=Y&tipo_asignatura=Z
router.get("/catalogo", materiaController.ObtenerMaterias);
// ─────────────────────────────────────────────────────────────────────────────

// Ruta exclusiva para la API de sincronización externa (HU-37 / API-03)
router.get("/sincronizacion", verifyToken, materiaController.obtenerMateriasParaSincronizacion);

// Rutas originales para el consumo interno del frontend de SIGAD
router.get("/", verifyToken, materiaController.obtenerMaterias);
router.post("/", verifyToken, requireRole([1, 2]), validarMateria, materiaController.crearMateria);
router.put("/:id", verifyToken, requireRole([1, 2]), validarMateria, materiaController.actualizarMateria);
router.patch("/:id/desactivar", verifyToken, requireRole([1]), materiaController.desactivarMateria);
router.patch("/:id/reactivar", verifyToken, requireRole([1]), materiaController.reactivarMateria);

module.exports = router;