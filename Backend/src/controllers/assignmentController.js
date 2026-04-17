const assignmentModel = require('../models/assignmentModel');
const notificationModel = require('../models/notificationModel');
const pool = require('../config/database');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles (consistente con el resto de controladores) ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

// Helper: convierte "HH:MM:SS" o "HH:MM" a minutos
const timeToMinutes = (t) => {
  const parts = String(t).split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

// Helper: Formatea hora militar a AM/PM para humanos
const formatAMPM = (timeString) => {
  if (!timeString) return '';
  const [hourString, minute] = timeString.split(':');
  const hour = parseInt(hourString, 10);
  const ampm = hour >= 12 ? 'p. m.' : 'a. m.';
  const hour12 = hour % 12 || 12;
  const paddedHour = hour12 < 10 ? `0${hour12}` : hour12;
  return `${paddedHour}:${minute} ${ampm}`;
};

// Mapeo amigable de días para los mensajes
const diasMap = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
  4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo',
};

// Helper: Valida si hay empalmes dentro del mismo arreglo de horarios
const validarEmpalmesInternos = (horarios) => {
  for (let i = 0; i < horarios.length; i++) {
    for (let j = i + 1; j < horarios.length; j++) {
      const b1 = horarios[i];
      const b2 = horarios[j];

      if (b1.dia_semana === b2.dia_semana) {
        const start1 = timeToMinutes(b1.hora_inicio);
        const end1   = timeToMinutes(b1.hora_fin);
        const start2 = timeToMinutes(b2.hora_inicio);
        const end2   = timeToMinutes(b2.hora_fin);

        if ((start1 < end2 && end1 > start2) || (start1 >= start2 && start1 < end2)) {
          const nombreDia = diasMap[b1.dia_semana] || `Día ${b1.dia_semana}`;
          return {
            conflicto: true,
            mensaje: `Conflicto interno: Tienes dos bloques de horario que se cruzan el ${nombreDia} entre las ${formatAMPM(b1.hora_inicio)} y las ${formatAMPM(b1.hora_fin)}.`,
          };
        }
      }
    }
  }
  return { conflicto: false };
};

/* ─────────────────────────────────────────────────── */

// Api de sincronización externa (HU-37 / API-05)
const getAsignacionesParaSincronizacion = async (req, res) => {
  try {
    const { materia_id, grupo_id } = req.query;
    if (!materia_id || !grupo_id) {
      return res.status(400).json({
        message: 'Datos incompletos: Asegúrate de enviar la materia y el grupo para la sincronización.',
      });
    }
    const asignaciones = await assignmentModel.getAsignacionesParaSincronizacion(materia_id, grupo_id);
    return res.status(200).json(asignaciones);
  } catch (error) {
    console.error('[Error en assignmentController - getAsignacionesParaSincronizacion]:', error);
    return res.status(500).json({ message: 'Error interno: Ocurrió un problema al procesar el catálogo de asignaciones.' });
  }
};

/* ─────────────────────────────────────────────────── */

// Producción: API de recepción de estatus de incumplimiento (HU-39)
const sincronizarReportesExternos = async (req, res) => {
  try {
    const { grupo_id, periodo_id } = req.query;

    if (!grupo_id || !periodo_id) {
      return res.status(400).json({
        error: 'Datos incompletos: Es necesario indicar el grupo y el periodo para sincronizar reportes.',
      });
    }

    const externalApiUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3000';

    const PAGE_SIZE = 100;
    let   paginaActual   = 1;
    let   totalRegistros = null;
    const todasLasAsignaciones = [];

    do {
      const url = `${externalApiUrl}/api/asignaciones/recepcion`
        + `?grupo_id=${grupo_id}&periodo_id=${periodo_id}`
        + `&page=${paginaActual}&page_size=${PAGE_SIZE}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip' },
      });

      if (response.status === 404) {
        return res.status(200).json({
          message: 'Sincronización completada: No hay reportes externos para este grupo en el periodo actual.',
          asignaciones_afectadas: 0,
          reportes_recibidos: 0,
        });
      }

      if (!response.ok) throw new Error(`Error HTTP del servidor externo: ${response.status}`);

      const jsonPagina     = await response.json();
      const registrosPagina = jsonPagina?.data ?? [];
      totalRegistros        = jsonPagina?.total ?? registrosPagina.length;

      todasLasAsignaciones.push(...registrosPagina);
      paginaActual++;

    } while (todasLasAsignaciones.length < totalRegistros);

    if (todasLasAsignaciones.length === 0) {
      return res.status(200).json({
        message: 'Sincronización completada: No se encontraron reportes de incumplimiento pendientes.',
        asignaciones_afectadas: 0,
        reportes_recibidos: 0,
      });
    }

    const docentesMorososIds = todasLasAsignaciones
      .filter(item => item.tiene_reporte_externo === 1 || item.tiene_reporte_externo === true)
      .map(item => item.docente_id);

    let affectedRows = 0;
    if (docentesMorososIds.length > 0) {
      affectedRows = await assignmentModel.marcarReporteExternoMasivo(
        periodo_id, grupo_id, docentesMorososIds
      );
    }

    // Solo auditar si realmente se modificaron registros
    if (affectedRows > 0) {
      logAudit({
        modulo:            'ASIGNACIONES',
        accion:            'MODIFICACION',
        registro_afectado: `Grupo #${grupo_id} / Periodo #${periodo_id} — ${docentesMorososIds.length} reporte(s) de incumplimiento`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });
    }

    return res.status(200).json({
      message: 'Sincronización exitosa: Los reportes externos se han actualizado en el sistema local.',
      paginas_consumidas:     paginaActual - 1,
      asignaciones_revisadas: todasLasAsignaciones.length,
      reportes_recibidos:     docentesMorososIds.length,
      asignaciones_afectadas: affectedRows,
    });

  } catch (error) {
    console.error('[Error en assignmentController - sincronizarReportesExternos]:', error);
    res.status(500).json({
      error: 'Error de conexión: Ocurrió un problema de comunicación con el sistema externo. Intenta más tarde.',
    });
  }
};

