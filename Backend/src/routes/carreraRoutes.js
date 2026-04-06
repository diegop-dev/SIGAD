const express = require('express');
const router = express.Router();
const { validarCreacionCarrera } = require('../middlewares/carreraValidator');
const { verifyToken } = require('../middlewares/authMiddleware');
const carreraController = require('../controllers/carreraController');

// ─── EP-02 SESA: GET /programas_academicos ───────────────────────────────────
router.get('/programas_academicos', carreraController.ObtenerProgramasAcademicos);
// ─────────────────────────────────────────────────────────────────────────────

// Ruta exclusiva para la API de sincronización externa (HU-37 / API-01)
router.get('/sincronizacion', verifyToken, carreraController.getCarrerasParaSincronizacion);

// Rutas originales para el consumo interno del frontend de SIGAD
router.get('/academias-activas', verifyToken, carreraController.getAcademiasDisponibles);
router.get('/', verifyToken, carreraController.getCarreras);
router.post('/', verifyToken, validarCreacionCarrera, carreraController.crearCarrera);

// Rutas para modificar y eliminar
router.put('/:id', verifyToken, validarCreacionCarrera, carreraController.actualizarCarrera);
router.patch('/:id/deactivate', verifyToken, carreraController.deactivateCarrera);
router.patch('/:id/activate', verifyToken, carreraController.activateCarrera);
module.exports = router;