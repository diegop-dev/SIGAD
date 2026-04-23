const express = require('express');
const router = express.Router();
const { actualizarAula, consultarAulas, registrarAula, desactivarAula, ObtenerAulas, obtenerAsignacionesRelacionadas } = require('../controllers/aulaController');
const { validarActualizacionAula } = require('../middlewares/aulaValidator');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');

// ─── EP-09 SESA: público, sin verifyToken ────────────────────────────────────
router.get('/catalogo', ObtenerAulas);

// ─── Lectura interna ─────────────────────────────────────────────────────────
router.get('/consultar', verifyToken, requireRole([1, 2]), consultarAulas);

// ─── Escritura ───────────────────────────────────────────────────────────────
router.post('/registrar',           verifyToken, requireRole([1, 2]), registrarAula);
router.patch('/actualizar/:id',     verifyToken, requireRole([1, 2]), validarActualizacionAula, actualizarAula);
router.patch('/desactivar/:id',     verifyToken, requireRole([1, 2]), desactivarAula);

// ─── Ocupaciones ─────────────────────────────────────────────────────────────
router.get('/:id/asignaciones',     verifyToken, requireRole([1, 2, 3]), obtenerAsignacionesRelacionadas);

module.exports = router;