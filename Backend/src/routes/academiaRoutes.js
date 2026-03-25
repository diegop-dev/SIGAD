const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');

router.get('/', academiaController.getAcademias);
router.get('/coordinadores-disponibles', academiaController.getCoordinadores);
router.get('/validar-nombre/:nombre', academiaController.checkNombre);
router.post('/registrar', academiaController.createAcademia);
router.put('/:id', academiaController.updateAcademia);
router.patch('/:id/estatus', academiaController.updateEstatus);

module.exports = router;