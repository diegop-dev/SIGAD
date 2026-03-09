const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const upload = require('../middlewares/multerConfig');
// importación obligatoria del middleware de seguridad
const { verifyToken } = require('../middlewares/authMiddleware');

// API DE SINCRONIZACIÓN EXTERNA (HU-37 / API-06)
// el sistema externo consumirá: GET /api/docentes/sincronizacion?id_docente=X
router.get('/sincronizacion', verifyToken, docenteController.getDocenteParaSincronizacion);

// ==========================================
// MÉTODOS INTERNOS DE SIGAD
// ==========================================
// 1. Ruta para obtener usuarios que pueden ser docentes
router.get('/disponibles', verifyToken, docenteController.getUsuariosDisponibles);

// 2. Ruta para obtener el listado de docentes ya registrados
router.get('/', verifyToken, docenteController.getDocentes);

// 3. Ruta para registrar un nuevo docente
router.post('/registrar', verifyToken, upload.fields([
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), docenteController.registerDocente);

// 4. NUEVA RUTA: Actualizar un docente existente
router.put('/:id', verifyToken, upload.fields([
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), docenteController.updateDocente);

// 5. NUEVA RUTA: Dar de baja un docente (soft delete)
router.patch('/:id/deactivate', verifyToken, docenteController.deactivateDocente);

module.exports = router;