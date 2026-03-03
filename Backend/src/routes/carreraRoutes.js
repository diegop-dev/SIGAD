const express = require('express');
const router = express.Router();

// Importamos el middleware de validación que acabamos de crear
const { validarCreacionCarrera } = require('../middlewares/carreraValidator');

// Importamos el controlador
const carreraController = require('../controllers/carreraController');

// Endpoint para obtener las academias (GET /api/carreras/academias-activas)
router.get('/academias-activas', carreraController.getAcademiasDisponibles);

// Endpoint para obtener las carreras (GET /api/carreras)
router.get('/', carreraController.getCarreras);

// (Opcional) Importar middleware de autenticación si lo tienes
// const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint: POST /api/carreras
router.post(
  '/',
  [
    // verificarToken,             // 1. Verifica quién es el usuario
    validarCreacionCarrera         // 2. Verifica que los datos sean correctos
  ],
  carreraController.crearCarrera   // 3. Ejecuta la lógica de negocio y base de datos
);

module.exports = router;