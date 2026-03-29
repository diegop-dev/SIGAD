const assignmentModel = require('../models/assignmentModel');
const notificationModel = require('../models/notificationModel');
const pool = require('../config/database');

// Api de sincronización externa (HU-37 / API-05)
const getAsignacionesParaSincronizacion = async (req, res) => {
  try {
    const { materia_id, grupo_id } = req.query;
    if (!materia_id || !grupo_id) {
      return res.status(400).json({
        message: "Parámetros incompletos. Se requiere materia_id y grupo_id."
      });
    }
    const asignaciones = await assignmentModel.getAsignacionesParaSincronizacion(materia_id, grupo_id);
    return res.status(200).json(asignaciones);
  } catch (error) {
    console.error("[Error en assignmentController - getAsignacionesParaSincronizacion]:", error);
    return res.status(500).json({ message: "Error interno al procesar el catálogo de asignaciones." });
  }
};

// ==========================================
// ✨ PRODUCCIÓN: API de recepción de estatus de incumplimiento (HU-39)
// ==========================================
const sincronizarReportesExternos = async (req, res) => {
  try {
    const { grupo_id, periodo_id } = req.query;

    if (!grupo_id || !periodo_id) {
      return res.status(400).json({
        error: "Se requieren los parámetros grupo_id y periodo_id para sincronizar con el sistema externo."
      });
    }

    const externalApiUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3000';
    const token          = process.env.EXTERNAL_API_TOKEN || '';

    // ─── Paginación: consumimos todas las páginas hasta agotar el total ───────
    // SESA devuelve { page, page_size, total, data: [...] } según su PDF.
    // page_size default = 50, máx = 100. Usamos 100 para minimizar llamadas.
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
        headers: {
          'Content-Type':    'application/json',
          'Accept-Encoding': 'gzip',
          'Authorization':   `Bearer ${token}`,
        }
      });

      // 404 de SESA significa que no hay asignaciones para ese grupo+periodo
      if (response.status === 404) {
        return res.status(200).json({
          message: "Sincronización completada. No se encontraron asignaciones para ese grupo y periodo en el sistema externo.",
          asignaciones_afectadas: 0,
          reportes_recibidos: 0
        });
      }

      if (!response.ok) {
        throw new Error(`Error HTTP del servidor externo: ${response.status}`);
      }

      const jsonPagina = await response.json();

      // Extraemos el arreglo real desde la envoltura paginada { page, page_size, total, data }
      const registrosPagina = jsonPagina?.data ?? [];
      totalRegistros        = jsonPagina?.total ?? registrosPagina.length;

      todasLasAsignaciones.push(...registrosPagina);
      paginaActual++;

    } while (todasLasAsignaciones.length < totalRegistros);
    // ─────────────────────────────────────────────────────────────────────────

    if (todasLasAsignaciones.length === 0) {
      return res.status(200).json({
        message: "Sincronización completada. No se encontraron reportes de incumplimiento en el sistema externo.",
        asignaciones_afectadas: 0,
        reportes_recibidos: 0
      });
    }

    // Extraemos los docente_id que tienen reporte activo (tiene_reporte_externo = 1)
    const docentesMorososIds = todasLasAsignaciones
      .filter(item => item.tiene_reporte_externo === 1 || item.tiene_reporte_externo === true)
      .map(item => item.docente_id);

    let affectedRows = 0;
    if (docentesMorososIds.length > 0) {
      affectedRows = await assignmentModel.marcarReporteExternoMasivo(
        periodo_id,
        grupo_id,
        docentesMorososIds
      );
    }

    return res.status(200).json({
      message: "Sincronización exitosa vía VPN. Se han mapeado y actualizado los estatus de incumplimiento en la base de datos.",
      paginas_consumidas:    paginaActual - 1,
      asignaciones_revisadas: todasLasAsignaciones.length,
      reportes_recibidos:    docentesMorososIds.length,
      asignaciones_afectadas: affectedRows,
    });

  } catch (error) {
    console.error("[Error en assignmentController - sincronizarReportesExternos]:", error);
    res.status(500).json({
      error: "Error de red al intentar conectar con el sistema externo de reportes. Verifica la VPN o la URL de la API."
    });
  }
};

