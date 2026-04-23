const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/asignaciones', verifyToken, reporteController.obtenerReporteAsignaciones);
router.get('/exportar-pdf', verifyToken, reporteController.exportarReporteAsignacionesPDF);

module.exports = router;