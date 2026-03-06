const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');

router.get('/', academiaController.getAcademias);
router.get('/coordinadores-disponibles', academiaController.getCoordinadores);

// 🔹 VALIDAR NOMBRE (Soporta ?id= en el query string para edición)
router.get('/validar-nombre/:nombre', academiaController.checkNombre);
router.post('/registrar', academiaController.createAcademia);

// 🔹 ACTUALIZAR DATOS (MODAL)
router.put('/:id', academiaController.updateAcademia);

// 🔹 CAMBIAR ESTATUS (BASURITA - PATCH)
router.patch('/:id/estatus', academiaController.updateEstatus);

module.exports = router;