/* ─────────────────────────────────────────────────── */

// Crear asignación docente (HU-33)
const createAsignacion = async (req, res) => {
  try {
    const { materia_id, docente_id, grupo_id, horarios } = req.body;
    let { periodo_id } = req.body;
    const creado_por = req.user?.id_usuario;

    // ── Resolución robusta del periodo ───────────────────────────────────────
    // Si el frontend no envía periodo_id, o lo omite, se determina desde la BD
    // usando vigencias (fecha_inicio..fecha_fin) sin depender del campo estatus.
    // Esto corrige el bug donde un periodo nuevo con ID mayor (aunque INACTIVO)
    // desplazaba al periodo correcto en el auto-detect del frontend.
    if (!periodo_id) {
      const periodoActual = await assignmentModel.resolverPeriodoActual();
      if (!periodoActual) {
        return res.status(422).json({
          error: 'Sin periodo vigente: No existe ningún periodo cuyas fechas de inicio y fin cubran el día de hoy. Verifica la configuración de periodos.',
        });
      }
      periodo_id = periodoActual.id_periodo;
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!periodo_id || !materia_id || !docente_id || !horarios || horarios.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos: Completa todos los campos requeridos y añade al menos un horario.' });
    }

    const validacionInterna = validarEmpalmesInternos(horarios);
    if (validacionInterna.conflicto) {
      return res.status(400).json({ error: validacionInterna.mensaje });
    }

    const materiaDuplicada = await assignmentModel.checkMateriaDuplicadaGrupo(grupo_id, materia_id, periodo_id);
    if (materiaDuplicada) {
      return res.status(409).json({ error: 'Materia duplicada: Este grupo ya cursa una materia equivalente en el periodo actual.' });
    }

    const materiaEnOtroGrupo = await assignmentModel.checkMateriaAsignadaAOtroGrupo(materia_id, grupo_id, periodo_id);
    if (materiaEnOtroGrupo) {
      return res.status(409).json({ error: 'Materia no disponible: Esta instancia de materia ya fue asignada a otro grupo en este periodo. Selecciona la materia correspondiente a este grupo.' });
    }

    const cumpleReglasAcademicas = await assignmentModel.checkReglasNegocioAsignacion(materia_id, grupo_id, docente_id, periodo_id);
    if (!cumpleReglasAcademicas) {
      return res.status(422).json({ error: 'Restricción de academia: El docente, la materia o el grupo no coinciden con las reglas de su academia.' });
    }

    const nivelesInfo = await assignmentModel.checkNivelAcademico(docente_id, grupo_id, materia_id);
    if (nivelesInfo) {
      const nivelGrupo   = nivelesInfo.grupo_nivel   ? nivelesInfo.grupo_nivel.toUpperCase()   : '';
      const nivelMateria = nivelesInfo.materia_nivel ? nivelesInfo.materia_nivel.toUpperCase() : '';
      const nivelDocente = nivelesInfo.docente_nivel ? nivelesInfo.docente_nivel.toUpperCase() : '';
      if (nivelGrupo === 'MAESTRIA' || nivelMateria === 'MAESTRIA') {
        if (nivelDocente === 'LICENCIATURA' || nivelDocente === '') {
          return res.status(403).json({ error: 'Restricción de nivel: El docente requiere grado de Maestría o Doctorado para impartir materias de este nivel.' });
        }
      }
    }

    const {
      total_horas, asignaciones_actuales, limite_horas,
      max_horas_continuas, max_asignaciones_docente,
    } = await assignmentModel.getTotalHorasDocente(docente_id, periodo_id);

    if (asignaciones_actuales >= max_asignaciones_docente) {
      return res.status(422).json({
        error: `Límite de materias: El docente ya alcanzó su máximo permitido (${max_asignaciones_docente} materias) para este periodo.`,
      });
    }

    let totalHorasNuevas = 0;
    const MINUTO_7AM  = 420;
    const MINUTO_10PM = 1320;

    for (const bloque of horarios) {
      const startMin  = timeToMinutes(bloque.hora_inicio);
      const endMin    = timeToMinutes(bloque.hora_fin);
      const durHoras  = (endMin - startMin) / 60;
      const nombreDia = diasMap[bloque.dia_semana] || 'Día seleccionado';

      if (startMin < MINUTO_7AM || endMin > MINUTO_10PM)
        return res.status(400).json({ error: `Horario inválido: El bloque del ${nombreDia} debe estar entre las 07:00 a. m. y las 10:00 p. m.` });
      if (durHoras <= 0)
        return res.status(400).json({ error: `Duración inválida: La duración del horario el ${nombreDia} es incorrecta.` });
      if (durHoras > max_horas_continuas)
        return res.status(422).json({ error: `Límite de horas continuas: El bloque del ${nombreDia} supera el máximo permitido de ${max_horas_continuas} horas seguidas.` });

      totalHorasNuevas += durHoras;
    }

    if (total_horas + totalHorasNuevas > limite_horas) {
      return res.status(422).json({
        error: `Límite de horas semanales: La asignación sobrepasa el límite del docente (Límite: ${limite_horas}h, Actuales: ${total_horas.toFixed(1)}h).`,
      });
    }

    for (const bloque of horarios) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;
      const nombreDia = diasMap[dia_semana] || 'ese día';

      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (docenteConflict) return res.status(409).json({ error: `Conflicto de docente: El docente ya tiene una clase programada el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });

      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (grupoConflict) return res.status(409).json({ error: `Conflicto de grupo: El grupo ya tiene una clase en ese mismo horario el ${nombreDia}.` });

      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (aulaConflict) return res.status(409).json({ error: `Conflicto de aula: El aula seleccionada ya está ocupada el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });
    }

    const asignacionesToInsert = horarios.map(bloque => ({
      periodo_id, materia_id, docente_id, grupo_id,
      aula_id:     bloque.aula_id,
      dia_semana:  bloque.dia_semana,
      hora_inicio: bloque.hora_inicio,
      hora_fin:    bloque.hora_fin,
      creado_por,
    }));

    const insertedIds = await assignmentModel.createAsignaciones(asignacionesToInsert);

    try {
      const docentesQuery = await pool.query('SELECT usuario_id FROM docentes WHERE id_docente = ?', [docente_id]);
      if (docentesQuery?.length > 0 && docentesQuery[0].usuario_id) {
        await notificationModel.createNotification(
          docentesQuery[0].usuario_id,
          "Se te ha asignado una nueva materia. Por favor, ingresa a 'Mi Carga Académica' para confirmar tu disponibilidad.",
          'ALTA'
        );
      }
    } catch (notifError) {
      console.error('[Advertencia] No se pudo enviar la notificación al docente:', notifError);
    }

    logAudit({
      modulo:            'ASIGNACIONES',
      accion:            'CREACION',
      registro_afectado: `Docente #${docente_id} / Materia #${materia_id} / Grupo #${grupo_id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(201).json({
      message: 'Asignación creada exitosamente.',
      bloques_guardados: insertedIds.length,
    });
  } catch (error) {
    console.error('[Error en assignmentController - createAsignacion]:', error);
    res.status(500).json({ error: 'Error interno: Ocurrió un problema inesperado al guardar la asignación.' });
  }
};

/* ─────────────────────────────────────────────────── */

// Consultar asignaciones docente (HU-34)
const getAsignaciones = async (req, res) => {
  try {
    const { periodo_id, docente_id, grupo_id, materia_id } = req.query;
    const asignaciones = await assignmentModel.obtenerTodasLasAsignaciones({ periodo_id, docente_id, grupo_id, materia_id });
    res.status(200).json({ data: asignaciones });
  } catch (error) {
    console.error('[Error en assignmentController - getAsignaciones]:', error);
    res.status(500).json({ error: 'Error interno: Ocurrió un problema al cargar la lista de asignaciones.' });
  }
};

/* ─────────────────────────────────────────────────── */

// Modificar asignación docente (HU-35)
const updateAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id, horarios } = req.body;
    const usuario_id = req.user?.id_usuario;

    if (!periodo_id || !materia_id || !docente_id || !horarios || horarios.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos: Faltan parámetros para realizar la modificación.' });
    }

    const validacionInterna = validarEmpalmesInternos(horarios);
    if (validacionInterna.conflicto) {
      return res.status(400).json({ error: validacionInterna.mensaje });
    }

    const cumpleReglasAcademicas = await assignmentModel.checkReglasNegocioAsignacion(materia_id, grupo_id, docente_id, periodo_id);
    if (!cumpleReglasAcademicas) {
      return res.status(422).json({ error: 'Restricción de academia: El docente, la materia o el grupo han perdido congruencia con su academia.' });
    }

    const nivelesInfo = await assignmentModel.checkNivelAcademico(docente_id, grupo_id, materia_id);
    if (nivelesInfo) {
      const nivelGrupo   = nivelesInfo.grupo_nivel   ? nivelesInfo.grupo_nivel.toUpperCase()   : '';
      const nivelMateria = nivelesInfo.materia_nivel ? nivelesInfo.materia_nivel.toUpperCase() : '';
      const nivelDocente = nivelesInfo.docente_nivel ? nivelesInfo.docente_nivel.toUpperCase() : '';
      if (nivelGrupo === 'MAESTRIA' || nivelMateria === 'MAESTRIA') {
        if (nivelDocente === 'LICENCIATURA' || nivelDocente === '') {
          return res.status(403).json({ error: 'Restricción de nivel: El docente requiere grado de Maestría o Doctorado para impartir materias de este nivel.' });
        }
      }
    }

    let excludeIds = await assignmentModel.getIdsAsignacionAgrupada(periodo_id, materia_id, docente_id, grupo_id);

    const materiaEnOtroGrupo = await assignmentModel.checkMateriaAsignadaAOtroGrupo(materia_id, grupo_id, periodo_id, excludeIds);
    if (materiaEnOtroGrupo) {
      return res.status(409).json({ error: 'Materia no disponible: Los cambios no se pueden guardar porque esta materia física ya pertenece a otro grupo distinto.' });
    }

    const { total_horas, limite_horas, max_horas_continuas } =
      await assignmentModel.getTotalHorasDocente(docente_id, periodo_id, excludeIds.length > 0 ? excludeIds : null);

    let totalHorasNuevasU = 0;
    const MINUTO_7AM  = 420;
    const MINUTO_10PM = 1320;

    for (const bloque of horarios) {
      const startMin  = timeToMinutes(bloque.hora_inicio);
      const endMin    = timeToMinutes(bloque.hora_fin);
      const durHoras  = (endMin - startMin) / 60;
      const nombreDia = diasMap[bloque.dia_semana] || 'Día seleccionado';

      if (startMin < MINUTO_7AM || endMin > MINUTO_10PM)
        return res.status(400).json({ error: `Horario inválido: El horario del ${nombreDia} debe estar entre las 07:00 a. m. y las 10:00 p. m.` });
      if (durHoras <= 0)
        return res.status(400).json({ error: `Duración inválida: La duración del horario el ${nombreDia} es incorrecta.` });
      if (durHoras > max_horas_continuas)
        return res.status(422).json({ error: `Límite de horas continuas: El horario del ${nombreDia} supera el máximo permitido de ${max_horas_continuas} horas seguidas.` });

      totalHorasNuevasU += durHoras;
    }

    if (total_horas + totalHorasNuevasU > limite_horas) {
      return res.status(422).json({
        error: `Límite de horas semanales: Los nuevos horarios sobrepasan el límite del docente (Disponibles restantes: ${(limite_horas - total_horas).toFixed(1)}h).`,
      });
    }

    for (const bloque of horarios) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;
      const nombreDia = diasMap[dia_semana] || 'ese día';

      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (docenteConflict) return res.status(409).json({ error: `Conflicto de docente: El docente ya tiene una clase programada el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });

      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (grupoConflict) return res.status(409).json({ error: `Conflicto de grupo: El grupo ya tiene una clase en ese mismo horario el ${nombreDia}.` });

      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (aulaConflict) return res.status(409).json({ error: `Conflicto de aula: El aula seleccionada ya está ocupada el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });
    }

    const asignacionesToUpdate = horarios.map(bloque => ({
      periodo_id, materia_id, docente_id, grupo_id,
      aula_id:        bloque.aula_id,
      dia_semana:     bloque.dia_semana,
      hora_inicio:    bloque.hora_inicio,
      hora_fin:       bloque.hora_fin,
      modificado_por: usuario_id,
    }));

    const insertedIds = await assignmentModel.updateAsignacionesAgrupadas(
      periodo_id, materia_id, docente_id, grupo_id, asignacionesToUpdate, usuario_id
    );

    try {
      const docentesQuery = await pool.query('SELECT usuario_id FROM docentes WHERE id_docente = ?', [docente_id]);
      if (docentesQuery?.length > 0 && docentesQuery[0].usuario_id) {
        await notificationModel.createNotification(
          docentesQuery[0].usuario_id,
          'Una de tus clases asignadas ha sido modificada. Por favor, revisa tus nuevos horarios.',
          'ALTA'
        );
      }
    } catch (notifError) {
      console.error('[Advertencia] No se pudo enviar la notificación al docente en la edición:', notifError);
    }

    logAudit({
      modulo:            'ASIGNACIONES',
      accion:            'MODIFICACION',
      registro_afectado: `Docente #${docente_id} / Materia #${materia_id} / Grupo #${grupo_id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({
      message: 'Asignación actualizada exitosamente.',
      bloques_actualizados: insertedIds.length,
    });
  } catch (error) {
    console.error('[Error en assignmentController - updateAsignacion]:', error);
    res.status(500).json({ error: 'Error interno: Ocurrió un problema inesperado al actualizar la asignación.' });
  }
};

