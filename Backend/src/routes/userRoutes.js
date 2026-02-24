const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validateUserRegistration } = require('../middlewares/userValidator');
const { uploadProfilePic } = require('../middlewares/uploadMiddleware');
const userController = require('../controllers/userController');

// Endpoint para listar usuarios (HU-02) - Solo directivos
router.get('/', verifyToken, requireRole([1, 2]), userController.getUsers);

// Endpoint para el registro de usuarios (hu-01) con validación estricta
router.post('/register', uploadProfilePic.single('foto_perfil_url'), validateUserRegistration, userController.registerUser);
// Melvin 
router.patch('/desactivar/:id', userController.desactivarUsuario);
module.exports = router;
