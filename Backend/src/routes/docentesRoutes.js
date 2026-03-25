const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const upload = require('../middlewares/multerConfig');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// Configuración de campos de archivos reutilizable para evitar repetición
const expedienteUpload = upload.fields([
  { name: 'foto_perfil_url', maxCount: 1 },
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]);

// --- RUTAS PÚBLICAS / SINCRONIZACIÓN ---
router.get('/sincronizacion', verifyToken, docenteController.getDocenteParaSincronizacion);

// --- RUTAS DE "MI PERFIL" (Exclusivas para el Docente - Rol 3) ---
router.get('/mi-perfil', verifyToken, requireRole([3]), docenteController.getMiPerfil);
router.put('/mi-perfil', verifyToken, requireRole([3]), expedienteUpload, docenteController.updateMiPerfil);

// --- RUTAS ADMINISTRATIVAS (Roles 1 y 2) ---

// Lectura y Disponibilidad
router.get('/', verifyToken, requireRole([1, 2]), docenteController.getDocentes);
router.get('/disponibles', verifyToken, requireRole([1, 2]), docenteController.getUsuariosDisponibles);
router.get('/historial/:id_docente', verifyToken, requireRole([1, 2]), docenteController.obtenerHistorialDocente);

// Escritura y Gestión de Expediente
router.post('/registrar', verifyToken, requireRole([1, 2]), expedienteUpload, docenteController.registerDocente);
router.put('/:id', verifyToken, requireRole([1, 2]), expedienteUpload, docenteController.updateDocente);

// Estados (Activación / Desactivación)
router.patch('/:id/deactivate', verifyToken, requireRole([1, 2]), docenteController.deactivateDocente);
router.patch('/:id/reactivate', verifyToken, requireRole([1, 2]), docenteController.reactivateDocente);

module.exports = router;