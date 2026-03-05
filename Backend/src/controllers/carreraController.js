const carreraModel = require("../models/carreraModel");

const getCarreras = async (req, res) => {
  try {
    const carreras = await carreraModel.getAllCarreras();
    res.status(200).json(carreras);
  } catch (error) {
    console.error("[Error getCarreras]:", error);
    res.status(500).json({ error: "Error al consultar carreras." });
  }
};

module.exports = { getCarreras };
