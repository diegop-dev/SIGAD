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
  
  getCarreras: async (req, res) => {
    try {
      const carreras = await carreraModel.getAllCarreras();
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener carreras' });
    }
  },

  crearCarrera: async (req, res) => {
    try {
      // 1. Extraemos los datos que envía el frontend (React)
      const { nombre_carrera, academia_id } = req.body;

      // Extraemos el ID del usuario que está realizando la acción.
      // Lo ideal es que esto venga del token de autenticación (ej. req.usuario.id_usuario).
      // Si temporalmente lo mandan desde el frontend, usaríamos req.body.creado_por.
      const creado_por = req.usuario ? req.usuario.id_usuario : req.body.creado_por;

      // 2. Validar que la carrera no exista previamente
      const carreraExistente = await carreraModel.findExistingCarrera(nombre_carrera);
      
      if (carreraExistente) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una carrera registrada con ese nombre exacto.'
        });
      }

      // 3. Preparar el objeto de datos para el modelo
      const datosNuevaCarrera = {
        nombre_carrera,
        academia_id,
        creado_por
      };

      // 4. Llamar al modelo para insertar el registro en MariaDB
      const resultado = await carreraModel.crearCarrera(datosNuevaCarrera);

      // 5. Responder al frontend confirmando el éxito de la operación
      return res.status(201).json({
        success: true,
        message: 'La carrera se ha registrado correctamente.',
        data: {
          id_carrera: Number(resultado.insertId), 
          nombre_carrera,
          academia_id
        }
      });

    } catch (error) {
      console.error('Error al crear la carrera:', error);
      
      // Respuesta en caso de que la base de datos o el servidor fallen
      return res.status(500).json({
        success: false,
        message: 'Ocurrió un error en el servidor al intentar guardar la carrera.',
        error: error.message
      });
    }
  }
};



module.exports = carreraController;