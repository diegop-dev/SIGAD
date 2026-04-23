const { check, validationResult } = require('express-validator');

const validarCreacionGrupo = [
  check('carrera_id')
    .notEmpty().withMessage('Debes seleccionar una carrera').bail()
    .isInt().withMessage('La carrera debe ser un identificador válido'),
  
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
  validarCreacionGrupo
};