// routes/grupoRoutes.js
const express = require('express');
const router = express.Router();
// importamos el middleware de autenticación para dar cumplimiento a la HU-37
const { verifyToken } = require('../middlewares/authMiddleware');
const grupoController = require('../controllers/grupoController');
const { validarCreacionGrupo } = require('../middlewares/grupoValidator');

// ruta exclusiva para la API de sincronización externa (HU-37 / API-04)
// el sistema externo consumirá: GET /api/grupos/sincronizacion?carrera_id=X&cuatrimestre_id=Y
router.get('/sincronizacion', verifyToken, grupoController.getGruposParaSincronizacion);

// rutas originales para el consumo interno del frontend de SIGAD
// se protegen con verifyToken para evitar accesos anónimos a la base de datos
router.get('/', verifyToken, grupoController.getGrupos);
router.post('/', verifyToken, validarCreacionGrupo, grupoController.crearGrupo);
router.put('/:id', verifyToken, validarCreacionGrupo, grupoController.actualizarGrupo);
router.put('/:id/status', verifyToken, grupoController.cambiarEstatusGrupo);

module.exports = router;