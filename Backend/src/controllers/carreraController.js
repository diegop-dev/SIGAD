const carreraModel = require('../models/carreraModel');
const grupoModel = require('../models/grupoModel');

const generarSiglas = async (nombreCarrera, modalidad, nivel_academico = 'LICENCIATURA', excluir_id = null) => {
  const palabrasIgnoradas = ["DE", "LA", "DEL", "Y", "EN", "EL", "LOS", "LAS"];
  
  const nombreLimpio = nombreCarrera.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const palabras = nombreLimpio.split(/\s+/);
  const palabrasValidas = palabras.filter(palabra => !palabrasIgnoradas.includes(palabra));

  let baseSiglas = "";
  if (palabrasValidas.length === 1) {
    baseSiglas = palabrasValidas[0].substring(0, 3);
  } else {
    baseSiglas = palabrasValidas.map(p => p[0]).join('').substring(0, 4);
  }

  const sufijoNivel = nivel_academico.toUpperCase() === 'MAESTRIA' ? 'M' : 'L';

  let sufijoModalidad = '';
  if (modalidad === 'EJECUTIVA') sufijoModalidad = 'E';
  if (modalidad === 'HÍBRIDA')   sufijoModalidad = 'H';

  let siglas = baseSiglas + sufijoNivel + sufijoModalidad;

  const existe = await carreraModel.verificarSiglasExistentes(siglas, excluir_id);
  if (existe) {
    if (palabrasValidas.length === 1) {
      baseSiglas = palabrasValidas[0].substring(0, 4);
    } else {
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
      return res.status(200).json({ success: true, data: academias });
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
      const { periodo_id } = req.query;
      const carreras = await carreraModel.getAllCarreras(periodo_id);
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener carreras' });
    }
  },

  getCarrerasParaSincronizacion: async (req, res) => {
    try {
      const carreras = await carreraModel.getCarrerasParaSincronizacion();
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error en API de sincronización de carreras:', error);
      return res.status(500).json({ message: 'Error interno al procesar el catálogo de carreras' });
    }
  },

  crearCarrera: async (req, res) => {
    try {
      const { nombre_carrera, modalidad, academia_id, nivel_academico } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : req.body.creado_por;
      const nivelSeguro = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';

      const carreraExistente = await carreraModel.findExistingCarrera(nombre_carrera, modalidad, nivelSeguro);
      if (carreraExistente) {
        return res.status(409).json({
          success: false,
          message: `Ya existe esta ${nivelSeguro.toLowerCase()} registrada en la misma modalidad.`
        });
      }

      const codigo_unico = await generarSiglas(nombre_carrera, modalidad, nivelSeguro);
      const datosNuevaCarrera = {
        codigo_unico,
        nombre_carrera: nombre_carrera.toUpperCase().trim(),
        modalidad,
        academia_id,
        nivel_academico: nivelSeguro,
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

  actualizarCarrera: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_carrera, modalidad, academia_id, nivel_academico, modificado_por } = req.body;
      const idUsuario = req.usuario ? req.usuario.id_usuario : modificado_por;
      const nivelSeguro = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';

      const carreraExistente = await carreraModel.findExistingCarrera(nombre_carrera, modalidad, nivelSeguro);
      if (carreraExistente && carreraExistente.id_carrera !== Number(id)) {
        return res.status(409).json({
          success: false,
          message: `Ya existe otra ${nivelSeguro.toLowerCase()} registrada en la misma modalidad con ese nombre.`
        });
      }

      const codigo_unico = await generarSiglas(nombre_carrera, modalidad, nivelSeguro, id);
      const datosUpdate = {
        codigo_unico,
        nombre_carrera: nombre_carrera.toUpperCase().trim(),
        modalidad,
        academia_id,
        nivel_academico: nivelSeguro,
        modificado_por: idUsuario
      };

      await carreraModel.actualizarCarrera(id, datosUpdate);

      const grupos = await grupoModel.getGruposByCarrera(id);
      if (grupos && grupos.length > 0) {
        for (const grupo of grupos) {
          const anio = grupo.identificador.substring(0, 4);
          const idFormateado = String(grupo.id_grupo).padStart(3, '0');
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
        return res.status(400).json({ success: false, message: 'Debe especificar un motivo para la baja.' });
      }

      const result = await carreraModel.deactivateCarrera(id, eliminado_por, motivo_baja);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Carrera no encontrada. No se pudo cambiar el estatus.' });
      }

      return res.status(200).json({ success: true, message: 'Carrera dada de baja exitosamente del sistema.' });
    } catch (error) {
      console.error("Error al dar de baja la carrera:", error);
      return res.status(500).json({ success: false, message: "Error interno del servidor al procesar la baja de la carrera." });
    }
  },

  // ─── EP-02 SESA: GET /programas_academicos ───────────────────────────────────
  ObtenerProgramasAcademicos: async (req, res) => {
    try {
      const programas = await carreraModel.ObtenerProgramasAcademicos();
      res.status(200).json(programas);
    } catch (error) {
      console.error("[Error ObtenerProgramasAcademicos]:", error);
      res.status(500).json({ error: "Error al consultar los programas académicos" });
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
};

module.exports = carreraController;