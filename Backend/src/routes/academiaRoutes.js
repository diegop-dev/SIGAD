const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');

// 🔹 LISTAR TODAS LAS ACADEMIAS (ADMIN)
router.get('/', academiaController.getAcademias);

// 🔹 LISTAR SOLO ACTIVAS (CLIENTE)
router.get('/cliente', academiaController.getAcademiasCliente);

// 🔹 COORDINADORES DISPONIBLES
router.get('/coordinadores-disponibles', academiaController.getCoordinadores);

// 🔹 VALIDAR NOMBRE (Soporta ?id= en el query string para edición)
router.get('/validar-nombre/:nombre', academiaController.checkNombre);

// 🔹 REGISTRAR
router.post('/registrar', academiaController.createAcademia);

// 🔹 ACTUALIZAR DATOS (MODAL)
router.put('/:id', academiaController.updateAcademia);

// 🔹 CAMBIAR ESTATUS (BASURITA - PATCH)
router.patch('/:id/estatus', academiaController.updateEstatus);

module.exports = router;