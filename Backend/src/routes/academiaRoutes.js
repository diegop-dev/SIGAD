const express = require('express');
const router = express.Router();
const academiaController = require('../controllers/academiaController');
const { crearAcademiaRules, validarCampos } = require('../validators/academiaValidator');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
const { verifyToken, requireRole } = require('../middlewares/authMiddleware');
router.get('/coordinadores-disponibles',  verifyToken, requireRole([1,2]), academiaController.getCoordinadores);
router.get('/validar-nombre/:nombre',  verifyToken, requireRole([1]), academiaController.checkNombre);
router.post('/registrar',  verifyToken, requireRole([1]), academiaController.createAcademia);

module.exports = router;