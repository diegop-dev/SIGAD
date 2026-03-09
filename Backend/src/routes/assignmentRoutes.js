const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// ruta exclusiva para la API de sincronización externa (HU-37 / API-05)
// el sistema externo consumirá: GET /api/asignaciones/sincronizacion?materia_id=X&grupo_id=Y
router.get(
  '/sincronizacion', 
  verifyToken, 
  assignmentController.getAsignacionesParaSincronizacion
);

// HU-33: Crear asignación docente (solo SuperAdmin y Admin)
router.post(
  '/', 
  verifyToken, 
  requireRole([1, 2]), 
  assignmentController.createAsignacion
);

// HU-34: Consultar asignaciones docente (SuperAdmin, Admin y Docentes)
router.get(
  '/', 
  verifyToken, 
  requireRole([1, 2, 3]), 
  assignmentController.getAsignaciones
);

module.exports = router;