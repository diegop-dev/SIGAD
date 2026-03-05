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
    const { id } = req.query;
    const existe = await Academia.validarNombre(nombre, id);
    res.json({ existe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAcademia = async (req, res) => {
  try {
    await Academia.registrar(req.body);
    res.status(201).json({ message: "Éxito" });
  } catch (error) {
    console.error("Error real al registrar:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 ACTUALIZAR
exports.updateAcademia = async (req, res) => {
  try {
    const { id } = req.params;

    // 🔥 temporal mientras no haya auth
    const modificado_por = 1; 

    const data = {
      ...req.body,
      modificado_por
    };

    await Academia.actualizar(id, data);

    res.json({ message: "Academia actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🔹 CAMBIAR ESTATUS (INACTIVAR / ACTIVAR)
exports.updateEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estatus } = req.body;

    // 🔥 temporal mientras no haya auth
    const modificado_por = 1;

    await Academia.cambiarEstatus(id, estatus, modificado_por);

    res.json({ message: "Estatus actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar estatus:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAcademiasCliente = async (req, res) => {
  try {
    const academias = await Academia.getAcademiasActivasCliente();
    res.json(academias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAcademias = async (req, res) => {
  try {
    const academias = await Academia.getAcademias();
    res.json(academias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};