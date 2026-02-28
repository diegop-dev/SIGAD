const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    // Genera un nombre único para evitar sobreescritura de archivos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Formato de archivo no soportado. Solo se permiten imágenes (JPEG, PNG, WEBP).'));
};

const uploadProfilePic = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB
  fileFilter: fileFilter
});

module.exports = { uploadProfilePic };

// 2. CONFIGURACIÓN PARA EXPEDIENTE DIGITAL (Docentes)

const docenteStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // IMPORTANTE: Asegúrate de crear esta carpeta manualmente en tu proyecto
    cb(null, 'uploads/docentes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Agregamos el "fieldname" (ej. titulo, ine) al principio para saber qué archivo es cuál
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const docenteFileFilter = (req, file, cb) => {
  // Criterio de Aceptación: Formato PDF estrictamente
  if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
    return cb(null, true);
  }
  cb(new Error('Formato de archivo no soportado. Solo se permiten documentos PDF.'));
};

// Configuramos los 6 campos exactos que el Frontend nos va a enviar
const uploadDocenteDocs = multer({
  storage: docenteStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Límite de 10MB por PDF
  fileFilter: docenteFileFilter
}).fields([
  { name: 'titulo', maxCount: 1 },
  { name: 'cedula', maxCount: 1 },
  { name: 'sat', maxCount: 1 },
  { name: 'ine', maxCount: 1 },
  { name: 'domicilio', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]);

// Exportamos ambas funciones para usarlas en sus respectivas rutas
module.exports = { 
  uploadProfilePic,
  uploadDocenteDocs 
};
