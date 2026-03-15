const carreraModel = require('../models/carreraModel');

const generarSiglas = async (nombreCarrera, modalidad) => {
  const palabrasIgnoradas = ["DE", "LA", "DEL", "Y", "EN", "EL", "LOS", "LAS"];
  
  const nombreLimpio = nombreCarrera.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const palabras = nombreLimpio.split(/\s+/);
  const palabrasValidas = palabras.filter(palabra => !palabrasIgnoradas.includes(palabra));

  let baseSiglas = "";

  // Si la carrera es de una sola palabra (ej. "Derecho") tomamos 3 letras
  if (palabrasValidas.length === 1) {
    baseSiglas = palabrasValidas[0].substring(0, 3);
  } else {
    // Si tiene más palabras, tomamos la inicial de cada una (máximo 4)
    baseSiglas = palabrasValidas.map(p => p[0]).join('').substring(0, 4);
  }

  // Determinar sufijo por modalidad
  let sufijo = '';
  if (modalidad === 'EJECUTIVA') sufijo = 'E';
  if (modalidad === 'HÍBRIDA') sufijo = 'H';

  let siglas = baseSiglas + sufijo;

  const existe = await carreraModel.verificarSiglasExistentes(siglas);

  if (existe) {
    // Plan B en caso de colisión
    if (palabrasValidas.length === 1) {
      // Si era de 1 palabra, extendemos a 4 letras (ej. DERE)
      baseSiglas = palabrasValidas[0].substring(0, 4);
    } else {
      // Si era de varias, tomamos las 2 primeras letras de cada una
      baseSiglas = palabrasValidas.map(p => p.substring(0, 2)).join('').substring(0, 4);
    }
    siglas = baseSiglas + sufijo;
  }

  return siglas;
};

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
  
  // ==========================================
  // SE ACTUALIZÓ PARA RECIBIR periodo_id (HU-41)
  // ==========================================
  getCarreras: async (req, res) => {
    try {
      const { periodo_id } = req.query; // Extraemos el parámetro de la URL si existe
      
      // Se lo pasamos al modelo. Si viene vacío (null), el modelo traerá todas las carreras
      const carreras = await carreraModel.getAllCarreras(periodo_id); 
      
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener carreras' 
      });
    }
  },

  getCarrerasParaSincronizacion: async (req, res) => {
    try {
      const carreras = await carreraModel.getCarrerasParaSincronizacion();
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error en API de sincronización de carreras:', error);
      return res.status(500).json({ 
        message: 'Error interno al procesar el catálogo de carreras' 
      });
    }
  },

  crearCarrera: async (req, res) => {
    try {
      const { nombre_carrera, modalidad, academia_id } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : req.body.creado_por;

      const carreraExistente = await carreraModel.findExistingCarrera(nombre_carrera, modalidad);
      
      if (carreraExistente) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe esta carrera registrada en la misma modalidad.'
        });
      }

      const codigo_unico = await generarSiglas(nombre_carrera, modalidad);

      const datosNuevaCarrera = {
        codigo_unico, 
        nombre_carrera: nombre_carrera.toUpperCase().trim(),
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
          nombre_carrera: datosNuevaCarrera.nombre_carrera,
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