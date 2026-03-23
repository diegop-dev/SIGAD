const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');


const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { validarCreacionGrupo } = require('../middlewares/grupoValidator');

// ruta exclusiva para la API de sincronización externa (HU-37 / API-04)
router.get('/sincronizacion', verifyToken, grupoController.getGruposParaSincronizacion);

// Rutas principales
router.get('/',verifyToken, grupoController.getGrupos);
router.post('/', validarCreacionGrupo, grupoController.crearGrupo);
router.put('/:id', validarCreacionGrupo, grupoController.actualizarGrupo);

// Rutas de cambio de estatus (Baja y Reactivación)
router.patch('/:id/desactivar', verifyToken, requireRole([1, 2]), grupoController.desactivarGrupo);
router.patch('/:id/reactivar', verifyToken, requireRole([1, 2]), grupoController.reactivarGrupo);

module.exports = router;