// ==========================================
// Crear asignación docente (HU-33)
// ==========================================
const createAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id, horarios } = req.body;
    const creado_por = req.user?.id_usuario;

    if (!periodo_id || !materia_id || !docente_id || !horarios || horarios.length === 0) {
      return res.status(400).json({ error: "Faltan datos obligatorios o no se han definido los horarios." });
    }

    const cumpleReglasAcademicas = await assignmentModel.checkReglasNegocioAsignacion(materia_id, grupo_id, docente_id, periodo_id);
    if (!cumpleReglasAcademicas) {
      return res.status(422).json({
        error: "Incongruencia de datos: Verifica que la materia corresponda a la carrera, al periodo seleccionado, al cuatrimestre del grupo, y que el docente pertenezca a la academia correcta."
      });
    }

    const nivelesInfo = await assignmentModel.checkNivelAcademico(docente_id, grupo_id, materia_id);
    if (nivelesInfo) {
      const nivelGrupo   = nivelesInfo.grupo_nivel   ? nivelesInfo.grupo_nivel.toUpperCase()   : '';
      const nivelMateria = nivelesInfo.materia_nivel ? nivelesInfo.materia_nivel.toUpperCase() : '';
      const nivelDocente = nivelesInfo.docente_nivel ? nivelesInfo.docente_nivel.toUpperCase() : '';
      if (nivelGrupo === 'MAESTRIA' || nivelMateria === 'MAESTRIA') {
        if (nivelDocente === 'LICENCIATURA' || nivelDocente === '') {
          return res.status(403).json({
            error: "Bloqueo por normativa: Los docentes con grado de Licenciatura no pueden impartir clases a nivel Maestría. Se requiere grado de Maestría o Doctorado."
          });
        }
      }
    }

    for (const bloque of horarios) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;
      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (docenteConflict) return res.status(409).json({ error: `Conflicto detectado: El docente ya tiene una clase asignada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (grupoConflict) return res.status(409).json({ error: `Conflicto detectado: El grupo ya tiene clases el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (aulaConflict) return res.status(409).json({ error: `Conflicto detectado: El aula seleccionada ya está ocupada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
    }

    const asignacionesToInsert = horarios.map(bloque => ({
      periodo_id, materia_id, docente_id, grupo_id,
      aula_id: bloque.aula_id, dia_semana: bloque.dia_semana,
      hora_inicio: bloque.hora_inicio, hora_fin: bloque.hora_fin, creado_por
    }));

    const insertedIds = await assignmentModel.createAsignaciones(asignacionesToInsert);

    try {
      const docentesQuery = await pool.query('SELECT usuario_id FROM docentes WHERE id_docente = ?', [docente_id]);
      if (docentesQuery?.length > 0 && docentesQuery[0].usuario_id) {
        await notificationModel.createNotification(
          docentesQuery[0].usuario_id,
          "Tienes una nueva carga académica asignada. Por favor, ingresa a 'Mi Carga Académica' para confirmar tu disponibilidad.",
          "ALTA"
        );
      }
    } catch (notifError) {
      console.error("[Advertencia] No se pudo enviar la notificación al docente:", notifError);
    }

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
// Consultar asignaciones docente (HU-34)
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

// ==========================================
// Modificar asignación docente (HU-35)
// ==========================================
const updateAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id, horarios } = req.body;
    const usuario_id = req.user?.id_usuario;

    if (!periodo_id || !materia_id || !docente_id || !horarios || horarios.length === 0) {
      return res.status(400).json({ error: "Faltan datos obligatorios o no se han definido los horarios para la modificación." });
    }

    const cumpleReglasAcademicas = await assignmentModel.checkReglasNegocioAsignacion(materia_id, grupo_id, docente_id, periodo_id);
    if (!cumpleReglasAcademicas) {
      return res.status(422).json({
        error: "Incongruencia de datos: Las nuevas relaciones no respetan las limitantes de carrera, periodo, cuatrimestre o academia."
      });
    }

    const nivelesInfo = await assignmentModel.checkNivelAcademico(docente_id, grupo_id, materia_id);
    if (nivelesInfo) {
      const nivelGrupo   = nivelesInfo.grupo_nivel   ? nivelesInfo.grupo_nivel.toUpperCase()   : '';
      const nivelMateria = nivelesInfo.materia_nivel ? nivelesInfo.materia_nivel.toUpperCase() : '';
      const nivelDocente = nivelesInfo.docente_nivel ? nivelesInfo.docente_nivel.toUpperCase() : '';
      if (nivelGrupo === 'MAESTRIA' || nivelMateria === 'MAESTRIA') {
        if (nivelDocente === 'LICENCIATURA' || nivelDocente === '') {
          return res.status(403).json({
            error: "Bloqueo por normativa: Los docentes con grado de Licenciatura no pueden impartir clases a nivel Maestría. Se requiere grado de Maestría o Doctorado."
          });
        }
      }
    }

    const excludeIds = await assignmentModel.getIdsAsignacionAgrupada(periodo_id, materia_id, docente_id, grupo_id);

    for (const bloque of horarios) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;
      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (docenteConflict) return res.status(409).json({ error: `Conflicto detectado: El docente ya tiene una clase asignada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (grupoConflict) return res.status(409).json({ error: `Conflicto detectado: El grupo ya tiene clases el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds);
      if (aulaConflict) return res.status(409).json({ error: `Conflicto detectado: El aula seleccionada ya está ocupada el ${dia_semana} de ${hora_inicio} a ${hora_fin}.` });
    }

    const asignacionesToUpdate = horarios.map(bloque => ({
      periodo_id, materia_id, docente_id, grupo_id,
      aula_id: bloque.aula_id, dia_semana: bloque.dia_semana,
      hora_inicio: bloque.hora_inicio, hora_fin: bloque.hora_fin,
      modificado_por: usuario_id
    }));

    const insertedIds = await assignmentModel.updateAsignacionesAgrupadas(periodo_id, materia_id, docente_id, grupo_id, asignacionesToUpdate, usuario_id);

    try {
      const docentesQuery = await pool.query('SELECT usuario_id FROM docentes WHERE id_docente = ?', [docente_id]);
      if (docentesQuery?.length > 0 && docentesQuery[0].usuario_id) {
        await notificationModel.createNotification(
          docentesQuery[0].usuario_id,
          "Tu carga académica ha sido modificada. Por favor, revisa tus nuevos horarios y confirma tu disponibilidad.",
          "ALTA"
        );
      }
    } catch (notifError) {
      console.error("[Advertencia] No se pudo enviar la notificación al docente en la edición:", notifError);
    }

    res.status(200).json({
      message: "Asignación docente modificada exitosamente sin empalmes.",
      bloques_actualizados: insertedIds.length
    });
  } catch (error) {
    console.error("[Error en assignmentController - updateAsignacion]:", error);
    res.status(500).json({ error: "Error interno al intentar modificar la asignación docente." });
  }
};

// ==========================================
// Cancelar asignación docente (HU-36)
// ==========================================
const cancelarAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id } = req.body;
    const usuario_id = req.user?.id_usuario;
    if (!periodo_id || !materia_id || !docente_id) {
      return res.status(400).json({ error: "Faltan parámetros de agrupación para efectuar la cancelación." });
    }
    const affectedRows = await assignmentModel.cancelarAsignacionAgrupada(periodo_id, materia_id, docente_id, grupo_id, usuario_id);
    if (affectedRows === 0) return res.status(404).json({ error: "No se encontraron bloques activos con esos parámetros para cancelar." });
    res.status(200).json({ message: "Asignación cancelada correctamente del ciclo escolar." });
  } catch (error) {
    console.error("[Error en assignmentController - cancelarAsignacion]:", error);
    res.status(500).json({ error: "Error interno al ejecutar el borrado lógico." });
  }
};

// ==========================================
// Reactivar asignación cancelada con Validación de Empalmes
// ==========================================
const reactivarAsignacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id } = req.body;
    const usuario_id = req.user?.id_usuario;
    if (!periodo_id || !materia_id || !docente_id) {
      return res.status(400).json({ error: "Faltan parámetros de agrupación para efectuar la reactivación." });
    }
    const horariosCerrados = await assignmentModel.getHorariosAsignacionCerrada(periodo_id, materia_id, docente_id, grupo_id);
    if (horariosCerrados.length === 0) {
      return res.status(404).json({ error: "No existen bloques cerrados con esos parámetros que puedan ser reactivados." });
    }
    for (const bloque of horariosCerrados) {
      const { dia_semana, hora_inicio, hora_fin, aula_id } = bloque;
      const inicioFmt = hora_inicio.substring(0, 5);
      const finFmt    = hora_fin.substring(0, 5);
      const docenteConflict = await assignmentModel.checkDocenteConflict(docente_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (docenteConflict) return res.status(409).json({ error: `Reactivación bloqueada: El docente ya fue asignado a otra clase el día ${dia_semana} de ${inicioFmt} a ${finFmt}.` });
      const grupoConflict = await assignmentModel.checkGrupoConflict(grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (grupoConflict) return res.status(409).json({ error: `Reactivación bloqueada: El grupo ya tiene otra clase el día ${dia_semana} de ${inicioFmt} a ${finFmt}.` });
      const aulaConflict = await assignmentModel.checkAulaConflict(aula_id, periodo_id, dia_semana, hora_inicio, hora_fin);
      if (aulaConflict) return res.status(409).json({ error: `Reactivación bloqueada: El aula ya está ocupada por otra clase el día ${dia_semana} de ${inicioFmt} a ${finFmt}.` });
    }
    await assignmentModel.reactivarAsignacionAgrupada(periodo_id, materia_id, docente_id, grupo_id, usuario_id);

    try {
      const docentesQuery = await pool.query('SELECT usuario_id FROM docentes WHERE id_docente = ?', [docente_id]);
      if (docentesQuery?.length > 0 && docentesQuery[0].usuario_id) {
        await notificationModel.createNotification(
          docentesQuery[0].usuario_id,
          "Una de tus clases que había sido cancelada ha sido reactivada. Por favor, revisa tu carga académica para confirmar tu disponibilidad.",
          "ALTA"
        );
      }
    } catch (notifError) {
      console.error("[Advertencia] No se pudo enviar la notificación al docente en la reactivación:", notifError);
    }

    res.status(200).json({ message: "Asignación reactivada exitosamente. Los horarios siguen disponibles." });
  } catch (error) {
    console.error("[Error en assignmentController - reactivarAsignacion]:", error);
    res.status(500).json({ error: "Error interno al ejecutar la reactivación de la asignación." });
  }
};

// ==========================================
// HU-46: Confirmar o Rechazar asignación (Docente)
// ==========================================
const actualizarConfirmacion = async (req, res) => {
  try {
    const { periodo_id, materia_id, docente_id, grupo_id, estatus_confirmacion } = req.body;
    const usuario_id = req.user?.id_usuario;
    if (!periodo_id || !materia_id || !docente_id || !estatus_confirmacion) {
      return res.status(400).json({ error: "Faltan parámetros para procesar la confirmación." });
    }
    if (!['ACEPTADA', 'RECHAZADA'].includes(estatus_confirmacion)) {
      return res.status(400).json({ error: "El estatus de confirmación enviado no es válido." });
    }
    const affectedRows = await assignmentModel.actualizarConfirmacionDocente(
      periodo_id, materia_id, docente_id, grupo_id, estatus_confirmacion, usuario_id
    );
    if (affectedRows === 0) return res.status(404).json({ error: "No se encontró una asignación activa con esos datos para modificar." });

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
        const creadorId      = asignacionInfo[0].creado_por;
        const materiaNombre  = asignacionInfo[0].materia_nombre;
        const accion         = estatus_confirmacion === 'ACEPTADA' ? 'aceptado' : 'rechazado';
        const severidad      = estatus_confirmacion === 'ACEPTADA' ? 'BAJA' : 'ALTA';
        const docenteInfo    = await pool.query('SELECT nombres, apellido_paterno FROM usuarios WHERE id_usuario = ?', [usuario_id]);
        const nombreDocente  = docenteInfo?.length > 0 ? `${docenteInfo[0].nombres} ${docenteInfo[0].apellido_paterno}` : 'Un docente';
        await notificationModel.createNotification(
          creadorId,
          `El docente ${nombreDocente} ha ${accion} la asignación para la materia: ${materiaNombre}.`,
          severidad
        );
      }
    } catch (notifError) {
      console.error("[Advertencia] No se pudo notificar al creador de la asignación:", notifError);
    }

    const mensaje = estatus_confirmacion === 'ACEPTADA'
      ? "Has aceptado la asignación de esta clase exitosamente."
      : "Has rechazado la asignación de esta clase. La coordinación será notificada.";
    res.status(200).json({ message: mensaje });
  } catch (error) {
    console.error("[Error en assignmentController - actualizarConfirmacion]:", error);
    res.status(500).json({ error: "Error interno al procesar la decisión sobre la asignación." });
  }
};

// ─── EP-06 SESA: GET /asignaciones/catalogo ───────────────────────────────────────────
// Filtros opcionales: ?grupo_id=X&materia_id=Y&docente_id=Z
// El filtro de periodo activo, ABIERTA y ACEPTADA lo aplica el model implícitamente.
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
    console.error("[Error ObtenerAsignaciones]:", error);
    res.status(500).json({ error: "Error al consultar las asignaciones" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── HU-38: Sincronización de promedios consolidados ─────────────────────────
// Flujo:
//  1. GET SESA /api/materias/recepcion (paginado) → mapa codigo_unico → id_materia_sesa
//  2. GET SESA /api/grupos/recepcion   (paginado) → encuentra id_grupo_sesa por identificador
//  3. Por cada asignación ABIERTA+ACEPTADA del grupo:
//     GET SESA /api/asignaciones/recepcion?materia_id=X&grupo_id=Y
//     Si promedio disponible → UPDATE promedio_consolidado + estatus_acta = CERRADA
const sincronizarPromedios = async (req, res) => {
  try {
    const { grupo_id } = req.query;
    const usuario_id   = req.user?.id_usuario;

    if (!grupo_id) {
      return res.status(400).json({
        error: "Se requiere el parámetro grupo_id para sincronizar promedios."
      });
    }

    const externalApiUrl = process.env.EXTERNAL_API_URL || 'http://localhost:3000';
    const token          = process.env.EXTERNAL_API_TOKEN || '';
    const PAGE_SIZE      = 100;

    const headers = {
      'Content-Type':    'application/json',
      'Accept-Encoding': 'gzip',
      'Authorization':   `Bearer ${token}`,
    };

    // ── Helper: consume todas las páginas de un endpoint paginado ─────────
    const fetchAllPages = async (baseUrl) => {
      let pagina   = 1;
      let total    = null;
      const todos  = [];

      do {
        const url      = `${baseUrl}&page=${pagina}&page_size=${PAGE_SIZE}`;
        const response = await fetch(url, { method: 'GET', headers });

        if (!response.ok) throw new Error(`Error HTTP ${response.status} en ${baseUrl}`);

        const json     = await response.json();
        const items    = json?.data ?? [];
        total          = json?.total ?? items.length;

        todos.push(...items);
        pagina++;
      } while (todos.length < total);

      return todos;
    };
    // ─────────────────────────────────────────────────────────────────────

    // ── PASO 1: Catálogo de materias de SESA ──────────────────────────────
    const materiasSesa = await fetchAllPages(
      `${externalApiUrl}/api/materias/recepcion?_placeholder=1`
    );

    // Mapa codigo_unico → id_materia en SESA
    const mapaMateriasSesa = {};
    for (const m of materiasSesa) {
      mapaMateriasSesa[m.codigo_unico] = m.id_materia;
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── PASO 2: Catálogo de grupos de SESA → encontrar id_grupo_sesa ──────
    const gruposSesa = await fetchAllPages(
      `${externalApiUrl}/api/grupos/recepcion?_placeholder=1`
    );

    // Obtenemos el identificador del grupo local para hacer el match
    const gruposLocales = await pool.query(
      'SELECT id_grupo, identificador FROM grupos WHERE id_grupo = ? LIMIT 1',
      [grupo_id]
    );

    if (!gruposLocales.length) {
      return res.status(404).json({ error: "Grupo no encontrado en SIGAD." });
    }

    const identificadorLocal = gruposLocales[0].identificador;
    const grupoSesa = gruposSesa.find(g => g.identificador === identificadorLocal);

    if (!grupoSesa) {
      return res.status(404).json({
        error: `El grupo "${identificadorLocal}" no fue encontrado en el catálogo de SESA. Verifica que esté sincronizado.`
      });
    }

    const id_grupo_sesa = grupoSesa.id_grupo;
    // ─────────────────────────────────────────────────────────────────────

    // ── PASO 3: Asignaciones locales ABIERTA+ACEPTADA del grupo ───────────
    const asignacionesLocales = await assignmentModel.ObtenerAsignacionesAbiertasPorGrupo(grupo_id);

    if (asignacionesLocales.length === 0) {
      return res.status(200).json({
        mensaje:      "No hay asignaciones ABIERTA+ACEPTADA para este grupo.",
        actualizadas: 0,
        sin_promedio: 0,
      });
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── PASO 4: Por cada materia, consultar promedio en SESA ──────────────
    let actualizadas = 0;
    let sin_promedio = 0;

    for (const asignacion of asignacionesLocales) {
      const id_materia_sesa = mapaMateriasSesa[asignacion.codigo_unico];

      if (!id_materia_sesa) {
        // La materia no existe en SESA aún — la saltamos sin romper el flujo
        console.warn(`[HU-38] Materia "${asignacion.codigo_unico}" no encontrada en catálogo SESA.`);
        sin_promedio++;
        continue;
      }

      try {
        const urlPromedio = `${externalApiUrl}/api/asignaciones/recepcion`
          + `?materia_id=${id_materia_sesa}&grupo_id=${id_grupo_sesa}`;

        const respPromedio = await fetch(urlPromedio, { method: 'GET', headers });

        // 404 de SESA = asignación aún no existe allá
        if (respPromedio.status === 404) {
          sin_promedio++;
          continue;
        }

        if (!respPromedio.ok) {
          console.warn(`[HU-38] Error ${respPromedio.status} al consultar promedio de materia ${asignacion.codigo_unico}`);
          sin_promedio++;
          continue;
        }

        const { promedio_consolidado } = await respPromedio.json();

        // null = calificaciones aún incompletas en SESA
        if (promedio_consolidado === null || promedio_consolidado === undefined) {
          sin_promedio++;
          continue;
        }

        // Cerramos la asignación y guardamos el promedio
        await assignmentModel.cerrarAsignacionConPromedio(
          grupo_id,
          asignacion.materia_id,
          promedio_consolidado,
          usuario_id
        );
        actualizadas++;

      } catch (err) {
        // Error de red por materia individual — no cortamos el loop completo
        console.error(`[HU-38] Error consultando promedio de materia ${asignacion.codigo_unico}:`, err.message);
        sin_promedio++;
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    return res.status(200).json({
      mensaje:      `Sincronización completada. ${actualizadas} asignación(es) cerrada(s) con promedio.`,
      actualizadas,
      sin_promedio,
    });

  } catch (error) {
    console.error("[Error sincronizarPromedios]:", error);
    res.status(500).json({
      error: "Error al sincronizar promedios consolidados con el sistema externo."
    });
  }
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getAsignacionesParaSincronizacion,
  sincronizarReportesExternos,
  createAsignacion,
  getAsignaciones,
  updateAsignacion,
  cancelarAsignacion,
  reactivarAsignacion,
  actualizarConfirmacion,
  ObtenerAsignaciones, // ← nuevo export EP-06 SESA
  sincronizarPromedios, // ← nuevo método HU-38
};