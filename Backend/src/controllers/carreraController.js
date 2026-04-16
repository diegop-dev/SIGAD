const carreraModel = require('../models/carreraModel');
const grupoModel = require('../models/grupoModel');
const assignmentModel = require('../models/assignmentModel');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const generarSiglas = async (nombreCarrera, modalidad, nivel_academico = 'LICENCIATURA', excluir_id = null) => {
  const palabrasIgnoradas = ['DE', 'LA', 'DEL', 'Y', 'EN', 'EL', 'LOS', 'LAS'];

  const nombreLimpio = nombreCarrera.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const palabras = nombreLimpio.split(/\s+/);
  const palabrasValidas = palabras.filter(palabra => !palabrasIgnoradas.includes(palabra));

  let baseSiglas = '';
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

/* ─────────────────────────────────────────────────── */

const carreraController = {

  obtenerAcademiasDisponibles: async (req, res) => {
    try {
      const academias = await carreraModel.obtenerAcademiasActivas();
      return res.status(200).json({ success: true, data: academias });
    } catch (error) {
      console.error('Error al obtener academias:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener la lista de academias' });
    }
  },

  obtenerCarreras: async (req, res) => {
    try {
      const { periodo_id } = req.query;
      const carreras = await carreraModel.obtenerTodasLasCarreras(periodo_id);
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error al obtener carreras:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener carreras' });
    }
  },

  obtenerCarrerasParaSincronizacion: async (req, res) => {
    try {
      const carreras = await carreraModel.obtenerCarrerasParaSincronizacion();
      return res.status(200).json(carreras);
    } catch (error) {
      console.error('Error en API de sincronización de carreras:', error);
      return res.status(500).json({ message: 'Error interno al procesar el catálogo de carreras' });
    }
  },

  crearCarrera: async (req, res) => {
    try {
      const { nombre_carrera, modalidad, academia_id, nivel_academico } = req.body;
      // ← fix: req.usuario → req.user
      const creado_por  = req.user?.id_usuario;
      const nivelSeguro = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';

      const carreraExistente = await carreraModel.encontrarCarreraExistente(nombre_carrera, modalidad, nivelSeguro);
      if (carreraExistente) {
        return res.status(409).json({
          success: false,
          message: `Ya existe esta ${nivelSeguro.toLowerCase()} registrada en la misma modalidad.`,
        });
      }

      const codigo_unico = await generarSiglas(nombre_carrera, modalidad, nivelSeguro);
      const datosNuevaCarrera = {
        codigo_unico,
        nombre_carrera: nombre_carrera.toUpperCase().trim(),
        modalidad,
        academia_id,
        nivel_academico: nivelSeguro,
        creado_por,
      };

      const resultado = await carreraModel.crearCarrera(datosNuevaCarrera);

      logAudit({
        modulo:            'CARRERAS',
        accion:            'CREACION',
        registro_afectado: `Carrera "${datosNuevaCarrera.nombre_carrera}" #${Number(resultado.insertId)}`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      return res.status(201).json({
        success: true,
        message: 'La carrera se ha registrado correctamente.',
        data: {
          id_carrera:     Number(resultado.insertId),
          codigo_unico:   datosNuevaCarrera.codigo_unico,
          nombre_carrera: datosNuevaCarrera.nombre_carrera,
          modalidad,
          nivel_academico: nivelSeguro,
          academia_id,
        },
      });
    } catch (error) {
      console.error('Error al crear la carrera:', error);
      return res.status(500).json({
        success: false,
        message: 'Ocurrió un error en el servidor al intentar guardar la carrera.',
        error: error.message,
      });
    }
  },

  actualizarCarrera: async (req, res) => {
    try {
      const { id } = req.params;
      const { nombre_carrera, modalidad, academia_id, nivel_academico, confirmar_rechazo } = req.body;
      // ← fix: req.usuario → req.user
      const idUsuario   = req.user?.id_usuario;
      const nivelSeguro = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';

      const carreraActual = await carreraModel.obtenerCarreraPorId(id);
      if (!carreraActual) {
        return res.status(404).json({ success: false, message: 'Carrera no encontrada.' });
      }

      const intentoCambioEstructural =
        (nivelSeguro          !== carreraActual.nivel_academico) ||
        (modalidad            !== carreraActual.modalidad)       ||
        (Number(academia_id)  !== Number(carreraActual.academia_id));

      if (intentoCambioEstructural) {
        const tieneAceptadas = await carreraModel.verificarDependenciasActivas(id);
        if (tieneAceptadas) {
          return res.status(409).json({
            success: false,
            action:  'BLOCK',
            error:   'Conflicto de integridad relacional',
            detalles: 'No es posible modificar el nivel, modalidad o academia porque este programa cuenta con clases ACEPTADAS vigentes.',
          });
        }

        const asignaciones  = await assignmentModel.obtenerTodasLasAsignaciones({ carrera_id: id });
        const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

        if (tieneEnviadas && !confirmar_rechazo) {
          return res.status(409).json({
            success: false,
            action:  'WARN',
            error:   'Advertencia de asignaciones pendientes',
            detalles: 'Modificar la estructura de esta carrera rechazará automáticamente asignaciones ENVIADAS a docentes. ¿Deseas continuar?',
          });
        }
        if (tieneEnviadas && confirmar_rechazo) {
          await assignmentModel.rechazarAsignacionesPorCarrera(id, idUsuario);
        }
      }

      const carreraExistente = await carreraModel.encontrarCarreraExistente(nombre_carrera, modalidad, nivelSeguro);
      if (carreraExistente && carreraExistente.id_carrera !== Number(id)) {
        return res.status(409).json({
          success: false,
          message: `Ya existe otra ${nivelSeguro.toLowerCase()} registrada en la misma modalidad con ese nombre.`,
        });
      }

      const codigo_unico   = await generarSiglas(nombre_carrera, modalidad, nivelSeguro, id);
      const datosActualizar = {
        codigo_unico,
        nombre_carrera:  nombre_carrera.toUpperCase().trim(),
        modalidad,
        academia_id,
        nivel_academico: nivelSeguro,
        modificado_por:  idUsuario,  // ← fix
      };

      await carreraModel.actualizarCarrera(id, datosActualizar);

      // Actualización en cascada de identificadores de grupo
      const grupos = await grupoModel.obtenerGruposPorCarrera(id);
      if (grupos && grupos.length > 0) {
        for (const grupo of grupos) {
          const anio           = grupo.identificador.substring(0, 4);
          const idFormateado   = String(grupo.id_grupo).padStart(3, '0');
          const nuevoIdentificador = `${anio}${codigo_unico}${idFormateado}`;
          if (grupo.identificador !== nuevoIdentificador) {
            await grupoModel.actualizarIdentificador(grupo.id_grupo, nuevoIdentificador);
          }
        }
      }

      logAudit({
        modulo:            'CARRERAS',
        accion:            'MODIFICACION',
        registro_afectado: `Carrera "${carreraActual.nombre_carrera}" #${id}`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      return res.status(200).json({ success: true, message: 'La carrera se ha actualizado correctamente.' });
    } catch (error) {
      console.error('Error al actualizar la carrera:', error);
      return res.status(500).json({ success: false, message: 'Error interno.' });
    }
  },

  desactivarCarrera: async (req, res) => {
    try {
      const { id } = req.params;
      const { motivo_baja, confirmar_rechazo } = req.body;
      // ← fix: eliminado_por del token, no del body
      const eliminado_por = req.user?.id_usuario;

      if (!motivo_baja || motivo_baja.trim() === '') {
        return res.status(400).json({ success: false, message: 'Debe especificar un motivo para la baja.' });
      }

      const tieneAceptadas = await carreraModel.verificarDependenciasActivas(id);
      if (tieneAceptadas) {
        return res.status(409).json({
          success: false,
          action:  'BLOCK',
          error:   'Conflicto de integridad relacional',
          detalles: 'No es posible desactivar este programa porque cuenta con clases ACEPTADAS impartiéndose. Debe liberar la carga horaria primero.',
        });
      }

      const asignaciones  = await assignmentModel.obtenerTodasLasAsignaciones({ carrera_id: id });
      const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

      if (tieneEnviadas && !confirmar_rechazo) {
        return res.status(409).json({
          success: false,
          action:  'WARN',
          error:   'Advertencia de asignaciones pendientes',
          detalles: 'Darlo de baja rechazará automáticamente las asignaciones ENVIADAS vinculadas a este programa. ¿Deseas continuar?',
        });
      }
      if (tieneEnviadas && confirmar_rechazo) {
        await assignmentModel.rechazarAsignacionesPorCarrera(id, eliminado_por);
      }

      const carreraActual = await carreraModel.obtenerCarreraPorId(id);
      const result        = await carreraModel.desactivarCarrera(id, eliminado_por);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Carrera no encontrada.' });
      }

      logAudit({
        modulo:            'CARRERAS',
        accion:            'BAJA',
        registro_afectado: `Carrera "${carreraActual?.nombre_carrera}" #${id}`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      return res.status(200).json({ success: true, message: 'Carrera dada de baja exitosamente.' });
    } catch (error) {
      console.error('Error al dar de baja la carrera:', error);
      return res.status(500).json({ success: false, message: 'Error interno al procesar la baja.' });
    }
  },

  activarCarrera: async (req, res) => {
    try {
      const { id } = req.params;
      // ← fix: modificado_por del token, no del body
      const modificado_por = req.user?.id_usuario;

      const carreraActual = await carreraModel.obtenerCarreraPorId(id);
      const result        = await carreraModel.activarCarrera(id, modificado_por);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Carrera no encontrada.' });
      }

      logAudit({
        modulo:            'CARRERAS',
        accion:            'MODIFICACION',
        registro_afectado: `Carrera "${carreraActual?.nombre_carrera}" #${id} — reactivada`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      return res.status(200).json({ success: true, message: 'Carrera reactivada exitosamente.' });
    } catch (error) {
      console.error('Error al reactivar:', error);
      return res.status(500).json({ success: false, message: 'Error interno al reactivar.' });
    }
  },

  // ─── EP-02 SESA: público, sin auditoría ──────────────────────────────────
  obtenerProgramasAcademicos: async (req, res) => {
    try {
      const programas = await carreraModel.obtenerProgramasAcademicos();
      res.status(200).json(programas);
    } catch (error) {
      console.error('[Error ObtenerProgramasAcademicos]:', error);
      res.status(500).json({ error: 'Error al consultar los programas académicos' });
    }
  },
};

module.exports = carreraController;