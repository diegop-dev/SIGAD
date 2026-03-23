const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
router.get('/asignaciones', verifyToken, reporteController.obtenerReporteAsignaciones);

module.exports = router;