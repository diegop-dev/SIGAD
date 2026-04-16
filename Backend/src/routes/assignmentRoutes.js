const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// ─── EP-06 SESA: sin verifyToken (endpoint público para sistema externo) ─────
router.get('/catalogo', assignmentController.ObtenerAsignaciones);

// ─── HU-38: verifyToken agregado ─────────────────────────────────────────────
router.post('/sincronizar-promedios', verifyToken, requireRole([1, 2]), assignmentController.sincronizarPromedios);

// ─── Pre-flight Validation ────────────────────────────────────────────────────
router.post('/validar-borrador', verifyToken, requireRole([1, 2]), assignmentController.validarBorrador);

// ─── HU-37 / API-05 ──────────────────────────────────────────────────────────
router.get('/sincronizacion', verifyToken, assignmentController.getAsignacionesParaSincronizacion);

// ─── HU-39 ───────────────────────────────────────────────────────────────────
router.get('/recepcion', verifyToken, requireRole([1, 2]), assignmentController.sincronizarReportesExternos);

// ─── HU-33 ───────────────────────────────────────────────────────────────────
router.post('/', verifyToken, requireRole([1, 2]), assignmentController.createAsignacion);

// ─── HU-34 ───────────────────────────────────────────────────────────────────
router.get('/', verifyToken, requireRole([1, 2, 3]), assignmentController.getAsignaciones);

// ─── HU-35 ───────────────────────────────────────────────────────────────────
router.put('/', verifyToken, requireRole([1, 2]), assignmentController.updateAsignacion);

// ─── HU-36 ───────────────────────────────────────────────────────────────────
router.delete('/', verifyToken, requireRole([1, 2]), assignmentController.cancelarAsignacion);

// ─── Reactivar ───────────────────────────────────────────────────────────────
router.patch('/reactivar', verifyToken, requireRole([1, 2]), assignmentController.reactivarAsignacion);

// ─── HU-46 ───────────────────────────────────────────────────────────────────
router.patch('/confirmacion', verifyToken, requireRole([1, 2, 3]), assignmentController.actualizarConfirmacion);

module.exports = router;