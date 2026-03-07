const { check, validationResult } = require('express-validator');

const validarCreacionGrupo = [
    check('identificador')
        .trim()
        .notEmpty().withMessage('El identificador del grupo es obligatorio').bail()
        .isLength({ max: 10 }).withMessage('El identificador no puede exceder los 10 caracteres'),

    check('carrera_id')
        .notEmpty().withMessage('Debes seleccionar una carrera').bail()
        .isInt().withMessage('La carrera debe ser un identificador válido'),

    check('cuatrimestre_id')
        .notEmpty().withMessage('Debes asignar un cuatrimestre').bail()
        .isInt({ min: 1, max: 15 }).withMessage('El cuatrimestre debe ser un número válido entre 1 y 15'),
  
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