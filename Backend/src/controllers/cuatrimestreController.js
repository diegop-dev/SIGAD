const cuatrimestreModel = require('../models/cuatrimestreModel');

const cuatrimestreController = {
  
  getCuatrimestres: async (req, res) => {
    try {
      // delegamos la consulta al modelo para mantener la capa de red limpia
      const cuatrimestres = await cuatrimestreModel.getCuatrimestres();
      
      // el arreglo se retorna directamente para satisfacer la API-02
      return res.status(200).json(cuatrimestres);
    } catch (error) {
      console.error("[Error getCuatrimestres]:", error);
      // retornamos HTTP 500 ocultando la traza original por seguridad
      return res.status(500).json({ 
        message: "Error interno al procesar el catálogo de cuatrimestres" 
      });
    }
  }
};

module.exports = cuatrimestreController;