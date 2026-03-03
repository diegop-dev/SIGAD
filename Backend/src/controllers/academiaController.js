const Academia = require('../models/academiaModels');

exports.getCoordinadores = async (req, res) => {
  try {
    const results = await Academia.getCoordinadoresDisponibles();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    const existe = await Academia.validarNombre(nombre);
    res.json({ existe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAcademia = async (req, res) => {
  
  try {
     
    //  Solo Superadministrador puede crear
    if (req.user.rol_id !== 1) {
      return res.status(403).json({
        error: "No tiene permisos para crear academias."
      });
    }

    const {nombre, descripcion, estado, municipio, codigo_postal, direccion,
      coordinador_id
    } = req.body;

    if (!nombre || !estado || !municipio || !codigo_postal || !direccion || !coordinador_id) {
      return res.status(400).json({
        error: "Campos obligatorios incompletos."
      });
    }

    // Validar nombre único
    const nombreExiste = await Academia.validarNombre(nombre);
    if (nombreExiste) {
      return res.status(400).json({
        error: "El nombre ya existe."
      });
    }

    // Validar coordinador disponible
    const coordinadorOcupado = await Academia.coordinadorOcupado(coordinador_id);
    if (coordinadorOcupado) {
      return res.status(400).json({
        error: "El coordinador ya está asignado a otra academia."
      });
    }

    await Academia.registrar({
        nombre,
      descripcion,
      estado,
      municipio,
      codigo_postal,
      direccion,
      coordinador_id,
      creado_por: req.user.id_usuario
    });

    res.status(201).json({
      message: "Academia registrada correctamente."
    });

  } catch (error) {
    console.error("Error real al registrar:", error);
    res.status(500).json({
      error: "Error interno del servidor."
    });
  }
};
