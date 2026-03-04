JavaScript
const express = require('express');
const router = express.Router();
const { actualizarAula, consultarAulas, registrarAula, desactivarAula } = require('../controllers/aulaController');
const { validarActualizacionAula } = require('../middlewares/aulaValidator');

// Usamos PUT o PATCH para actualizaciones
router.post('/registrar', registrarAula);
router.get('/consultar', consultarAulas);
router.patch('/actualizar/:id', validarActualizacionAula, actualizarAula);
router.patch('/desactivar/:id', desactivarAula);

module.exports = router;