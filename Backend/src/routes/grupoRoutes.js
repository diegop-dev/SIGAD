const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { validarCreacionGrupo } = require('../middlewares/grupoValidator');

// ruta exclusiva para la API de sincronización externa (HU-37 / API-04)
// el sistema externo consumirá: GET /api/grupos/sincronizacion?carrera_id=X&cuatrimestre_id=Y
router.get('/sincronizacion', verifyToken, grupoController.getGruposParaSincronizacion);
// Rutas principales
router.get('/', grupoController.getGrupos);
router.post('/', validarCreacionGrupo, grupoController.crearGrupo);
router.put('/:id', validarCreacionGrupo, grupoController.actualizarGrupo);

// Ruta para cambio de estatus (borrado lógico)
router.put('/:id/status', grupoController.cambiarEstatusGrupo);

module.exports = router;