const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validateUserRegistration } = require('../middlewares/userValidator');
const { uploadProfilePic } = require('../middlewares/uploadMiddleware');
const userController = require('../controllers/userController');
const docenteController = require('../controllers/docenteController');

// Validación asincrona de correos
// Permite al frontend verificar en tiempo real si el correo ya existe en la BD
router.get('/check-email', userController.checkEmailExists);

// ─── EP-08 SESA: GET /users/catalogo/{id_usuario} ──────────────────────────────
router.get('/catalogo/:id_usuario', docenteController.ObtenerUsuarioPorId);
// ─────────────────────────────────────────────────────────────────────────────

// HU-02: Listar usuarios — solo directivos
router.get('/', verifyToken, requireRole([1, 2]), userController.getUsers);

// HU-01: Registro de usuario
// Nota: 'validateUserRegistration' ahora servirá como primera barrera, 
// respaldada por las validaciones estrictas que inyectamos en el controller.
router.post('/register', uploadProfilePic.single('foto_perfil_url'), validateUserRegistration, userController.registerUser);

// HU-03: Modificar usuario — solo directivos
router.put('/:id', verifyToken, requireRole([1, 2]), uploadProfilePic.single('foto_perfil_url'), userController.updateUser);

// HU-04: Desactivar usuario — solo directivos (Soft Delete)
router.patch('/:id/deactivate', verifyToken, requireRole([1, 2]), userController.deactivateUser);

// NUEVO: Reactivar usuario — solo directivos
router.patch('/:id/activate', verifyToken, requireRole([1, 2]), userController.activateUser);

module.exports = router;