/* ─────────────────────────────────────────────────── */

// Cancelar asignación docente (HU-36)
const cancelarAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id } = req.body;
    const usuario_id = req.user?.id_usuario;

    if (!periodo_id || !materia_id || !docente_id) {
      return res.status(400).json({ error: 'Datos incompletos: Faltan parámetros para identificar la asignación a cancelar.' });
    }

    const affectedRows = await assignmentModel.cancelarAsignacionAgrupada(
      periodo_id, materia_id, docente_id, grupo_id, usuario_id
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada: Es probable que la clase ya haya sido cancelada o eliminada.' });
    }

    logAudit({
      modulo:            'ASIGNACIONES',
      accion:            'BAJA',
      registro_afectado: `Docente #${docente_id} / Materia #${materia_id} / Grupo #${grupo_id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Asignación cancelada exitosamente.' });
  } catch (error) {
    console.error('[Error en assignmentController - cancelarAsignacion]:', error);
    res.status(500).json({ error: 'Error interno: Hubo un problema al intentar cancelar la asignación.' });
  }
};

/* ─────────────────────────────────────────────────── */

// Reactivar asignación cancelada con Validación de Empalmes
const reactivarAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id } = req.body;
    const usuario_id = req.user?.id_usuario;

    if (!periodo_id || !materia_id || !docente_id) {
      return res.status(400).json({ error: 'Datos incompletos: Faltan parámetros para procesar la reactivación.' });
    }

    const horariosCerrados = await assignmentModel.getHorariosAsignacionCerrada(
      periodo_id, materia_id, docente_id, grupo_id
    );

    if (horariosCerrados.length === 0) {
      return res.status(404).json({ error: 'Historial no encontrado: No existen registros de horarios para reactivar esta clase.' });
    }

    for (const bloque of horariosCerrados) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;
      const nombreDia = diasMap[dia_semana] || 'ese día';

      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (docenteConflict) return res.status(409).json({ error: `Conflicto al reactivar (Docente): El docente ya tiene otra clase el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });

      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (grupoConflict) return res.status(409).json({ error: `Conflicto al reactivar (Grupo): El grupo ya tiene otra materia el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });

      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (aulaConflict) return res.status(409).json({ error: `Conflicto al reactivar (Aula): El aula ya fue asignada a otra clase el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });
    }

    await assignmentModel.reactivarAsignacionAgrupada(periodo_id, materia_id, docente_id, grupo_id, usuario_id);

    try {
      const docentesQuery = await pool.query('SELECT usuario_id FROM docentes WHERE id_docente = ?', [docente_id]);
      if (docentesQuery?.length > 0 && docentesQuery[0].usuario_id) {
        await notificationModel.createNotification(
          docentesQuery[0].usuario_id,
          'Una de tus clases que había sido cancelada ha vuelto a ser activada en tu horario.',
          'ALTA'
        );
      }
    } catch (notifError) {
      console.error('[Advertencia] No se pudo enviar la notificación al docente en la reactivación:', notifError);
    }

    logAudit({
      modulo:            'ASIGNACIONES',
      accion:            'MODIFICACION',
      registro_afectado: `Docente #${docente_id} / Materia #${materia_id} / Grupo #${grupo_id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Asignación reactivada exitosamente. Se han restaurado los horarios anteriores.' });
  } catch (error) {
    console.error('[Error en assignmentController - reactivarAsignacion]:', error);
    res.status(500).json({ error: 'Error interno: Ocurrió un problema al intentar reactivar la asignación.' });
  }
};

/* ─────────────────────────────────────────────────── */

// HU-46: Confirmar o Rechazar asignación (Docente)
const actualizarConfirmacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id, estatus_confirmacion } = req.body;
    const usuario_id = req.user?.id_usuario;

    if (!periodo_id || !materia_id || !docente_id || !estatus_confirmacion) {
      return res.status(400).json({ error: 'Datos incompletos: Proporciona todos los parámetros para registrar la confirmación.' });
    }
    if (!['ACEPTADA', 'RECHAZADA'].includes(estatus_confirmacion)) {
      return res.status(400).json({ error: 'Estatus inválido: La decisión enviada no es reconocida por el sistema.' });
    }

    const affectedRows = await assignmentModel.actualizarConfirmacionDocente(
      periodo_id, materia_id, docente_id, grupo_id, estatus_confirmacion, usuario_id
    );

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Asignación no encontrada: Es posible que la asignación ya haya sido procesada o cancelada.' });
    }

    try {
      const gId = (grupo_id === '' || grupo_id === undefined) ? null : grupo_id;
      const asignacionInfo = await pool.query(
        `SELECT a.creado_por, m.nombre as materia_nombre
         FROM asignaciones a
         JOIN materias m ON a.materia_id = m.id_materia
         WHERE a.periodo_id = ? AND a.materia_id = ? AND a.docente_id = ? AND a.grupo_id <=> ?
         LIMIT 1`,
        [periodo_id, materia_id, docente_id, gId]
      );
      if (asignacionInfo?.length > 0 && asignacionInfo[0].creado_por) {
        const creadorId     = asignacionInfo[0].creado_por;
        const materiaNombre = asignacionInfo[0].materia_nombre;
        const accion        = estatus_confirmacion === 'ACEPTADA' ? 'aceptado' : 'rechazado';
        const severidad     = estatus_confirmacion === 'ACEPTADA' ? 'BAJA' : 'ALTA';
        const docenteInfo   = await pool.query('SELECT nombres, apellido_paterno FROM usuarios WHERE id_usuario = ?', [usuario_id]);
        const nombreDocente = docenteInfo?.length > 0 ? `${docenteInfo[0].nombres} ${docenteInfo[0].apellido_paterno}` : 'Un docente';
        await notificationModel.createNotification(
          creadorId,
          `El docente ${nombreDocente} ha ${accion} la impartición de la materia: ${materiaNombre}.`,
          severidad
        );
      }
    } catch (notifError) {
      console.error('[Advertencia] No se pudo notificar al creador de la asignación:', notifError);
    }

    logAudit({
      modulo:            'ASIGNACIONES',
      accion:            'MODIFICACION',
      registro_afectado: `Docente #${docente_id} / Materia #${materia_id} / Grupo #${grupo_id} → ${estatus_confirmacion}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    const mensaje = estatus_confirmacion === 'ACEPTADA'
      ? 'Confirmación registrada: Has aceptado la clase exitosamente.'
      : 'Rechazo registrado: Has declinado la clase y se ha notificado a coordinación.';

    res.status(200).json({ message: mensaje });
  } catch (error) {
    console.error('[Error en assignmentController - actualizarConfirmacion]:', error);
    res.status(500).json({ error: 'Error interno: Hubo un problema al guardar tu respuesta. Por favor, intenta de nuevo.' });
  }
};

