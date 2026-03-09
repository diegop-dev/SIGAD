const carreraModel = require('../models/carreraModel');

const carreraController = {

  getAcademiasDisponibles: async (req, res) => {
    try {
      const academias = await carreraModel.getAcademiasActivas();
      return res.status(200).json({
        success: true,
        data: academias
      });
    } catch (error) {
      console.error('Error al obtener academias:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al obtener la lista de academias'
      });
    }
  },
  
  // método para consumo interno del frontend de SIGAD
  getCarreras: async (req, res) => {
    try {
      const carreras = await carreraModel.getAllCarreras();
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener carreras' 
      });
    }
  },

  // método exclusivo para la API de sincronización externa (HU-37 / API-01)
  getCarrerasParaSincronizacion: async (req, res) => {
    try {
      // invocamos la consulta optimizada que proyecta únicamente id_carrera y nombre_carrera
      const carreras = await carreraModel.getCarrerasParaSincronizacion();
      
      // retornamos directamente el arreglo para cumplir el contrato JSON del sistema externo
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error en API de sincronización de carreras:', error);
      // retornamos HTTP 500 sin exponer detalles sensibles de la base de datos
      return res.status(500).json({ 
        message: 'Error interno al procesar el catálogo de carreras' 
      });
    }
  },

  crearCarrera: async (req, res) => {
    try {
      const { codigo_unico, nombre_carrera, modalidad, academia_id } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : req.body.creado_por;

      const carreraExistente = await carreraModel.findExistingCarrera(nombre_carrera);
      
      if (carreraExistente) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una carrera registrada con ese nombre exacto.'
        });
      }

      const datosNuevaCarrera = {
        codigo_unico: codigo_unico.toUpperCase(),
        nombre_carrera,
        modalidad,
        academia_id,
        creado_por
      };

      const resultado = await carreraModel.crearCarrera(datosNuevaCarrera);

      return res.status(201).json({
        success: true,
        message: 'La carrera se ha registrado correctamente.',
        data: {
          id_carrera: Number(resultado.insertId), 
          codigo_unico: datosNuevaCarrera.codigo_unico,
          nombre_carrera,
          modalidad,
          academia_id
        }
      });

    } catch (error) {
      console.error('Error al crear la carrera:', error);
      return res.status(500).json({
        success: false,
        message: 'Ocurrió un error en el servidor al intentar guardar la carrera.',
        error: error.message
      });
    }
  }
};

module.exports = carreraController;