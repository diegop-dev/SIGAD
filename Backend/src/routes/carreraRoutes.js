const express = require('express');
const router = express.Router();
const { validarCreacionCarrera } = require('../middlewares/carreraValidator');
const { verifyToken } = require('../middlewares/authMiddleware');
const carreraController = require('../controllers/carreraController');

// ─── EP-02 SESA: GET /programas_academicos ───────────────────────────────────
router.get('/programas_academicos', carreraController.obtenerProgramasAcademicos);
// ─────────────────────────────────────────────────────────────────────────────

// Ruta exclusiva para la API de sincronización externa (HU-37 / API-01)
router.get('/sincronizacion', verifyToken, carreraController.obtenerCarrerasParaSincronizacion);

// Rutas originales para el consumo interno del frontend de SIGAD
router.get('/academias-activas', verifyToken, carreraController.obtenerAcademiasDisponibles);
router.get('/', verifyToken, carreraController.obtenerCarreras);
router.post('/', verifyToken, validarCreacionCarrera, carreraController.crearCarrera);

// Rutas para modificar y eliminar
router.put('/:id', verifyToken, validarCreacionCarrera, carreraController.actualizarCarrera);
router.patch('/:id/desactivar', verifyToken, carreraController.desactivarCarrera);
router.patch('/:id/activar', verifyToken, carreraController.activarCarrera);
module.exports = router;