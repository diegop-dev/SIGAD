const express = require('express');
const router = express.Router();
const { validarCreacionCarrera } = require('../middlewares/carreraValidator');
// middleware de seguridad obligatorio para la HU-37
const { verifyToken } = require('../middlewares/authMiddleware'); 
const carreraController = require('../controllers/carreraController');

// ruta exclusiva para la API de sincronización externa (HU-37 / API-01)
// nota: el sistema externo deberá consumir GET /api/carreras/sincronizacion
router.get('/sincronizacion', verifyToken, carreraController.getCarrerasParaSincronizacion);

// rutas originales para el consumo interno del frontend de SIGAD
// se mantiene '/' para no romper las peticiones existentes en la interfaz web
router.get('/academias-activas', verifyToken, carreraController.getAcademiasDisponibles);
router.get('/', verifyToken, carreraController.getCarreras);
router.post('/', verifyToken, validarCreacionCarrera, carreraController.crearCarrera);

module.exports = router;