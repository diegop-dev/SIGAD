const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// ─── EP-06 SESA: GET /asignaciones/catalogo ──────────────────────────────────
router.get('/catalogo', verifyToken, assignmentController.ObtenerAsignaciones);
// ─────────────────────────────────────────────────────────────────────────────

// ─── HU-38: Sincronizar promedios consolidados desde SESA ────────────────────
router.post('/sincronizar-promedios', verifyToken, requireRole([1, 2]), assignmentController.sincronizarPromedios);
// ─────────────────────────────────────────────────────────────────────────────

// Ruta exclusiva para la API de sincronización externa (HU-37 / API-05)
router.get('/sincronizacion', verifyToken, assignmentController.getAsignacionesParaSincronizacion);

// HU-39: API de recepción de estatus de incumplimiento
router.get('/recepcion', verifyToken, requireRole([1, 2]), assignmentController.sincronizarReportesExternos);

// HU-33: Crear asignación docente (solo SuperAdmin y Admin)
router.post('/', verifyToken, requireRole([1, 2]), assignmentController.createAsignacion);

// HU-34: Consultar asignaciones docente (SuperAdmin, Admin y Docentes)
router.get('/', verifyToken, requireRole([1, 2, 3]), assignmentController.getAsignaciones);

// HU-35: Modificar asignación docente (solo SuperAdmin y Admin)
router.put('/', verifyToken, requireRole([1, 2]), assignmentController.updateAsignacion);

// HU-36: Cancelar asignación docente mediante borrado lógico (solo SuperAdmin y Admin)
router.delete('/', verifyToken, requireRole([1, 2]), assignmentController.cancelarAsignacion);

// Reactivar asignación previamente cancelada (solo SuperAdmin y Admin)
router.patch('/reactivar', verifyToken, requireRole([1, 2]), assignmentController.reactivarAsignacion);

// HU-46: Aceptar o Rechazar asignación (Docentes)
router.patch('/confirmacion', verifyToken, requireRole([1, 2, 3]), assignmentController.actualizarConfirmacion);

module.exports = router;