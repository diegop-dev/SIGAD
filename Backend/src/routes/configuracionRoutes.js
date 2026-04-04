const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const configuracionController = require('../controllers/configuracionController');

// Solo Superadministrador puede consultar o modificar la configuración
router.get('/', verifyToken, requireRole([1]), configuracionController.getConfig);
router.put('/', verifyToken, requireRole([1]), configuracionController.updateConfig);

module.exports = router;
