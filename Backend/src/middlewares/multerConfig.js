const multer = require('multer');
const path = require('path');
const fs = require('fs');

// configuración de almacenamiento dinámico
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // determinamos la carpeta destino evaluando el nombre del campo del formulario
    const dir = file.fieldname === 'foto_perfil_url' 
      ? './uploads/profiles' 
      : './uploads/docentes';
    
    // crea la carpeta correspondiente si no existe en el sistema de archivos
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // generamos un sufijo único para evitar colisiones de nombres
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// filtro inteligente para validar extensiones según el contexto
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'foto_perfil_url') {
    // si es la foto, validamos que su firma empiece con image/ (acepta JPG, PNG, WEBP)
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen válidos para la foto de perfil.'), false);
    }
  } else {
    // para el resto del expediente, aplicamos tu validación estricta de PDF
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF para el expediente digital.'), false);
    }
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

module.exports = upload;