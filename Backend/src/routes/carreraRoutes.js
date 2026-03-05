const express = require("express");
const router = express.Router();
const { getCarreras } = require("../controllers/carreraController");

router.get("/", getCarreras);
const express = require('express');
const router = express.Router();
const { validarCreacionCarrera } = require('../middlewares/carreraValidator');
const carreraController = require('../controllers/carreraController');

router.get('/academias-activas', carreraController.getAcademiasDisponibles);
router.get('/', carreraController.getCarreras);
router.post('/', validarCreacionCarrera, carreraController.crearCarrera);

module.exports = router;