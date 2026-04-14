const cuatrimestreModel = require('../models/cuatrimestreModel');

const cuatrimestreController = {

  obtenerCuatrimestresActivos: async (req, res) => {
    try {
      const cuatrimestres = await cuatrimestreModel.obtenerCuatrimestresActivos();
      return res.status(200).json(cuatrimestres);
    } catch (error) {
      console.error("[Error obtenerCuatrimestresActivos]:", error);
      return res.status(500).json({
        message: "Error interno al procesar el catálogo de cuatrimestres"
      });
    }
  },

  // ─── EP-03 SESA: GET /cuatrimestres/catalogo ──────────────────────────────────────────
  ObtenerCuatrimestres: async (req, res) => {
    try {
      const cuatrimestres = await cuatrimestreModel.ObtenerCuatrimestres();
      res.status(200).json(cuatrimestres);
    } catch (error) {
      console.error("[Error ObtenerCuatrimestres]:", error);
      res.status(500).json({
        error: "Error al consultar el catálogo de cuatrimestres"
      });
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
};

module.exports = cuatrimestreController;