const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');

// 🔹 LISTAR TODAS LAS ACADEMIAS (ADMIN)
router.get('/', academiaController.getAcademias);

// 🔹 LISTAR SOLO ACTIVAS (CLIENTE)
router.get('/cliente', academiaController.getAcademiasCliente);

// 🔹 COORDINADORES DISPONIBLES
router.get('/coordinadores-disponibles', academiaController.getCoordinadores);

// 🔹 VALIDAR NOMBRE
router.get('/validar-nombre/:nombre', academiaController.checkNombre);

// 🔹 REGISTRAR
router.post('/registrar', academiaController.createAcademia);

module.exports = router;