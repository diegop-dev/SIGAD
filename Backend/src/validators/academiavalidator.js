const { body, validationResult } = require('express-validator');


const crearAcademiaRules = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.'),

  body('descripcion')
    .optional()
    .isLength({ max: 255 }).withMessage('La descripción no puede exceder 255 caracteres.'),

  body('coordinador_id')
    .notEmpty().withMessage('Debe seleccionar un coordinador.')
    .isInt().withMessage('El coordinador debe ser un número válido.')
];


const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errores: errors.array()
    });
  }
  next();
};

module.exports = {
  crearAcademiaRules,
  validarCampos
};