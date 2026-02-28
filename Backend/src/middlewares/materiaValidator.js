const { check, validationResult } = require("express-validator");

const validateMateria = [
  check("codigo_unico")
    .notEmpty()
    .withMessage("El código único es obligatorio")
    .isLength({ max: 20 }),

  check("nombre")
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 100 }),

  check("creditos")
    .isInt({ min: 1 })
    .withMessage("Los créditos deben ser un número entero positivo"),

  check("cuatrimestre")
    .isInt({ min: 1 })
    .withMessage("El cuatrimestre debe ser un número entero positivo"),

  check("tipo_asignatura")
    .notEmpty()
    .withMessage("El tipo de asignatura es obligatorio"),

  check("carrera_id")
    .optional({ nullable: true })
    .isInt()
    .withMessage("El ID de carrera debe ser un número entero"),

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