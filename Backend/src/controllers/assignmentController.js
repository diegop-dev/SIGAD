const assignmentModel = require('../models/assignmentModel');

// API DE SINCRONIZACIÓN EXTERNA (HU-37 / API-05)
const getAsignacionesParaSincronizacion = async (req, res) => {
  try {
    // extraemos los parámetros de consulta obligatorios según el PDF
    const { materia_id, grupo_id } = req.query;

    // validación estricta: retornamos HTTP 400 si la petición está incompleta
    if (!materia_id || !grupo_id) {
      return res.status(400).json({
        message: "Parámetros incompletos. Se requiere materia_id y grupo_id."
      });
    }

    // consumimos el método optimizado del modelo
    const asignaciones = await assignmentModel.getAsignacionesParaSincronizacion(materia_id, grupo_id);
    
    // retornamos directamente el arreglo para cumplir con el contrato JSON
    return res.status(200).json(asignaciones);
  } catch (error) {
    console.error("[Error en assignmentController - getAsignacionesParaSincronizacion]:", error);
    // retornamos HTTP 500 ocultando la traza original por seguridad
    return res.status(500).json({ 
      message: "Error interno al procesar el catálogo de asignaciones." 
    });
  }
};

// ==========================================
// HU-33: CREAR ASIGNACIÓN DOCENTE
// ==========================================
const createAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id, horarios } = req.body;
    const creado_por = req.user?.id_usuario;

    if (!periodo_id || !materia_id || !docente_id || !grupo_id || !horarios || horarios.length === 0) {
      return res.status(400).json({ error: "Faltan datos obligatorios o no se han definido los horarios." });
    }

    for (const bloque of horarios) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;

      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (docenteConflict) {
        return res.status(409).json({ error: `Conflicto detectado: El docente ya tiene una clase asignada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
      }

      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (grupoConflict) {
        return res.status(409).json({ error: `Conflicto detectado: El grupo ya tiene clases el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
      }

      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (aulaConflict) {
        return res.status(409).json({ error: `Conflicto detectado: El aula seleccionada ya está ocupada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
      }
    }

    const asignacionesToInsert = horarios.map(bloque => ({
      periodo_id,
      materia_id,
      docente_id,
      grupo_id,
      aula_id: bloque.aula_id,
      dia_semana: bloque.dia_semana,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      creado_por
    }));

    const insertedIds = await assignmentModel.createAsignaciones(asignacionesToInsert);

    res.status(201).json({
      message: "Asignación docente creada exitosamente sin conflictos.",
      bloques_guardados: insertedIds.length
    });

  } catch (error) {
    console.error("[Error en assignmentController - createAsignacion]:", error);
    res.status(500).json({ error: "Error interno al intentar crear la asignación docente." });
  }
};

// ==========================================
// HU-34: CONSULTAR ASIGNACIONES DOCENTE
// ==========================================
const getAsignaciones = async (req, res) => {
  try {
    const { periodo_id, docente_id, grupo_id } = req.query;
    const asignaciones = await assignmentModel.getAllAsignaciones({ periodo_id, docente_id, grupo_id });
    res.status(200).json({ data: asignaciones });
  } catch (error) {
    console.error("[Error en assignmentController - getAsignaciones]:", error);
    res.status(500).json({ error: "Error interno al consultar el listado de asignaciones." });
  }
};

module.exports = {
  getAsignacionesParaSincronizacion, // exportamos el nuevo método
  createAsignacion,
  getAsignaciones
};