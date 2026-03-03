const { check, validationResult } = require("express-validator");

const validateMateria = [

  check("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres")
    .matches(/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/)
    .withMessage("El nombre solo puede contener letras y espacios"),

  check("creditos")
    .notEmpty()
    .withMessage("Los créditos son obligatorios")
    .isInt({ min: 1, max: 30 })
    .withMessage("Los créditos deben estar entre 1 y 30"),

  check("cuatrimestre")
    .notEmpty()
    .withMessage("El cuatrimestre es obligatorio")
    .isInt({ min: 1, max: 12 })
    .withMessage("El cuatrimestre debe estar entre 1 y 12"),

  check("tipo_asignatura")
    .trim()
    .notEmpty()
    .withMessage("El tipo de asignatura es obligatorio")
    .isLength({ max: 50 })
    .withMessage("El tipo de asignatura no puede exceder 50 caracteres"),

  check("carrera_id")
    .notEmpty()
    .withMessage("Debe seleccionar una carrera")
    .isInt({ min: 1 })
    .withMessage("El ID de carrera debe ser un número entero válido"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: "Error en la validación de datos",
        detalles: errors.array(),
      });
    }
    next();
  },
];

module.exports = { validateMateria };