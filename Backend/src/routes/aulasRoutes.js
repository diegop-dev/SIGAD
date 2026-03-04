JavaScript
const express = require('express');
const router = express.Router();
const { actualizarAula, consultarAulas } = require('../controllers/aulaController');
const { validarActualizacionAula } = require('../middlewares/aulaValidator');

// Usamos PUT o PATCH para actualizaciones
router.get('/consultar', consultarAulas);
router.patch('/actualizar/:id', validarActualizacionAula, actualizarAula);

module.exports = router;