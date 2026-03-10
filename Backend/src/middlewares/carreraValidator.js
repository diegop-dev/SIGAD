const { check, validationResult } = require('express-validator');

const validarCreacionCarrera = [
  check('nombre_carrera')
    .trim()
    .notEmpty().withMessage('El nombre de la carrera es obligatorio').bail()
    .isLength({ min: 5, max: 100 }).withMessage('El nombre debe tener entre 5 y 100 caracteres').bail()
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Solo se permiten letras y espacios').bail()
    .custom((value) => {
      if (/\s{2,}/.test(value)) {
        throw new Error('No se permiten espacios dobles o múltiples');
      }
      // Agregamos la "i" al final para que aAa y aaa sean lo mismo
      if (/(.)\1{2,}/i.test(value)) {
        throw new Error('El nombre no parece válido (caracteres repetidos)');
      }
      
      const palabras = value.trim().split(/\s+/);
      const purasLetrasSueltas = palabras.length > 1 && palabras.every(palabra => palabra.length <= 1);
      
      if (purasLetrasSueltas) {
        throw new Error('El nombre no puede estar formado solo por letras sueltas');
      }

      // Nueva regla: Evita palabras como "Aa", "aa", "ee"
      const palabrasSinSentido = palabras.some(palabra => palabra.length > 1 && /^(.)\1+$/i.test(palabra));
      if (palabrasSinSentido) {
        throw new Error('El nombre contiene palabras no válidas (ej. "Aa")');
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