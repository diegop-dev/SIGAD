const grupoModel = require('../models/grupoModel');
const carreraModel = require('../models/carreraModel');
const assignmentModel = require('../models/assignmentModel');

const grupoController = {
  // método exclusivo para la API de sincronización externa (HU-37 / API-04)
  getGruposParaSincronizacion: async (req, res) => {
    try {
      // extraemos los query strings definidos en el contrato del PDF
      const { carrera_id, cuatrimestre_id } = req.query;

      // validación estricta: si faltan parámetros devolvemos HTTP 400
      if (!carrera_id || !cuatrimestre_id) {
        return res.status(400).json({
          message: 'Parámetros incompletos. Se requiere carrera_id y cuatrimestre_id.'
        });
      }

      // delegamos la consulta al modelo optimizado
      const grupos = await grupoModel.getGruposParaSincronizacion(carrera_id, cuatrimestre_id);
      
      // retornamos directamente el arreglo para cumplir el contrato JSON
      return res.status(200).json(grupos);
    } catch (error) {
      console.error('[Error getGruposParaSincronizacion]:', error);
      // retornamos HTTP 500 sin exponer detalles de la base de datos
      return res.status(500).json({ 
        message: 'Error interno al procesar el catálogo de grupos.' 
      });
    }
  },
  
  getGrupos: async (req, res) => {
    try {
      const grupos = await grupoModel.getAllGrupos();
      return res.status(200).json(grupos);
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener grupos' });
    }
  },

  crearGrupo: async (req, res) => {
    try {
      const { carrera_id } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : null;

      const datosNuevoGrupo = {
        identificador: 'TEMP',
        carrera_id,
        cuatrimestre_id: 1, 
        creado_por
      };

      const resultado = await grupoModel.crearGrupo(datosNuevoGrupo);
      const nuevoId = resultado.insertId;

      const carreraInfo = await carreraModel.getCarreraById(carrera_id);
      const codigo_unico = carreraInfo ? carreraInfo.codigo_unico : 'XXXX';
      const anio = new Date().getFullYear();

      const idFormateado = String(nuevoId).padStart(3, '0');
      const identificadorFinal = `${anio}${codigo_unico}${idFormateado}`;

      await grupoModel.actualizarIdentificador(nuevoId, identificadorFinal);

      return res.status(201).json({
        success: true,
        message: 'Grupo registrado y autogenerado correctamente.',
        data: { id_grupo: nuevoId, identificador: identificadorFinal, carrera_id, cuatrimestre_id: 1 }
      });

    } catch (error) {
      console.error('Error al crear grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al guardar grupo' });
    }
  },

actualizarGrupo: async (req, res) => {
    const { id } = req.params;
    try {
      // Agregamos confirmar_rechazo al destructuring
      const { carrera_id, confirmar_rechazo } = req.body; 
      const modificado_por = req.usuario ? req.usuario.id_usuario : null;

      const grupoExistente = await grupoModel.getGrupoById(id);
      if (!grupoExistente) return res.status(404).json({ message: 'Grupo no encontrado' });

      let identificadorFinal = grupoExistente.identificador;

      // Detectamos si el usuario cambió la carrera asignada al grupo
      if (Number(grupoExistente.carrera_id) !== Number(carrera_id)) {
        
        // --- INICIO DE VALIDACIÓN ASIGNACIUONES ---
        const assignmentModel = require('../models/assignmentModel');
        const asignaciones = await assignmentModel.getAllAsignaciones({ grupo_id: id });
        
        const tieneAceptadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ACEPTADA');
        const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

        if (tieneAceptadas) {
          return res.status(409).json({ 
            action: "BLOCK",
            error: "Este grupo tiene clases ACEPTADAS. No puedes cambiar su carrera hasta que liberes sus horarios en la Gestión de Asignaciones." 
          });
        }

        if (tieneEnviadas && !confirmar_rechazo) {
          return res.status(409).json({ 
            action: "WARN",
            error: "Este grupo tiene asignaciones ENVIADAS pendientes. Cambiar la carrera rechazará automáticamente estas clases. ¿Deseas continuar?" 
          });
        }

        if (tieneEnviadas && confirmar_rechazo) {
          await assignmentModel.rechazarAsignacionesPorGrupo(id, modificado_por);
        }
        // --- FIN DE VALIDACIÓN ASIGNACIONES ---

        const carreraModel = require('../models/carreraModel');
        const carreraInfo = await carreraModel.getCarreraById(carrera_id);
        const codigo_unico = carreraInfo ? carreraInfo.codigo_unico : 'XXXX';
        
        const anio = grupoExistente.identificador.substring(0, 4);
        const idFormateado = String(id).padStart(3, '0');
        identificadorFinal = `${anio}${codigo_unico}${idFormateado}`;
      }

      const datosActualizar = {
        identificador: identificadorFinal,
        carrera_id,
        cuatrimestre_id: grupoExistente.cuatrimestre_id,
        modificado_por
      };

      await grupoModel.actualizarGrupo(id, datosActualizar);

      return res.status(200).json({ 
        success: true, 
        message: 'Grupo actualizado correctamente.',
        nuevo_identificador: identificadorFinal 
      });
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al actualizar grupo' });
    }
  },

  desactivarGrupo: async (req, res) => {
      try {
        const { id } = req.params;
        const { eliminado_por, confirmar_rechazo } = req.body;

        if (!eliminado_por) return res.status(400).json({ error: "Falta especificar el usuario que realiza la baja." });

        // 1. REUTILIZAMOS EL MODELO DE ASIGNACIONES
        const asignaciones = await assignmentModel.getAllAsignaciones({ grupo_id: id });
        
        const tieneAceptadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ACEPTADA');
        const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

        // SEMÁFORO ROJO
        if (tieneAceptadas) {
          return res.status(409).json({ 
            action: "BLOCK",
            error: "Este grupo tiene clases ACEPTADAS. No puedes darlo de baja hasta que le reasignes o canceles sus clases en la Gestión de Asignaciones." 
          });
        }

        // SEMÁFORO AMARILLO
        if (tieneEnviadas && !confirmar_rechazo) {
          return res.status(409).json({ 
            action: "WARN",
            error: "Este grupo tiene asignaciones ENVIADAS pendientes de confirmación. Darlo de baja rechazará automáticamente estas clases. ¿Deseas continuar?" 
          });
        }

        if (tieneEnviadas && confirmar_rechazo) {
          await assignmentModel.rechazarAsignacionesPorGrupo(id, eliminado_por);
        }

        // SEMÁFORO VERDE
        const affectedRows = await grupoModel.desactivarGrupo(id, eliminado_por);
        if (affectedRows === 0) return res.status(404).json({ error: "Grupo no encontrado." });

        res.status(200).json({ message: "Grupo dado de baja exitosamente del sistema." });
      } catch (error) {
        console.error("Error al dar de baja grupo:", error);
        res.status(500).json({ error: "Error interno al procesar la baja del grupo." });
      }
    },

  reactivarGrupo: async (req, res) => {
    try {
      const { id } = req.params;
      const modificado_por = req.user?.id_usuario;

      const affectedRows = await grupoModel.reactivarGrupo(id, modificado_por);
      if (affectedRows === 0) return res.status(404).json({ error: "Grupo no encontrado o no se pudo reactivar." });

      res.status(200).json({ message: "Grupo reactivado exitosamente." });
    } catch (error) {
      console.error("Error al reactivar grupo:", error);
      res.status(500).json({ error: "Error interno al procesar la reactivación." });
    }
  }
};

module.exports = grupoController;