const express = require('express');
const router = express.Router();
const metricasController = require('../controllers/metricasController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// HU-41: Panel de control - Guardar o actualizar métricas (Superadministrador)
router.post(
  '/', 
  verifyToken, 
  requireRole([1]),
  metricasController.guardarMetricas
);

// HU-41: Panel de control - Consultar métricas para gráficos (Superadministrador)
router.get(
  '/', 
  verifyToken, 
  requireRole([1]), 
  metricasController.consultarMetricas
);

module.exports = router;