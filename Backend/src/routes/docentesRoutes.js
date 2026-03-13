const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const upload = require('../middlewares/multerConfig');
// Importación del middleware de seguridad y control de acceso basado en roles
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// API DE SINCRONIZACIÓN EXTERNA (HU-37 / API-06)
router.get('/sincronizacion', verifyToken, docenteController.getDocenteParaSincronizacion);

// MÉTODOS INTERNOS DE SIGAD
// 1. Ruta para obtener usuarios que pueden ser docentes
// (Nota técnica: Esta ruta podría quedar obsoleta en futuros sprints si el alta siempre es unificada, pero se mantiene por retrocompatibilidad)
router.get('/disponibles', verifyToken, requireRole([1, 2]), docenteController.getUsuariosDisponibles);

// 2. Ruta para obtener el listado de docentes ya registrados
router.get('/', verifyToken, docenteController.getDocentes);

// 3. Ruta para registrar un nuevo docente unificado (Credenciales + Expediente)
// Se protege con requireRole para que solo Superadmin (1) y Admin (2) tengan acceso
router.post('/registrar', verifyToken, requireRole([1, 2]), upload.fields([
  { name: 'foto_perfil_url', maxCount: 1 }, // Agregado para soportar la imagen del usuario
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), docenteController.registerDocente);

// 4. Ruta para actualizar un docente existente
router.put('/:id', verifyToken, requireRole([1, 2]), upload.fields([
  { name: 'foto_perfil_url', maxCount: 1 },
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), docenteController.updateDocente);

// 5. Ruta para dar de baja un docente (Soft delete)
router.patch('/:id/deactivate', verifyToken, requireRole([1, 2]), docenteController.deactivateDocente);

module.exports = router;