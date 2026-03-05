<<<<<<< HEAD
=======
const express = require("express");
const router = express.Router();
const { getCarreras } = require("../controllers/carreraController");

router.get("/", getCarreras);
>>>>>>> 6f12e3107348b110f0d0d01cfa99ca65a1dadf49
const express = require('express');
const router = express.Router();
const { validarCreacionCarrera } = require('../middlewares/carreraValidator');
const carreraController = require('../controllers/carreraController');

router.get('/academias-activas', carreraController.getAcademiasDisponibles);
router.get('/', carreraController.getCarreras);
router.post('/', validarCreacionCarrera, carreraController.crearCarrera);

module.exports = router;