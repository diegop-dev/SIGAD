const { check, validationResult } = require('express-validator');

const validarCreacionCarrera = [
  check('codigo_unico')
    .trim()
    .toUpperCase()
    .notEmpty().withMessage('El código de la carrera es obligatorio').bail()
    .matches(/^[A-Z]{3}[0-9]{2}$/).withMessage('El código debe tener exactamente 3 letras seguidas de 2 números (ej. INF01)'),

  check('nombre_carrera')
    .trim()
    .notEmpty().withMessage('El nombre de la carrera es obligatorio').bail()
    .isLength({ min: 5, max: 100 }).withMessage('El nombre debe tener entre 5 y 100 caracteres').bail()
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Solo se permiten letras y espacios').bail()
    .custom((value) => {
      if (/\s{2,}/.test(value)) {
        throw new Error('No se permiten espacios dobles o múltiples');
      }
      if (/(.)\1{2,}/.test(value)) {
        throw new Error('El nombre no parece válido (caracteres repetidos)');
      }
      
      const palabras = value.split(' ');
      const purasLetrasSueltas = palabras.length > 1 && palabras.every(palabra => palabra.length <= 1);
      
      if (purasLetrasSueltas) {
        throw new Error('El nombre no puede estar formado solo por letras sueltas');
      }
      return true;
    }),

  check('modalidad')
    .trim()
    .notEmpty().withMessage('La modalidad es obligatoria').bail()
    .isLength({ max: 50 }).withMessage('La modalidad no puede exceder los 50 caracteres'),

  check('academia_id')
    .notEmpty().withMessage('Debes seleccionar una academia').bail()
    .isInt().withMessage('La academia debe ser un identificador válido'),
  
  (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Errores en la validación de datos',
        errores: errores.array()
      });
    }
    next();
  }
];

module.exports = {
  validarCreacionCarrera
};