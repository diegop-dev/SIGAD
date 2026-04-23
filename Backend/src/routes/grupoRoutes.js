const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validarCreacionGrupo } = require('../middlewares/grupoValidator');

// ─── EP-05 SESA: público ─────────────────────────────────────────────────────
router.get('/catalogo', grupoController.obtenerCatalogoGrupos);

// ─── Sincronización externa HU-37 / API-04 ───────────────────────────────────
router.get('/sincronizacion', verifyToken, grupoController.obtenerGruposParaSincronizacion);

// ─── Lectura interna ─────────────────────────────────────────────────────────
router.get('/', verifyToken, requireRole([1, 2]), grupoController.obtenerTodosLosGrupos);

// ─── Escritura ───────────────────────────────────────────────────────────────
router.post('/', verifyToken, requireRole([1, 2]), validarCreacionGrupo, grupoController.crearGrupo);
router.put('/:id', verifyToken, requireRole([1, 2]), validarCreacionGrupo, grupoController.actualizarGrupo);

// ─── Cambio de estatus ───────────────────────────────────────────────────────
router.patch('/:id/desactivar', verifyToken, requireRole([1, 2]), grupoController.desactivarGrupo);
router.patch('/:id/reactivar',  verifyToken, requireRole([1, 2]), grupoController.reactivarGrupo);

router.get('/:id/asignaciones', verifyToken, requireRole([1, 2, 3]), grupoController.obtenerAsignacionesRelacionadas);

module.exports = router;