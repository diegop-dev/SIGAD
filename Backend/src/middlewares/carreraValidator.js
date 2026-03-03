const { check, validationResult } = require('express-validator');

const validarCreacionCarrera = [
  check('nombre_carrera')
    .trim()
    .notEmpty().withMessage('El nombre de la carrera es obligatorio').bail()
    .isLength({ min: 5, max: 100 }).withMessage('El nombre debe tener entre 5 y 100 caracteres').bail()
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Solo se permiten letras y espacios (sin números ni símbolos)').bail()
    .custom((value) => {
      // 1. Validar espacios dobles
      if (/\s{2,}/.test(value)) {
        throw new Error('No se permiten espacios dobles o múltiples');
      }
      
      // 2. Validar caracteres repetidos (ej. "AAA")
      if (/(.)\1{2,}/.test(value)) {
        throw new Error('El nombre no parece válido (caracteres repetidos)');
      }

      // 3. Validar puras letras sueltas (ej. "A A A A")
      const palabras = value.split(' ');
      const purasLetrasSueltas = palabras.length > 1 && palabras.every(palabra => palabra.length <= 1);
      
      if (purasLetrasSueltas) {
        throw new Error('El nombre no puede estar formado solo por letras sueltas');
      }

      return true; // Si pasa todas las pruebas, es un nombre válido
    }),

  check('academia_id', 'La academia es obligatoria y debe ser un número válido').isInt(),
  
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