const { check, validationResult } = require("express-validator");

const validarMateria = [

  check("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 3, max: 100 })
    .withMessage("El nombre debe tener entre 3 y 100 caracteres")
    // se amplió la expresión regular para soportar números y guiones propios de materias académicas
    .matches(/^[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\-\.]+$/)
    .withMessage("El nombre contiene caracteres no permitidos"),

  check("creditos")
    .notEmpty()
    .withMessage("Los créditos son obligatorios")
    .isInt({ min: 1, max: 30 })
    .withMessage("Los créditos deben estar entre 1 y 30"),

  check("cupo_maximo")
    .notEmpty()
    .withMessage("El cupo máximo es obligatorio")
    .isInt({ min: 1, max: 200 })
    .withMessage("El cupo máximo debe ser entre 1 y 200"),

  check("periodo_id")
    .notEmpty()
    .withMessage("Debe seleccionar un periodo")
    .isInt({ min: 1 })
    .withMessage("Periodo inválido"),

  check("cuatrimestre_id")
    .notEmpty()
    .withMessage("Debe seleccionar un cuatrimestre")
    .isInt({ min: 1 })
    .withMessage("Cuatrimestre inválido"),

  check("tipo_asignatura")
    .trim()
    .notEmpty()
    .withMessage("El tipo de asignatura es obligatorio")
    .isIn(["TRONCO_COMUN", "OBLIGATORIA", "OPTATIVA"])
    .withMessage("Tipo de asignatura inválido"),

  // ✨ NUEVO: Protegemos el nuevo campo de nivel académico
  check("nivel_academico")
    .optional()
    .isIn(["LICENCIATURA", "MAESTRIA", "DOCTORADO"])
    .withMessage("Nivel académico inválido"),

  // ✨ CORRECCIÓN: Validación condicional
  // Si no es tronco común, exigimos que venga una carrera válida. Si es tronco común, lo ignoramos.
  check("carrera_id")
    .custom((value, { req }) => {
      if (req.body.tipo_asignatura !== "TRONCO_COMUN") {
        if (!value || isNaN(value) || parseInt(value) < 1) {
          throw new Error("Debe seleccionar una carrera");
        }
      }
      return true;
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // la clave "detalles" fue reemplazada por "errores" para que el frontend pueda pintar de rojo los inputs correctos
      return res.status(400).json({
        error: "Error en la validación de datos",
        errores: errors.array(),
      });
    }
    next();
  },
];

module.exports = { validarMateria };