const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const upload = require('../middlewares/multerConfig');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { obtenerHistorialDocente } = require('../controllers/docenteController');

// ─── EP-07 SESA: GET /docentes/catalogo ────────────────────────────────────────────────
router.get('/catalogo', docenteController.ObtenerDocentes);
// ─────────────────────────────────────────────────────────────────────────────

// API DE SINCRONIZACIÓN EXTERNA (HU-37 / API-06)
router.get('/sincronizacion', verifyToken, docenteController.getDocenteParaSincronizacion);

// Rutas internas SIGAD
router.get('/disponibles', verifyToken, requireRole([1, 2]), docenteController.getUsuariosDisponibles);
router.get('/mi-perfil', verifyToken, requireRole([3]), docenteController.getMiPerfil);
router.get('/historial/:id_docente', verifyToken, docenteController.obtenerHistorialDocente);
router.get('/historial/exportar-pdf/:id_docente', verifyToken, docenteController.exportarHistorialDocentePDF);
router.get('/', verifyToken, docenteController.getDocentes);

router.post('/registrar', verifyToken, requireRole([1, 2]), upload.fields([
  { name: 'foto_perfil_url', maxCount: 1 },
  { name: 'titulo',          maxCount: 1 },
  { name: 'cedula',          maxCount: 1 },
  { name: 'sat',             maxCount: 1 },
  { name: 'ine',             maxCount: 1 },
  { name: 'domicilio',       maxCount: 1 },
  { name: 'cv',              maxCount: 1 },
]), docenteController.registerDocente);

router.put('/mi-perfil', verifyToken, requireRole([3]), upload.fields([
  { name: 'foto_perfil_url', maxCount: 1 },
  { name: 'titulo',          maxCount: 1 },
  { name: 'cedula',          maxCount: 1 },
  { name: 'sat',             maxCount: 1 },
  { name: 'ine',             maxCount: 1 },
  { name: 'domicilio',       maxCount: 1 },
  { name: 'cv',              maxCount: 1 },
]), docenteController.updateMiPerfil);

router.put('/:id', verifyToken, requireRole([1, 2]), upload.fields([
  { name: 'foto_perfil_url', maxCount: 1 },
  { name: 'titulo',          maxCount: 1 },
  { name: 'cedula',          maxCount: 1 },
  { name: 'sat',             maxCount: 1 },
  { name: 'ine',             maxCount: 1 },
  { name: 'domicilio',       maxCount: 1 },
  { name: 'cv',              maxCount: 1 },
]), docenteController.updateDocente);

router.patch('/:id/deactivate', verifyToken, requireRole([1, 2]), docenteController.deactivateDocente);
router.patch('/:id/reactivate', verifyToken, requireRole([1, 2]), docenteController.reactivateDocente);

module.exports = router;