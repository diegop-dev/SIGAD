const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Importamos el protector de rutas

// Endpoint para el inicio de sesión
router.post('/login', authController.login);

// NUEVO: Endpoint para cambiar la contraseña temporal (requiere sesión activa)
router.post('/change-temporary-password', verifyToken, authController.changeTemporaryPassword);

module.exports = router;