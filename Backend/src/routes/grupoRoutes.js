const express = require('express');
const router = express.Router();
const grupoController = require('../controllers/grupoController');
const { validarCreacionGrupo } = require('../middlewares/grupoValidator');

// Rutas principales
router.get('/', grupoController.getGrupos);
router.post('/', validarCreacionGrupo, grupoController.crearGrupo);
router.put('/:id', validarCreacionGrupo, grupoController.actualizarGrupo);

// Ruta para cambio de estatus (borrado lógico)
router.put('/:id/status', grupoController.cambiarEstatusGrupo);

module.exports = router;