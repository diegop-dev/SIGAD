const grupoModel = require('../models/grupoModel');
const carreraModel = require('../models/carreraModel');
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

const grupoController = {

  obtenerGruposParaSincronizacion: async (req, res) => {
    try {
      const { carrera_id, cuatrimestre_id } = req.query;
      if (!carrera_id || !cuatrimestre_id) {
        return res.status(400).json({
          message: 'Parámetros incompletos. Se requiere carrera_id y cuatrimestre_id.',
        });
      }
      const grupos = await grupoModel.obtenerGruposParaSincronizacion(carrera_id, cuatrimestre_id);
      return res.status(200).json(grupos);
    } catch (error) {
      console.error('[Error obtenerGruposParaSincronizacion]:', error);
      return res.status(500).json({ message: 'Error interno al procesar el catálogo de grupos.' });
    }
  },

  obtenerTodosLosGrupos: async (req, res) => {
    try {
      const grupos = await grupoModel.obtenerTodosLosGrupos();
      return res.status(200).json(grupos);
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener grupos' });
    }
  },

  crearGrupo: async (req, res) => {
    try {
      const { carrera_id, nivel_academico } = req.body;
      // ← fix: req.usuario → req.user
      const creado_por = req.user?.id_usuario;

      const carreraInfo = await carreraModel.obtenerCarreraPorId(carrera_id);
      const nivelSeguro = carreraInfo ? carreraInfo.nivel_academico : (nivel_academico || 'LICENCIATURA');

      const datosNuevoGrupo = {
        identificador:   'TEMP',
        carrera_id,
        cuatrimestre_id: 1,
        nivel_academico: nivelSeguro,
        creado_por,
      };

      const resultado        = await grupoModel.crearGrupo(datosNuevoGrupo);
      const nuevoId          = resultado.insertId;
      const codigo_unico     = carreraInfo ? carreraInfo.codigo_unico : 'XXXX';
      const anio             = new Date().getFullYear();
      const idFormateado     = String(nuevoId).padStart(3, '0');
      const identificadorFinal = `${anio}${codigo_unico}${idFormateado}`;

      await grupoModel.actualizarIdentificador(nuevoId, identificadorFinal);

      logAudit({
        modulo:            'GRUPOS',
        accion:            'CREACION',
        registro_afectado: `Grupo "${identificadorFinal}" #${nuevoId} / Carrera #${carrera_id}`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      return res.status(201).json({
        success: true,
        message: 'Grupo registrado y autogenerado correctamente.',
        data: {
          id_grupo:        nuevoId,
          identificador:   identificadorFinal,
          carrera_id,
          nivel_academico: nivelSeguro,
          cuatrimestre_id: 1,
        },
      });
    } catch (error) {
      console.error('Error al crear grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al guardar grupo' });
    }
  },

  actualizarGrupo: async (req, res) => {
    const { id } = req.params;
    try {
      const { carrera_id, cuatrimestre_id, confirmar_rechazo, nivel_academico } = req.body;
      // ← fix: req.usuario → req.user
      const modificado_por = req.user?.id_usuario;

      const grupoExistente = await grupoModel.obtenerGrupoPorId(id);
      if (!grupoExistente) return res.status(404).json({ message: 'Grupo no encontrado' });

      let identificadorFinal = grupoExistente.identificador;
      const carreraInfo = await carreraModel.obtenerCarreraPorId(carrera_id);
      const nivelSeguro = carreraInfo ? carreraInfo.nivel_academico : (nivel_academico || 'LICENCIATURA');

      const intentoCambioEstructural =
        Number(grupoExistente.carrera_id)      !== Number(carrera_id)      ||
        Number(grupoExistente.cuatrimestre_id) !== Number(cuatrimestre_id) ||
        grupoExistente.nivel_academico         !== nivelSeguro;

      if (intentoCambioEstructural) {
        const tieneAsignacionesActivas = await grupoModel.verificarDependenciasActivas(id);
        if (tieneAsignacionesActivas) {
          return res.status(409).json({
            action:  'BLOCK',
            error:   'Conflicto de integridad relacional',
            detalles: 'Este grupo tiene clases en progreso (Aceptadas). No puedes cambiar su carrera, cuatrimestre o nivel académico hasta que liberes sus horarios en la gestión de asignaciones.',
          });
        }
      }

      if (Number(grupoExistente.carrera_id) !== Number(carrera_id)) {
        const asignaciones  = await assignmentModel.obtenerTodasLasAsignaciones({ grupo_id: id });
        const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

        if (tieneEnviadas && !confirmar_rechazo) {
          return res.status(409).json({
            action:  'WARN',
            error:   'Advertencia de asignaciones pendientes',
            detalles: 'Este grupo tiene asignaciones ENVIADAS pendientes. Cambiar la carrera rechazará automáticamente estas clases. ¿Deseas continuar?',
          });
        }
        if (tieneEnviadas && confirmar_rechazo) {
          await assignmentModel.rechazarAsignacionesPorGrupo(id, modificado_por);
        }

        const codigo_unico     = carreraInfo ? carreraInfo.codigo_unico : 'XXXX';
        const anio             = grupoExistente.identificador.substring(0, 4);
        const idFormateado     = String(id).padStart(3, '0');
        identificadorFinal     = `${anio}${codigo_unico}${idFormateado}`;
      }

      await grupoModel.actualizarGrupo(id, {
        identificador:   identificadorFinal,
        carrera_id,
        cuatrimestre_id: cuatrimestre_id || grupoExistente.cuatrimestre_id,
        nivel_academico: nivelSeguro,
        modificado_por,
      });

      logAudit({
        modulo:            'GRUPOS',
        accion:            'MODIFICACION',
        registro_afectado: `Grupo "${grupoExistente.identificador}" #${id}`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      return res.status(200).json({
        success:             true,
        message:             'Grupo actualizado correctamente.',
        nuevo_identificador: identificadorFinal,
      });
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al actualizar grupo' });
    }
  },

  desactivarGrupo: async (req, res) => {
    try {
      const { id } = req.params;
      const { confirmar_rechazo } = req.body;
      // ← fix: eliminado_por del token, no del body
      const eliminado_por = req.user?.id_usuario;

      if (!eliminado_por) return res.status(401).json({ error: 'No autorizado. Se requiere sesión activa.' });

      const tieneAceptadas = await grupoModel.verificarDependenciasActivas(id);
      if (tieneAceptadas) {
        return res.status(409).json({
          action:  'BLOCK',
          error:   'Conflicto de integridad relacional',
          detalles: 'Este grupo tiene clases ACEPTADAS vigentes. No puedes darlo de baja hasta que le reasignes o canceles sus clases en la gestión de asignaciones.',
        });
      }

      const asignaciones  = await assignmentModel.obtenerTodasLasAsignaciones({ grupo_id: id });
      const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

      if (tieneEnviadas && !confirmar_rechazo) {
        return res.status(409).json({
          action:  'WARN',
          error:   'Advertencia de asignaciones pendientes',
          detalles: 'Este grupo tiene asignaciones ENVIADAS pendientes de confirmación. Darlo de baja rechazará automáticamente estas clases. ¿Deseas continuar?',
        });
      }
      if (tieneEnviadas && confirmar_rechazo) {
        await assignmentModel.rechazarAsignacionesPorGrupo(id, eliminado_por);
      }

      // Recuperar identificador antes del UPDATE para el log
      const grupoActual  = await grupoModel.obtenerGrupoPorId(id);
      const affectedRows = await grupoModel.desactivarGrupo(id, eliminado_por);

      if (affectedRows === 0) return res.status(404).json({ error: 'Grupo no encontrado.' });

      logAudit({
        modulo:            'GRUPOS',
        accion:            'BAJA',
        registro_afectado: `Grupo "${grupoActual?.identificador}" #${id}`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      res.status(200).json({ message: 'Grupo dado de baja exitosamente del sistema.' });
    } catch (error) {
      console.error('Error al dar de baja grupo:', error);
      res.status(500).json({ error: 'Error interno al procesar la baja del grupo.' });
    }
  },

  reactivarGrupo: async (req, res) => {
    try {
      const { id }       = req.params;
      const modificado_por = req.user?.id_usuario;
      const affectedRows = await grupoModel.reactivarGrupo(id, modificado_por);

      if (affectedRows === 0) return res.status(404).json({ error: 'Grupo no encontrado o no se pudo reactivar.' });

      // Recuperar identificador para el log
      const grupoActual = await grupoModel.obtenerGrupoPorId(id);

      logAudit({
        modulo:            'GRUPOS',
        accion:            'MODIFICACION',
        registro_afectado: `Grupo "${grupoActual?.identificador}" #${id} — reactivado`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });

      res.status(200).json({ message: 'Grupo reactivado exitosamente.' });
    } catch (error) {
      console.error('Error al reactivar grupo:', error);
      res.status(500).json({ error: 'Error interno al procesar la reactivación.' });
    }
  },

  // EP-05 SESA: público, sin auditoría
  obtenerCatalogoGrupos: async (req, res) => {
    try {
      const { id_programa_academico, cuatrimestre_id } = req.query;
      const grupos = await grupoModel.obtenerCatalogoGrupos({
        id_programa_academico: id_programa_academico || null,
        cuatrimestre_id:       cuatrimestre_id       || null,
      });
      res.status(200).json(grupos);
    } catch (error) {
      console.error('[Error obtenerCatalogoGrupos]:', error);
      res.status(500).json({ error: 'Error al consultar los grupos' });
    }
  },

  obtenerAsignacionesRelacionadas: async (req, res) => {
    try {
      const { id } = req.params;
      const asignaciones = await grupoModel.getAsignacionesByGrupoId(id === 'null' ? null : id);
      res.status(200).json({ data: asignaciones });
    } catch (error) {
      console.error('Error al obtener asignaciones correlacionadas de grupo:', error);
      res.status(500).json({ error: 'Error interno al consultar las ocupaciones del grupo.' });
    }
  },
};

module.exports = grupoController;