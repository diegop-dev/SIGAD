const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const auditController = require('../controllers/auditController');

// HU-52: Solo Superadministrador puede ver el registro de auditoría
router.get('/', verifyToken, requireRole([1]), auditController.getLogs);

module.exports = router;
