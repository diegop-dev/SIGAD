const validatePeriodo = (req, res, next) => {

  const { codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif } = req.body;

  if (!codigo || !anio || !fecha_inicio || !fecha_fin || !fecha_limite_calif) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const inicio = new Date(fecha_inicio);
  const fin = new Date(fecha_fin);
  const limite = new Date(fecha_limite_calif);

  // inicio no puede ser antes de hoy
  if (inicio < hoy) {
    return res.status(400).json({
      error: "La fecha de inicio no puede ser anterior al día actual"
    });
  }

  // fin no puede ser antes de inicio
  if (fin < inicio) {
    return res.status(400).json({
      error: "La fecha de fin no puede ser anterior a la fecha de inicio"
    });
  }

  // limite no puede ser despues de fin
  if (limite > fin) {
    return res.status(400).json({
      error: "La fecha límite de calificaciones no puede ser posterior a la fecha de fin"
    });
  }

  next();
};

module.exports = { validatePeriodo };