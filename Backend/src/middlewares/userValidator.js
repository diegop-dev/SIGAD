const { check, validationResult } = require('express-validator');

// Regex para nombres: Letras, tildes, ñ, diéresis, espacios, guiones y apóstrofes
const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

const validateUserRegistration = [
  // Validación de Nombres y Apellidos
  check('nombres')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 60 }).withMessage('El nombre debe tener entre 2 y 60 caracteres')
    .matches(nameRegex).withMessage('El nombre contiene caracteres no permitidos')
    .escape(), // Prevención de XSS

  check('apellido_paterno')
    .trim()
    .notEmpty().withMessage('El apellido paterno es obligatorio')
    .isLength({ min: 2, max: 60 }).withMessage('El apellido paterno debe tener entre 2 y 60 caracteres')
    .matches(nameRegex).withMessage('El apellido paterno contiene caracteres no permitidos')
    .escape(),

  check('apellido_materno')
    .trim()
    .notEmpty().withMessage('El apellido materno es obligatorio')
    .isLength({ min: 2, max: 60 }).withMessage('El apellido materno debe tener entre 2 y 60 caracteres')
    .matches(nameRegex).withMessage('El apellido materno contiene caracteres no permitidos')
    .escape(),

  // Validación de Correos Electrónicos
  check('personal_email')
    .trim()
    .isEmail().withMessage('Debe proporcionar un correo personal válido')
    .isLength({ max: 254 }).withMessage('El correo es demasiado largo')
    .normalizeEmail() // Convierte a minúsculas y limpia puntos innecesarios en gmail
    .toLowerCase(),

  check('institutional_email')
    .trim()
    .isEmail().withMessage('Debe proporcionar un correo institucional válido')
    .isLength({ max: 254 }).withMessage('El correo es demasiado largo')
    .normalizeEmail()
    .toLowerCase(),

  // Validación de Contraseña (AHORA ES OPCIONAL)
  check('password_raw')
    .optional() // <-- ESTA ES LA CLAVE DE ESTA ACTUALIZACIÓN
    .isLength({ min: 8, max: 50 }).withMessage('La contraseña debe tener entre 8 y 50 caracteres')
    .custom((value) => !/\s/.test(value)).withMessage('La contraseña no puede contener espacios en blanco'),

  // Validación de Roles y Auditoría
  check('rol_id')
    .isInt({ min: 1, max: 3 }).withMessage('El rol proporcionado no es válido (debe ser 1, 2 o 3)'),

  check('creado_por')
    .optional()
    .isInt().withMessage('El ID de creador debe ser un número entero'),
    
  check('modificado_por')
    .optional()
    .isInt().withMessage('El ID de modificador debe ser un número entero'),

  // Interceptor final de errores
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: errors.array()[0].msg, 
        detalles: errors.array() 
      });
    }
    next();
  }
];

module.exports = {
  validateUserRegistration
};
