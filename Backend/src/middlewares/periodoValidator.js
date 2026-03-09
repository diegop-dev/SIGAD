const validatePeriodo = (req, res, next) => {
  const { codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif } = req.body;

  if (!codigo || !anio || !fecha_inicio || !fecha_fin || !fecha_limite_calif) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const limite = new Date(fecha_limite_calif);

  // la validación de "inicio < hoy" fue removida para permitir registros retroactivos

  // la fecha de fin no puede ser antes de la fecha de inicio
  if (fin < inicio) {
    return res.status(400).json({
      error: "La fecha de fin no puede ser anterior a la fecha de inicio"
    });
  }

  // la fecha límite de calificaciones debe estar contenida o ser igual a la fecha de fin
  if (limite > fin) {
    return res.status(400).json({
      error: "La fecha límite de calificaciones no puede ser posterior a la fecha de fin"
    });
  }

  next();
};

module.exports = { validatePeriodo };