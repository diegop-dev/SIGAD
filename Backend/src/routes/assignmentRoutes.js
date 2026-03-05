const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// HU-33: Crear asignación docente (Solo SuperAdmin y Admin)
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