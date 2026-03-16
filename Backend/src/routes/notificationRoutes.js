const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, notificationController.getMisNotificaciones);
router.patch('/:id/leer', verifyToken, notificationController.marcarNotificacionLeida);

module.exports = router;