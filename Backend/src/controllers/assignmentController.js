const assignmentModel = require('../models/assignmentModel');

// ==========================================
// HU-33: CREAR ASIGNACIÓN DOCENTE
// ==========================================
const createAsignacion = async (req, res) => {
  try {
    const { id_periodo, id_materia, id_docente, id_grupo, horarios } = req.body;
    const creado_por = req.user?.id_usuario;

    // 1. Validación básica de datos de entrada
    if (!id_periodo || !id_materia || !id_docente || !id_grupo || !horarios || horarios.length === 0) {
      return res.status(400).json({ error: "Faltan datos obligatorios o no se han definido los horarios." });
    }

    // 2. Motor de Validación de Cruces (Iteramos cada bloque de horario)
    for (const bloque of horarios) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;

      // 2.1 Verificar empalme del Docente
      const docenteConflict = await assignmentModel.checkDocenteConflict(id_docente, id_periodo, dia_semana, hora_inicio, hora_fin);
      if (docenteConflict) {
        return res.status(409).json({ 
          error: `Conflicto detectado: El docente ya tiene una clase asignada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` 
        });
      }

      // 2.2 Verificar empalme del Grupo
      const grupoConflict = await assignmentModel.checkGrupoConflict(id_grupo, id_periodo, dia_semana, hora_inicio, hora_fin);
      if (grupoConflict) {
        return res.status(409).json({ 
          error: `Conflicto detectado: El grupo ya tiene clases el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` 
        });
      }

      // 2.3 Verificar empalme del Aula
      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, id_periodo, dia_semana, hora_inicio, hora_fin);
      if (aulaConflict) {
        return res.status(409).json({ 
          error: `Conflicto detectado: El aula seleccionada ya está ocupada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` 
        });
      }
    }

    // 3. Preparación de datos para la transacción (Mapeo)
    const asignacionesToInsert = horarios.map(bloque => ({
      id_periodo,
      id_materia,
      id_docente,
      id_grupo,
      aula_id: bloque.aula_id,
      dia_semana: bloque.dia_semana,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      creado_por
    }));

    // 4. Inserción Transaccional en la Base de Datos
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
    // Obtenemos posibles filtros desde la URL (query params)
    const { id_periodo, id_docente, id_grupo } = req.query;

    // Llamamos al modelo pasándole los filtros (Añadiremos esta función en el siguiente paso)
    const asignaciones = await assignmentModel.getAllAsignaciones({ id_periodo, id_docente, id_grupo });

    res.status(200).json(asignaciones);
  } catch (error) {
    console.error("[Error en assignmentController - getAsignaciones]:", error);
    res.status(500).json({ error: "Error interno al consultar el listado de asignaciones." });
  }
};

module.exports = {
  createAsignacion,
  getAsignaciones
};