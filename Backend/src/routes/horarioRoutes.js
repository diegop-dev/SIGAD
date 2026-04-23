const express = require('express');
const router  = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validateHorarioQuery }     = require('../middlewares/horarioValidator');
const horarioController            = require('../controllers/horarioController');

// GET /api/horarios
// Devuelve el horario del docente autenticado en JSON (para la vista web).
// Solo accesible por docentes (rol_id = 3).
router.get(
  '/',
  verifyToken,
  requireRole([3]),
  validateHorarioQuery,
  horarioController.getHorario
);

// GET /api/horarios/pdf
// Genera y descarga el PDF oficial de horario.
// El id_docente se extrae del JWT — ningún parámetro externo lo determina.
router.get(
  '/pdf',
  verifyToken,
  requireRole([3]),
  horarioController.descargarHorarioPDF
);

module.exports = router;
