const express = require('express');
const router = express.Router();
const docenteController = require('../controllers/docenteController');
const upload = require('../middlewares/multerConfig'); // Asegúrate de que la ruta a tu multer sea correcta

// 1. Ruta para obtener usuarios que pueden ser docentes (La que fallaba)
router.get('/disponibles', docenteController.getUsuariosDisponibles);

// 2. Ruta para obtener el listado de docentes ya registrados
router.get('/', docenteController.getDocentes);

// 3. Ruta para registrar un nuevo docente con sus PDFs
router.post('/registrar', upload.fields([
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), docenteController.registerDocente);

module.exports = router;
