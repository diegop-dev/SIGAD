const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validateUserRegistration } = require('../middlewares/userValidator');
const { uploadProfilePic } = require('../middlewares/uploadMiddleware');
const userController = require('../controllers/userController');

// Endpoint para listar usuarios (HU-02) - Solo directivos
router.get('/', verifyToken, requireRole([1, 2]), userController.getUsers);

// Endpoint para el registro de usuarios (HU-01) con validación estricta
router.post('/register', uploadProfilePic.single('foto_perfil_url'), validateUserRegistration, userController.registerUser);

// Endpoint para modificar un usuario existente (HU-03) - Solo directivos
router.put('/:id', verifyToken, requireRole([1, 2]), uploadProfilePic.single('foto_perfil_url'), userController.updateUser);

// Endpoint para desactivar un usuario (HU-04 Soft Delete) - Solo directivos
router.patch('/:id/deactivate', verifyToken, requireRole([1, 2]), userController.deactivateUser);

// NUEVO: Endpoint para reactivar un usuario - Solo directivos
router.patch('/:id/activate', verifyToken, requireRole([1, 2]), userController.activateUser);

module.exports = router;
