const carreraModel = require('../models/carreraModel');
const grupoModel = require('../models/grupoModel');

// MODIFICADO: Ahora recibe nivel_academico para inyectar la 'L' o 'M'
const generarSiglas = async (nombreCarrera, modalidad, nivel_academico = 'LICENCIATURA', excluir_id = null) => {
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

  // Determinar sufijo por nivel académico (L = Licenciatura, M = Maestría)
  const sufijoNivel = nivel_academico.toUpperCase() === 'MAESTRIA' ? 'M' : 'L';

  // Determinar sufijo por modalidad
  let sufijoModalidad = '';
  if (modalidad === 'EJECUTIVA') sufijoModalidad = 'E';
  if (modalidad === 'HÍBRIDA') sufijoModalidad = 'H';

  // Unimos todo: Ej. DER (Derecho) + L (Licenciatura) + E (Ejecutiva) = DERLE
  let siglas = baseSiglas + sufijoNivel + sufijoModalidad;

  const existe = await carreraModel.verificarSiglasExistentes(siglas, excluir_id);

  if (existe) {
    // Plan B en caso de colisión
    if (palabrasValidas.length === 1) {
      // Si era de 1 palabra, extendemos a 4 letras (ej. DERE)
      baseSiglas = palabrasValidas[0].substring(0, 4);
    } else {
      // Si era de varias, tomamos las 2 primeras letras de cada una
      baseSiglas = palabrasValidas.map(p => p.substring(0, 2)).join('').substring(0, 4);
    }
    siglas = baseSiglas + sufijoNivel + sufijoModalidad;
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
      const { nombre_carrera, modalidad, academia_id, nivel_academico } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : req.body.creado_por;

      // Aseguramos un valor por defecto si no lo envían
      const nivelSeguro = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';

      // 1. Verificamos duplicidad tomando en cuenta el nivel académico
      const carreraExistente = await carreraModel.findExistingCarrera(nombre_carrera, modalidad, nivelSeguro);
      
      if (carreraExistente) {
        return res.status(409).json({
          success: false,
          message: `Ya existe esta ${nivelSeguro.toLowerCase()} registrada en la misma modalidad.`
        });
      }

      // 2. Generamos el código único incluyendo el nivel
      const codigo_unico = await generarSiglas(nombre_carrera, modalidad, nivelSeguro);

      const datosNuevaCarrera = {
        codigo_unico, 
        nombre_carrera: nombre_carrera.toUpperCase().trim(),
        modalidad,
        academia_id,
        nivel_academico: nivelSeguro, // <-- Nuevo campo
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
          nivel_academico: nivelSeguro,
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
  },

  // FUNCIONES PARA MODIFICAR Y ELIMINAR 
  actualizarCarrera: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_carrera, modalidad, academia_id, nivel_academico, modificado_por } = req.body;
      const idUsuario = req.usuario ? req.usuario.id_usuario : modificado_por;

      const nivelSeguro = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';

      // 1. Evitar colisión de nombre, modalidad y nivel en la DB (Ignorando la propia carrera)
      const carreraExistente = await carreraModel.findExistingCarrera(nombre_carrera, modalidad, nivelSeguro);
      if (carreraExistente && carreraExistente.id_carrera !== Number(id)) {
        return res.status(409).json({
          success: false,
          message: `Ya existe otra ${nivelSeguro.toLowerCase()} registrada en la misma modalidad con ese nombre.`
        });
      }

      // 2. Generamos las siglas ignorando el ID actual e incluyendo el nivel académico
      const codigo_unico = await generarSiglas(nombre_carrera, modalidad, nivelSeguro, id);

      const datosUpdate = {
        codigo_unico,
        nombre_carrera: nombre_carrera.toUpperCase().trim(),
        modalidad,
        academia_id,
        nivel_academico: nivelSeguro, // <-- Nuevo campo
        modificado_por: idUsuario
      };

      await carreraModel.actualizarCarrera(id, datosUpdate);

      // 3. EFECTO CASCADA: Actualizar el identificador de todos los grupos vinculados
      const grupos = await grupoModel.getGruposByCarrera(id);
      if (grupos && grupos.length > 0) {
        for (const grupo of grupos) {
          // Extraemos los 4 primeros dígitos que representan el año
          const anio = grupo.identificador.substring(0, 4);
          // Rellenamos el ID con ceros
          const idFormateado = String(grupo.id_grupo).padStart(3, '0');
          
          // Armamos el nuevo identificador
          const nuevoIdentificador = `${anio}${codigo_unico}${idFormateado}`;

          if (grupo.identificador !== nuevoIdentificador) {
            await grupoModel.actualizarIdentificador(grupo.id_grupo, nuevoIdentificador);
          }
        }
      }

      return res.status(200).json({
        success: true,
        message: 'La carrera y sus grupos vinculados se han actualizado correctamente.'
      });
    } catch (error) {
      console.error('Error al actualizar la carrera:', error);
      return res.status(500).json({
        success: false,
        message: 'Ocurrió un error en el servidor al intentar actualizar la carrera.',
        error: error.message
      });
    }
  },

  deactivateCarrera: async (req, res) => {
    try {
      const { id } = req.params;
      const { eliminado_por, motivo_baja } = req.body;

      if (!motivo_baja || motivo_baja.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'Debe especificar un motivo para la baja.' 
        });
      }

      const result = await carreraModel.deactivateCarrera(id, eliminado_por, motivo_baja);

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Carrera no encontrada. No se pudo cambiar el estatus.' 
        });
      }

      return res.status(200).json({ 
        success: true, 
        message: 'Carrera dada de baja exitosamente del sistema.' 
      });

    } catch (error) {
      console.error("Error al dar de baja la carrera:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor al procesar la baja de la carrera." 
      });
    }
  }
};

module.exports = carreraController;