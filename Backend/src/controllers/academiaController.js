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
    await Academia.registrar(req.body);
    res.status(201).json({ message: "Éxito" });
  } catch (error) {
    console.error("Error real al registrar:", error);
    res.status(500).json({ error: error.message });
  }
};