/* ─────────────────────────────────────────────────── */

// EP-06 SESA: GET /asignaciones/catalogo
const ObtenerAsignaciones = async (req, res) => {
  try {
    const { grupo_id, materia_id, docente_id } = req.query;
    const asignaciones = await assignmentModel.ObtenerAsignaciones({
      grupo_id:   grupo_id   || null,
      materia_id: materia_id || null,
      docente_id: docente_id || null,
    });
    res.status(200).json(asignaciones);
  } catch (error) {
    console.error('[Error ObtenerAsignaciones]:', error);
    res.status(500).json({ error: 'Error interno: Ocurrió un error al obtener la lista de asignaciones para SESA.' });
  }
};

/* ─────────────────────────────────────────────────── */

// HU-38: Sincronización de promedios consolidados
const sincronizarPromedios = async (req, res) => {
  try {
    const { grupo_id } = req.query;
    const usuario_id   = req.user?.id_usuario;

    if (!grupo_id) {
      return res.status(400).json({ error: 'Datos incompletos: Se requiere especificar el grupo a sincronizar.' });
    }

    const externalApiUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3000';
    const PAGE_SIZE      = 100;
    const headers        = { 'Content-Type': 'application/json', 'Accept-Encoding': 'gzip' };

    const fetchAllPages = async (baseUrl) => {
      let pagina = 1;
      let total  = null;
      const todos = [];

      do {
        const url      = `${baseUrl}&page=${pagina}&page_size=${PAGE_SIZE}`;
        const response = await fetch(url, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error HTTP ${response.status} en ${baseUrl}`);
        const json  = await response.json();
        const items = json?.data ?? [];
        total       = json?.total ?? items.length;
        todos.push(...items);
        pagina++;
      } while (todos.length < total);

      return todos;
    };

    const materiasSesa = await fetchAllPages(`${externalApiUrl}/api/materias/recepcion?_placeholder=1`);
    const mapaMateriasSesa = {};
    for (const m of materiasSesa) mapaMateriasSesa[m.codigo_unico] = m.id_materia;

    const gruposSesa    = await fetchAllPages(`${externalApiUrl}/api/grupos/recepcion?_placeholder=1`);
    const gruposLocales = await pool.query(
      'SELECT id_grupo, identificador FROM grupos WHERE id_grupo = ? LIMIT 1',
      [grupo_id]
    );

    if (!gruposLocales.length) {
      return res.status(404).json({ error: 'Grupo no encontrado: El grupo especificado no existe en el sistema local.' });
    }

    const identificadorLocal = gruposLocales[0].identificador;
    const grupoSesa          = gruposSesa.find(g => g.identificador === identificadorLocal);

    if (!grupoSesa) {
      return res.status(404).json({
        error: `Grupo no sincronizado: El grupo "${identificadorLocal}" no se encuentra en el sistema externo de calificaciones (SESA).`,
      });
    }

    const id_grupo_sesa       = grupoSesa.id_grupo;
    const asignacionesLocales = await assignmentModel.ObtenerAsignacionesAbiertasPorGrupo(grupo_id);

    if (asignacionesLocales.length === 0) {
      return res.status(200).json({
        mensaje:      'Sin pendientes: No hay materias activas o aceptadas pendientes de calificar para este grupo.',
        actualizadas: 0,
        sin_promedio: 0,
      });
    }

    let actualizadas = 0;
    let sin_promedio = 0;

    for (const asignacion of asignacionesLocales) {
      const id_materia_sesa = mapaMateriasSesa[asignacion.codigo_unico];

      if (!id_materia_sesa) {
        console.warn(`[HU-38] Materia "${asignacion.codigo_unico}" no encontrada en catálogo SESA.`);
        sin_promedio++;
        continue;
      }

      try {
        const urlPromedio  = `${externalApiUrl}/api/asignaciones/recepcion?materia_id=${id_materia_sesa}&grupo_id=${id_grupo_sesa}`;
        const respPromedio = await fetch(urlPromedio, { method: 'GET', headers });

        if (respPromedio.status === 404) { sin_promedio++; continue; }
        if (!respPromedio.ok) {
          console.warn(`[HU-38] Error ${respPromedio.status} al consultar promedio de materia ${asignacion.codigo_unico}`);
          sin_promedio++;
          continue;
        }

        const { promedio_consolidado } = await respPromedio.json();
        if (promedio_consolidado === null || promedio_consolidado === undefined) { sin_promedio++; continue; }

        await assignmentModel.cerrarAsignacionConPromedio(
          grupo_id, asignacion.materia_id, promedio_consolidado, usuario_id
        );
        actualizadas++;
      } catch (err) {
        console.error(`[HU-38] Error consultando promedio de materia ${asignacion.codigo_unico}:`, err.message);
        sin_promedio++;
      }
    }

    // Solo auditar si efectivamente se cerraron actas
    if (actualizadas > 0) {
      logAudit({
        modulo:            'ASIGNACIONES',
        accion:            'MODIFICACION',
        registro_afectado: `Grupo #${grupo_id} — ${actualizadas} acta(s) cerrada(s) con promedio SESA`,
        detalle:           null,
        usuario_id:        req.user?.id_usuario,
        usuario_rol:       rolNombre(req.user?.rol_id),
        ip_address:        getClientIp(req),
      });
    }

    return res.status(200).json({
      mensaje:      `Sincronización completada: Se descargaron calificaciones y se cerraron ${actualizadas} actas.`,
      actualizadas,
      sin_promedio,
    });

  } catch (error) {
    console.error('[Error sincronizarPromedios]:', error);
    res.status(500).json({ error: 'Error interno: Ocurrió un error al intentar traer los promedios del sistema externo.' });
  }
};

