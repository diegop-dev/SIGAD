const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Endpoint para el inicio de sesión
router.post('/login', authController.inicioDeSesion);

// Endpoint para cambiar la contraseña temporal
router.post('/change-temporary-password', verifyToken, authController.cambiarContraseñaTemporal);

module.exports = router;