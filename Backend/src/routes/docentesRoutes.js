const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const upload = require('../middlewares/multerConfig'); 

// 1. Ruta para obtener usuarios que pueden ser docentes
router.get('/disponibles', docenteController.getUsuariosDisponibles);

// 2. Ruta para obtener el listado de docentes ya registrados
router.get('/', docenteController.getDocentes);

// 3. Ruta para registrar un nuevo docente
router.post('/registrar', upload.fields([
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), docenteController.registerDocente);

// 4. NUEVA RUTA: Actualizar un docente existente
router.put('/:id', upload.fields([
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), docenteController.updateDocente);

module.exports = router;