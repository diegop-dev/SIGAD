const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validateUserRegistration } = require('../middlewares/userValidator');
const { uploadProfilePic } = require('../middlewares/uploadMiddleware');
const userController = require('../controllers/userController');
const docenteController = require('../controllers/docenteController');

// Validación asíncrona de correos (público — se usa desde el form de registro)
router.get('/check-email', userController.checkEmailExists);

// ─── EP-08 SESA: público ─────────────────────────────────────────────────────
router.get('/catalogo/:id_usuario', docenteController.ObtenerUsuarioPorId);

// ─── Rutas con parámetros fijos — ANTES de /:id ──────────────────────────────
router.put('/me/foto', verifyToken, uploadProfilePic.single('foto_perfil_url'), userController.updateMyPhoto);

// ─── Lectura ─────────────────────────────────────────────────────────────────
router.get('/',    verifyToken, requireRole([1, 2]), userController.getUsers);
router.get('/:id', verifyToken,                     userController.getUserById);

// ─── Escritura ────────────────────────────────────────────────────────────────
router.post('/register',
  verifyToken,                                        // ← agregado
  requireRole([1, 2]),
  uploadProfilePic.single('foto_perfil_url'),
  validateUserRegistration,
  userController.registerUser
);

router.put('/:id',
  verifyToken,
  requireRole([1, 2]),
  uploadProfilePic.single('foto_perfil_url'),
  userController.updateUser
);

// ─── Cambio de estatus ───────────────────────────────────────────────────────
router.patch('/:id/deactivate', verifyToken, requireRole([1, 2]), userController.deactivateUser);
router.patch('/:id/activate',   verifyToken, requireRole([1, 2]), userController.activateUser);

module.exports = router;