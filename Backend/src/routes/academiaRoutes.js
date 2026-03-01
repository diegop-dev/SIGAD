const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');

router.get('/coordinadores-disponibles', academiaController.getCoordinadores);
router.get('/validar-nombre/:nombre', academiaController.checkNombre);
router.post('/registrar', academiaController.createAcademia);

module.exports = router;