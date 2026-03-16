const express = require('express');
const router = express.Router();
const metricasController = require('../controllers/metricasController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// HU-41: Panel de Control - Guardar o actualizar métricas (Solo Superadmin)
router.post(
  '/', 
  verifyToken, 
  requireRole([1]), // Rol 1 = Superadministrador
  metricasController.guardarMetricas
);

// HU-41: Panel de Control - Consultar métricas para gráficos (Solo Superadmin)
router.get(
  '/', 
  verifyToken, 
  requireRole([1]), 
  metricasController.consultarMetricas
);

module.exports = router;