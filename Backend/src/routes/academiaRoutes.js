const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/',                          academiaController.getAcademias);
router.get('/coordinadores-disponibles', academiaController.getCoordinadores);
router.get('/validar-nombre/:nombre',    academiaController.checkNombre);
router.get('/cliente',                   academiaController.getAcademiasCliente);

router.post('/registrar',    verifyToken, academiaController.createAcademia);
router.put('/:id',           verifyToken, academiaController.updateAcademia);
router.patch('/:id/estatus', verifyToken, academiaController.updateEstatus);

module.exports = router;