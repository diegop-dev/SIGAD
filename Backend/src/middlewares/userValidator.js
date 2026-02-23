const { check, validationResult } = require('express-validator');

const validateUserRegistration = [
  check('nombres').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 60 }),
  check('apellido_paterno').trim().notEmpty().withMessage('El apellido paterno es obligatorio').isLength({ max: 60 }),
  check('apellido_materno').trim().notEmpty().withMessage('El apellido materno es obligatorio').isLength({ max: 60 }),
  check('personal_email').isEmail().withMessage('Debe proporcionar un correo personal válido').normalizeEmail(),
  check('institutional_email').isEmail().withMessage('Debe proporcionar un correo institucional válido').normalizeEmail(),
  check('password_raw').isLength({ min: 8 }).withMessage('La contraseña temporal debe tener al menos 8 caracteres'),
  check('rol_id').isInt({ min: 1, max: 3 }).withMessage('El rol proporcionado no es válido (debe ser 1, 2 o 3)'),
  check('creado_por').isInt().withMessage('El ID de creador debe ser un número entero'),
  
  // Interceptor final de errores
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Error en la validación de datos', 
        detalles: errors.array() 
      });
    }
    next();
  }
];

module.exports = {
  validateUserRegistration
};
