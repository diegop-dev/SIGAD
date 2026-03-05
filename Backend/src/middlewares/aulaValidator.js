const validarActualizacionAula = (req, res, next) => {
  const { nombre, tipo, capacidad, ubicacion, estatus } = req.body;
  const errores = [];

  
  if (!nombre || nombre.trim().length < 3) {
    errores.push("El nombre debe tener al menos 3 caracteres.");
  }
  if (!['AULA', 'LABORATORIO'].includes(tipo)) {
    errores.push("El tipo debe ser AULA o LABORATORIO.");
  }
  if (!capacidad || isNaN(capacidad) || capacidad <= 0 || capacidad > 200) {
    errores.push("La capacidad debe ser un número entero válido (entre 1 y 200).");
  }
  if (!['ACTIVO', 'INACTIVO', 'MANTENIMIENTO'].includes(estatus)) {
    errores.push("El estatus proporcionado no es válido.");
  }

  if (errores.length > 0) {
    return res.status(400).json({ message: "Errores de validación", errores });
  }

  next();
};

module.exports = { validarActualizacionAula };