const { check } = require("express-validator");

exports.createPeriodoValidator = [
  check("periodo").notEmpty().withMessage("Periodo obligatorio"),
  check("fecha_inicio").notEmpty().withMessage("Fecha inicio obligatoria"),
  check("fecha_fin").notEmpty().withMessage("Fecha fin obligatoria"),
  check("fecha_limite_calif")
    .notEmpty()
    .withMessage("Fecha límite obligatoria"),
];

exports.updatePeriodoValidator = [
  check("fecha_inicio").optional(),
  check("fecha_fin").optional(),
  check("fecha_limite_calif").optional(),
];