/* ─────────────────────────────────────────────────── */

// Validar borrador de asignación (Pre-flight Validation)
const validarBorrador = async (req, res) => {
  try {
    const { materia_id, docente_id, grupo_id, horarios, es_edicion } = req.body;
    let { periodo_id } = req.body;

    // ── Resolución robusta del periodo ───────────────────────────────────────
    // Misma lógica que en createAsignacion: si el frontend no envía periodo_id
    // (o lo omite), se determina desde la BD usando vigencias sin depender del
    // campo estatus. Evita el 422 falso causado por un periodo INACTIVO con
    // ID mayor que desplazaba al periodo real en el auto-detect del frontend.
    if (!periodo_id) {
      const periodoActual = await assignmentModel.resolverPeriodoActual();
      if (!periodoActual) {
        return res.status(422).json({
          error: 'Sin periodo vigente: No existe ningún periodo cuyas fechas de inicio y fin cubran el día de hoy. Verifica la configuración de periodos.',
        });
      }
      periodo_id = periodoActual.id_periodo;
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!periodo_id || !materia_id || !docente_id || !horarios || horarios.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos: Faltan parámetros para validar el borrador. Completa el formulario.' });
    }

    for (let i = 0; i < horarios.length; i++) {
      if (!horarios[i].aula_id) {
        const nombreDia = diasMap[horarios[i].dia_semana] || 'un día';
        return res.status(400).json({ error: `Aula requerida: Selecciona un aula física para el horario del ${nombreDia}.` });
      }
    }

    const validacionInterna = validarEmpalmesInternos(horarios);
    if (validacionInterna.conflicto) {
      return res.status(400).json({ error: validacionInterna.mensaje });
    }

    if (!es_edicion) {
      const materiaDuplicada = await assignmentModel.checkMateriaDuplicadaGrupo(grupo_id, materia_id, periodo_id);
      if (materiaDuplicada) {
        return res.status(409).json({ error: 'Materia duplicada: Este grupo ya cursa esta materia (o una equivalente) en el ciclo escolar activo.' });
      }
    }

    const cumpleReglas = await assignmentModel.checkReglasNegocioAsignacion(materia_id, grupo_id, docente_id, periodo_id);
    if (!cumpleReglas) {
      return res.status(422).json({ error: 'Restricción de academia: El docente, materia o grupo no coinciden con las reglas de la academia.' });
    }

    const nivelesInfo = await assignmentModel.checkNivelAcademico(docente_id, grupo_id, materia_id);
    if (nivelesInfo) {
      const nivelGrupo   = nivelesInfo.grupo_nivel   ? nivelesInfo.grupo_nivel.toUpperCase()   : '';
      const nivelMateria = nivelesInfo.materia_nivel ? nivelesInfo.materia_nivel.toUpperCase() : '';
      const nivelDocente = nivelesInfo.docente_nivel ? nivelesInfo.docente_nivel.toUpperCase() : '';
      if ((nivelGrupo === 'MAESTRIA' || nivelMateria === 'MAESTRIA') && (nivelDocente === 'LICENCIATURA' || nivelDocente === '')) {
        return res.status(403).json({ error: 'Restricción de nivel: Los docentes con grado de Licenciatura no pueden impartir clases en nivel Maestría.' });
      }
    }

    let excludeIds = [];
    if (es_edicion) {
      excludeIds = await assignmentModel.getIdsAsignacionAgrupada(periodo_id, materia_id, docente_id, grupo_id);
    }

    const materiaEnOtroGrupo = await assignmentModel.checkMateriaAsignadaAOtroGrupo(materia_id, grupo_id, periodo_id, excludeIds);
    if (materiaEnOtroGrupo) {
      return res.status(409).json({ error: 'Materia no disponible: Esta materia específica ya fue tomada por otro grupo en este periodo.' });
    }

    const {
      total_horas, asignaciones_actuales, limite_horas,
      max_horas_continuas, max_asignaciones_docente,
    } = await assignmentModel.getTotalHorasDocente(docente_id, periodo_id, excludeIds.length > 0 ? excludeIds : null);

    if (!es_edicion && asignaciones_actuales >= max_asignaciones_docente) {
      return res.status(422).json({ error: `Límite de materias: El docente ya tiene el número máximo permitido (${max_asignaciones_docente}) para este ciclo.` });
    }

    let totalHorasNuevas = 0;
    const MINUTO_7AM  = 420;
    const MINUTO_10PM = 1320;

    for (const bloque of horarios) {
      const startMin  = timeToMinutes(bloque.hora_inicio);
      const endMin    = timeToMinutes(bloque.hora_fin);
      const durHoras  = (endMin - startMin) / 60;
      const nombreDia = diasMap[bloque.dia_semana] || 'seleccionado';

      if (startMin < MINUTO_7AM || endMin > MINUTO_10PM)
        return res.status(400).json({ error: `Horario inválido: El bloque del ${nombreDia} debe estar entre las 07:00 a. m. y las 10:00 p. m.` });
      if (durHoras <= 0)
        return res.status(400).json({ error: `Duración inválida: La duración del horario el ${nombreDia} es incorrecta.` });
      if (durHoras > max_horas_continuas)
        return res.status(422).json({ error: `Límite de horas continuas: El bloque del ${nombreDia} supera el máximo de ${max_horas_continuas} horas seguidas permitidas.` });

      totalHorasNuevas += durHoras;
    }

    if (total_horas + totalHorasNuevas > limite_horas) {
      return res.status(422).json({ error: `Límite de horas semanales: La asignación superaría el límite de horas del docente (Límite: ${limite_horas}h).` });
    }

    for (const bloque of horarios) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;
      const nombreDia = diasMap[dia_semana] || 'ese día';

      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (docenteConflict) return res.status(409).json({ error: `Conflicto de docente: El docente ya tiene una clase programada el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });

      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (grupoConflict) return res.status(409).json({ error: `Conflicto de grupo: El grupo ya tiene una materia en ese mismo horario el ${nombreDia}.` });

      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (aulaConflict) return res.status(409).json({ error: `Conflicto de aula: El aula seleccionada ya está reservada el ${nombreDia} de ${formatAMPM(hora_inicio)} a ${formatAMPM(hora_fin)}.` });
    }

    return res.status(200).json({ valid: true, message: 'Validación exitosa: Los horarios son correctos y no presentan cruces.' });

  } catch (error) {
    console.error('[Error en assignmentController - validarBorrador]:', error);
    res.status(500).json({ error: 'Error interno: Ocurrió un error al verificar los horarios en el servidor.' });
  }
};

/* ─────────────────────────────────────────────────── */

module.exports = {
  getAsignacionesParaSincronizacion,
  sincronizarReportesExternos,
  createAsignacion,
  getAsignaciones,
  updateAsignacion,
  cancelarAsignacion,
  reactivarAsignacion,
  actualizarConfirmacion,
  ObtenerAsignaciones,
  sincronizarPromedios,
  validarBorrador,
};