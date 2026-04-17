const pool = require('../config/database');

const nullify = (val) => (val === '' || val === undefined) ? null : val;

const getAsignacionesParaSincronizacion = async (materia_id, grupo_id) => {
  if (!materia_id) return [];
  const gId = nullify(grupo_id);
  const rows = await pool.query(
    `SELECT id_asignacion, docente_id, dia_semana, hora_inicio, hora_fin 
     FROM asignaciones 
     WHERE materia_id = ? AND grupo_id <=> ? AND estatus_acta = 'ABIERTA' 
     ORDER BY dia_semana ASC, hora_inicio ASC`,
    [materia_id, gId]
  );
  return rows;
};

// Validaciones de empalmes (Bulletproof Arrays)

const checkDocenteConflict = async (docente_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds = []) => {
  let query = `
    SELECT a.id_asignacion FROM asignaciones a
    WHERE a.docente_id = ? AND a.periodo_id = ? AND a.dia_semana = ?
      AND a.estatus_acta = 'ABIERTA'
      AND ((a.hora_inicio < ? AND a.hora_fin > ?) OR (a.hora_inicio >= ? AND a.hora_inicio < ?))
  `;
  const params = [docente_id, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin];
  
  if (excludeIds && excludeIds.length > 0) { 
    query += ` AND a.id_asignacion NOT IN (${excludeIds.map(() => '?').join(',')})`; 
    params.push(...excludeIds); 
  }
  
  const rows = await pool.query(query, params);
  return rows.length > 0;
};

const checkGrupoConflict = async (grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds = []) => {
  const gId = nullify(grupo_id);
  if (!gId) return false;
  
  let query = `
    SELECT a.id_asignacion FROM asignaciones a
    WHERE a.grupo_id = ? AND a.periodo_id = ? AND a.dia_semana = ?
      AND a.estatus_acta = 'ABIERTA'
      AND ((a.hora_inicio < ? AND a.hora_fin > ?) OR (a.hora_inicio >= ? AND a.hora_inicio < ?))
  `;
  const params = [gId, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin];
  
  if (excludeIds && excludeIds.length > 0) { 
    query += ` AND a.id_asignacion NOT IN (${excludeIds.map(() => '?').join(',')})`; 
    params.push(...excludeIds); 
  }
  
  const rows = await pool.query(query, params);
  return rows.length > 0;
};

const checkAulaConflict = async (aula_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds = []) => {
  let query = `
    SELECT a.id_asignacion FROM asignaciones a
    WHERE a.aula_id = ? AND a.periodo_id = ? AND a.dia_semana = ?
      AND a.estatus_acta = 'ABIERTA'
      AND ((a.hora_inicio < ? AND a.hora_fin > ?) OR (a.hora_inicio >= ? AND a.hora_inicio < ?))
  `;
  const params = [aula_id, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin];
  
  if (excludeIds && excludeIds.length > 0) { 
    query += ` AND a.id_asignacion NOT IN (${excludeIds.map(() => '?').join(',')})`; 
    params.push(...excludeIds); 
  }
  
  const rows = await pool.query(query, params);
  return rows.length > 0;
};

// Helper: Validar duplicidad de materia en un grupo (Bulletproof Arrays)
const checkMateriaDuplicadaGrupo = async (grupo_id, materia_id, periodo_id, excludeIds = []) => {
  const gId = nullify(grupo_id);
  if (!gId) return false; 

  let query = `
    SELECT a.id_asignacion 
    FROM asignaciones a
    INNER JOIN materias m_asignada ON a.materia_id = m_asignada.id_materia
    INNER JOIN grupos g ON a.grupo_id = g.id_grupo
    CROSS JOIN materias m_nueva 
    WHERE a.periodo_id = ? 
      AND a.grupo_id = ?
      AND m_nueva.id_materia = ?
      AND a.estatus_acta = 'ABIERTA'
      AND m_asignada.codigo_unico = m_nueva.codigo_unico
      AND m_asignada.cuatrimestre_id = g.cuatrimestre_id
      AND m_nueva.cuatrimestre_id = g.cuatrimestre_id
      AND m_asignada.nivel_academico = g.nivel_academico
      AND m_nueva.nivel_academico = g.nivel_academico
  `;
  const params = [periodo_id, gId, materia_id];
  
  if (excludeIds && excludeIds.length > 0) {
    query += ` AND a.id_asignacion NOT IN (${excludeIds.map(() => '?').join(',')})`;
    params.push(...excludeIds);
  }
  
  const rows = await pool.query(query, params);
  return rows.length > 0;
};

// Helper: Validar si la materia ya fue asignada a un grupo diferente
const checkMateriaAsignadaAOtroGrupo = async (materia_id, grupo_id, periodo_id, excludeIds = []) => {
  const gId = nullify(grupo_id);
  
  // Usamos NOT (grupo_id <=> ?) para manejar correctamente los valores NULL (Tronco común / globales)
  // Si la materia ya está asignada a CUALQUIER otro grupo (o a un nulo vs un id real), devolverá true.
  let query = `
    SELECT id_asignacion 
    FROM asignaciones 
    WHERE materia_id = ? 
      AND periodo_id = ? 
      AND NOT (grupo_id <=> ?) 
      AND estatus_acta = 'ABIERTA'
  `;
  const params = [materia_id, periodo_id, gId];
  
  if (excludeIds && excludeIds.length > 0) {
    query += ` AND id_asignacion NOT IN (${excludeIds.map(() => '?').join(',')})`;
    params.push(...excludeIds);
  }
  
  const rows = await pool.query(query, params);
  return rows.length > 0; // Devuelve true si hay conflicto (ya está en otro grupo)
};

const checkReglasNegocioAsignacion = async (materia_id, grupo_id, docente_id, periodo_id) => {
  const gId = nullify(grupo_id);
  if (gId) {
    const rows = await pool.query(`
      SELECT m.id_materia FROM materias m
      INNER JOIN grupos g ON g.id_grupo = ?
      INNER JOIN carreras c ON c.id_carrera = g.carrera_id
      INNER JOIN docentes d ON d.id_docente = ?
      WHERE m.id_materia = ? 
        AND (m.carrera_id = g.carrera_id OR m.tipo_asignatura = 'TRONCO_COMUN')
        AND m.cuatrimestre_id = g.cuatrimestre_id
        AND d.academia_id = c.academia_id
        AND m.periodo_id = ?
    `, [gId, docente_id, materia_id, periodo_id]);
    return rows.length > 0;
  } else {
    const rows = await pool.query(`
      SELECT m.id_materia FROM materias m
      INNER JOIN docentes d ON d.id_docente = ?
      WHERE m.id_materia = ? 
        AND m.tipo_asignatura = 'TRONCO_COMUN'
        AND m.periodo_id = ?
    `, [docente_id, materia_id, periodo_id]);
    return rows.length > 0;
  }
};

const checkNivelAcademico = async (docente_id, grupo_id, materia_id) => {
  const gId = nullify(grupo_id);
  if (gId) {
    const rows = await pool.query(`
      SELECT d.nivel_academico AS docente_nivel, g.nivel_academico AS grupo_nivel, m.nivel_academico AS materia_nivel
      FROM docentes d, grupos g, materias m
      WHERE d.id_docente = ? AND g.id_grupo = ? AND m.id_materia = ?
    `, [docente_id, gId, materia_id]);
    return rows[0];
  } else {
    const rows = await pool.query(`
      SELECT d.nivel_academico AS docente_nivel, m.nivel_academico AS grupo_nivel, m.nivel_academico AS materia_nivel
      FROM docentes d, materias m
      WHERE d.id_docente = ? AND m.id_materia = ?
    `, [docente_id, materia_id]);
    return rows[0];
  }
};

const marcarReporteExternoMasivo = async (periodo_id, grupo_id, docentesReportadosIds) => {
  if (!docentesReportadosIds || docentesReportadosIds.length === 0) return 0;
  const gId = nullify(grupo_id);
  const result = await pool.query(
    `UPDATE asignaciones SET tiene_reporte_externo = 1 WHERE periodo_id = ? AND grupo_id <=> ? AND docente_id IN (?) AND estatus_acta = 'ABIERTA'`,
    [periodo_id, gId, docentesReportadosIds]
  );
  return result.affectedRows;
};

// Calcula el total de horas asignadas y materias a un docente leyendo 
// TODOS los límites desde la tabla de configuración.
const getTotalHorasDocente = async (docente_id, periodo_id, asignacion_id_excluir = null) => {
  let query = `
    SELECT 
      COALESCE(SUM(TIMESTAMPDIFF(MINUTE, a.hora_inicio, a.hora_fin)) / 60, 0) AS total_horas,
      COUNT(DISTINCT CONCAT(a.materia_id, '_', IFNULL(a.grupo_id, 'GLOBAL'))) AS asignaciones_actuales,
      (SELECT valor FROM configuracion WHERE clave = 'max_horas_semana') AS limite_horas,
      (SELECT valor FROM configuracion WHERE clave = 'max_horas_continuas') AS max_horas_continuas,
      (SELECT valor FROM configuracion WHERE clave = 'max_asignaciones_docente') AS max_asignaciones_docente
    FROM asignaciones a
    WHERE a.docente_id = ? 
      AND a.periodo_id = ? 
      AND a.estatus_acta = 'ABIERTA'
      AND a.estatus_confirmacion != 'RECHAZADA'
  `;
  const params = [docente_id, periodo_id];

  if (asignacion_id_excluir) {
    if (Array.isArray(asignacion_id_excluir) && asignacion_id_excluir.length > 0) {
      query += ` AND a.id_asignacion NOT IN (${asignacion_id_excluir.map(() => '?').join(',')})`;
      params.push(...asignacion_id_excluir);
    } else if (!Array.isArray(asignacion_id_excluir)) {
      query += ` AND a.id_asignacion != ?`;
      params.push(asignacion_id_excluir);
    }
  }
  const rows = await pool.query(query, params);
  
  return {
    total_horas: Number(rows[0].total_horas) || 0,
    asignaciones_actuales: Number(rows[0].asignaciones_actuales) || 0,
    limite_horas: Number(rows[0].limite_horas) || 18,
    max_horas_continuas: Number(rows[0].max_horas_continuas) || 3,
    max_asignaciones_docente: Number(rows[0].max_asignaciones_docente) || 6
  };
};

const createAsignaciones = async (asignacionesData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (asignacionesData.length > 0) {
      const { periodo_id, materia_id, docente_id, grupo_id, creado_por } = asignacionesData[0];
      const gId = nullify(grupo_id);
      await connection.query(`
        UPDATE asignaciones 
        SET estatus_confirmacion = 'ENVIADA', modificado_por = ?, fecha_modificacion = NOW()
        WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'ABIERTA'
      `, [creado_por, periodo_id, materia_id, docente_id, gId]);
    }
    const insertQuery = `
      INSERT INTO asignaciones (
        periodo_id, materia_id, docente_id, grupo_id, aula_id, 
        dia_semana, hora_inicio, hora_fin, creado_por, fecha_creacion, estatus_confirmacion, estatus_acta, tiene_reporte_externo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'ENVIADA', 'ABIERTA', 0)
    `;
    const insertedIds = [];
    for (const data of asignacionesData) {
      const gId = nullify(data.grupo_id);
      const result = await connection.query(insertQuery, [
        data.periodo_id, data.materia_id, data.docente_id, gId, data.aula_id,
        data.dia_semana, data.hora_inicio, data.hora_fin, data.creado_por
      ]);
      insertedIds.push(result.insertId);
    }
    await connection.commit();
    return insertedIds;
  } catch (error) {
    await connection.rollback(); throw error;
  } finally {
    connection.release();
  }
};

const obtenerTodasLasAsignaciones = async (filters = {}) => {
  let query = `
    SELECT 
      a.id_asignacion, a.periodo_id, a.materia_id, a.grupo_id, a.aula_id,
      a.dia_semana, a.hora_inicio, a.hora_fin, a.estatus_confirmacion, a.estatus_acta,
      a.tiene_reporte_externo,
      p.codigo AS nombre_periodo, m.nombre AS nombre_materia, 
      m.codigo_unico, m.nivel_academico, 
      IFNULL(g.identificador, 'TRONCO COMÚN / GLOBAL') AS nombre_grupo,
      au.nombre_codigo AS nombre_aula, a.docente_id, u.nombres AS docente_nombres,
      u.apellido_paterno AS docente_apellido_paterno, u.apellido_materno AS docente_apellido_materno
    FROM asignaciones a
    INNER JOIN periodos p ON a.periodo_id = p.id_periodo
    INNER JOIN materias m ON a.materia_id = m.id_materia
    LEFT JOIN grupos g ON a.grupo_id = g.id_grupo
    INNER JOIN aulas au ON a.aula_id = au.id_aula
    INNER JOIN docentes d ON a.docente_id = d.id_docente
    INNER JOIN usuarios u ON d.usuario_id = u.id_usuario
    WHERE a.estatus_acta IN ('ABIERTA', 'CERRADA')
  `;
  const queryParams = [];
  if (filters.periodo_id) { query += ` AND a.periodo_id = ?`; queryParams.push(filters.periodo_id); }
  if (filters.docente_id) { query += ` AND a.docente_id = ?`; queryParams.push(filters.docente_id); }
  if (filters.grupo_id !== undefined) {
    query += ` AND a.grupo_id <=> ?`;
    queryParams.push(nullify(filters.grupo_id));
  }
  
  if (filters.materia_id) { 
    query += ` AND a.materia_id = ?`; 
    queryParams.push(filters.materia_id); 
  }
  if (filters.carrera_id) { 
    query += ` AND (m.carrera_id = ? OR g.carrera_id = ?)`; 
    queryParams.push(filters.carrera_id, filters.carrera_id); 
  }

  query += ` ORDER BY p.fecha_inicio DESC, u.apellido_paterno ASC, a.dia_semana ASC, a.hora_inicio ASC`;
  return await pool.query(query, queryParams);
};

const updateAsignacionesAgrupadas = async (periodo_id, materia_id, docente_id, grupo_id, asignacionesData, usuario_id) => {
  const connection = await pool.getConnection();
  const gId = nullify(grupo_id);
  try {
    await connection.beginTransaction();
    await connection.query(`
      UPDATE asignaciones 
      SET estatus_acta = 'HISTORIAL', eliminado_por = ?, fecha_eliminacion = NOW()
      WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'ABIERTA'
    `, [usuario_id, periodo_id, materia_id, docente_id, gId]);
    const insertQuery = `
      INSERT INTO asignaciones (
        periodo_id, materia_id, docente_id, grupo_id, aula_id, 
        dia_semana, hora_inicio, hora_fin, modificado_por, fecha_modificacion, estatus_confirmacion, estatus_acta, tiene_reporte_externo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'ENVIADA', 'ABIERTA', 0)
    `;
    const insertedIds = [];
    for (const data of asignacionesData) {
      const insertGId = nullify(data.grupo_id);
      const result = await connection.query(insertQuery, [
        data.periodo_id, data.materia_id, data.docente_id, insertGId, data.aula_id,
        data.dia_semana, data.hora_inicio, data.hora_fin, data.modificado_por
      ]);
      insertedIds.push(result.insertId);
    }
    await connection.commit();
    return insertedIds;
  } catch (error) {
    await connection.rollback(); throw error;
  } finally {
    connection.release();
  }
};

const getIdsAsignacionAgrupada = async (periodo_id, materia_id, docente_id, grupo_id) => {
  const gId = nullify(grupo_id);
  const rows = await pool.query(`
    SELECT id_asignacion FROM asignaciones 
    WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'ABIERTA'
  `, [periodo_id, materia_id, docente_id, gId]);
  return rows.map(r => r.id_asignacion);
};

const cancelarAsignacionAgrupada = async (periodo_id, materia_id, docente_id, grupo_id, usuario_id) => {
  const gId = nullify(grupo_id);
  const result = await pool.query(`
    UPDATE asignaciones 
    SET estatus_acta = 'CERRADA', eliminado_por = ?, fecha_eliminacion = NOW()
    WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'ABIERTA'
  `, [usuario_id, periodo_id, materia_id, docente_id, gId]);
  return result.affectedRows;
};

const getHorariosAsignacionCerrada = async (periodo_id, materia_id, docente_id, grupo_id) => {
  const gId = nullify(grupo_id);
  const rows = await pool.query(`
    SELECT dia_semana, hora_inicio, hora_fin, aula_id 
    FROM asignaciones 
    WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'CERRADA'
  `, [periodo_id, materia_id, docente_id, gId]);
  return rows;
};

const reactivarAsignacionAgrupada = async (periodo_id, materia_id, docente_id, grupo_id, usuario_id) => {
  const gId = nullify(grupo_id);
  const result = await pool.query(`
    UPDATE asignaciones 
    SET estatus_acta = 'ABIERTA', estatus_confirmacion = 'ENVIADA',
        eliminado_por = NULL, fecha_eliminacion = NULL,
        modificado_por = ?, fecha_modificacion = NOW()
    WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'CERRADA'
  `, [usuario_id, periodo_id, materia_id, docente_id, gId]);
  return result.affectedRows;
};

const actualizarConfirmacionDocente = async (periodo_id, materia_id, docente_id, grupo_id, nuevo_estatus, usuario_id) => {
  const gId = nullify(grupo_id);
  const result = await pool.query(`
    UPDATE asignaciones 
    SET estatus_confirmacion = ?, modificado_por = ?, fecha_modificacion = NOW()
    WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'ABIERTA'
  `, [nuevo_estatus, usuario_id, periodo_id, materia_id, docente_id, gId]);
  return result.affectedRows;
};

const rechazarAsignacionesPorDocente = async (docente_id, usuario_id) => {
  const result = await pool.query(`
    UPDATE asignaciones
    SET estatus_confirmacion = 'RECHAZADA', modificado_por = ?, fecha_modificacion = NOW()
    WHERE docente_id = ? AND estatus_confirmacion = 'ENVIADA' AND estatus_acta = 'ABIERTA'
  `, [usuario_id, docente_id]);
  return result.affectedRows;
};

const rechazarAsignacionesPorGrupo = async (grupo_id, usuario_id) => {
  const gId = nullify(grupo_id);
  if (!gId) return 0;
  const result = await pool.query(`
    UPDATE asignaciones
    SET estatus_confirmacion = 'RECHAZADA', modificado_por = ?, fecha_modificacion = NOW()
    WHERE grupo_id <=> ? AND estatus_confirmacion = 'ENVIADA' AND estatus_acta = 'ABIERTA'
  `, [usuario_id, gId]);
  return result.affectedRows;
};

const rechazarAsignacionesPorAula = async (aula_id, usuario_id) => {
  const result = await pool.query(`
    UPDATE asignaciones
    SET estatus_confirmacion = 'RECHAZADA', modificado_por = ?, fecha_modificacion = NOW()
    WHERE aula_id = ? AND estatus_confirmacion = 'ENVIADA' AND estatus_acta = 'ABIERTA'
  `, [usuario_id, aula_id]);
  return result.affectedRows;
};

const rechazarAsignacionesPorMateria = async (materia_id, usuario_id) => {
  const result = await pool.query(`
    UPDATE asignaciones
    SET estatus_confirmacion = 'RECHAZADA', modificado_por = ?, fecha_modificacion = NOW()
    WHERE materia_id = ? AND estatus_confirmacion = 'ENVIADA' AND estatus_acta = 'ABIERTA'
  `, [usuario_id, materia_id]);
  return result.affectedRows;
};

const rechazarAsignacionesPorCarrera = async (carrera_id, usuario_id) => {
  const result = await pool.query(`
    UPDATE asignaciones a
    LEFT JOIN materias m ON a.materia_id = m.id_materia
    LEFT JOIN grupos g ON a.grupo_id = g.id_grupo
    SET a.estatus_confirmacion = 'RECHAZADA', a.modificado_por = ?, a.fecha_modificacion = NOW()
    WHERE (m.carrera_id = ? OR g.carrera_id = ?)
      AND a.estatus_confirmacion = 'ENVIADA' 
      AND a.estatus_acta = 'ABIERTA'
  `, [usuario_id, carrera_id, carrera_id]);
  return result.affectedRows;
};
const rechazarAsignacionesPorAcademia = async (academia_id, usuario_id) => {
  const result = await pool.query(`
    UPDATE asignaciones a
    INNER JOIN materias m ON a.materia_id = m.id_materia
    INNER JOIN carreras c ON m.carrera_id = c.id_carrera
    SET a.estatus_confirmacion = 'RECHAZADA', a.modificado_por = ?, a.fecha_modificacion = NOW()
    WHERE c.academia_id = ?
      AND a.estatus_confirmacion = 'ENVIADA' 
      AND a.estatus_acta = 'ABIERTA'
  `, [usuario_id, academia_id]);
  return result.affectedRows;
};

// ─── EP-06 SESA: GET /asignaciones/catalogo ───────────────────────────────────────────
// Filtros implícitos: periodo activo + estatus_acta = ABIERTA + estatus_confirmacion = ACEPTADA.
// Filtros opcionales: grupo_id, materia_id, docente_id.
//
// PROBLEMA DE IDENTIDAD:
// En SIGAD cada fila de asignaciones tiene su propio id_asignacion único.
// SESA espera que los bloques del mismo grupo+materia+docente+aula compartan
// el mismo id_asignacion (una fila por día, mismo id).
//
// SOLUCIÓN: Subquery que calcula MIN(id_asignacion) agrupado por la clave
// lógica (grupo_id, materia_id, docente_id, periodo_id, aula_id).
// Ese MIN actúa como ID estable y representativo para SESA.
// Las versiones HISTORIAL quedan excluidas automáticamente por el filtro ABIERTA.
const ObtenerAsignaciones = async ({ grupo_id, materia_id, docente_id } = {}) => {
  const filtros = [
    `a.estatus_acta = 'ABIERTA'`,
    `a.estatus_confirmacion = 'ACEPTADA'`,
    `p.estatus = 'ACTIVO'`,
  ];
  const params = [];

  if (grupo_id)   { filtros.push(`a.grupo_id <=> ?`); params.push(nullify(grupo_id)); }
  if (materia_id) { filtros.push(`a.materia_id = ?`); params.push(materia_id); }
  if (docente_id) { filtros.push(`a.docente_id = ?`); params.push(docente_id); }

  // ─── Subquery SIN filtro de estatus_acta ─────────────────────────────────
  // Al no filtrar por estatus, MIN(id_asignacion) siempre devuelve el ID
  // original de esa combinación lógica, incluso si esos registros ya son
  // HISTORIAL. Así el external_id que SESA guardó en su primera llamada
  // sigue siendo válido en llamadas posteriores.
  const subFiltros = [];
  const subParams  = [];

  if (grupo_id)   { subFiltros.push(`grupo_id <=> ?`); subParams.push(nullify(grupo_id)); }
  if (materia_id) { subFiltros.push(`materia_id = ?`); subParams.push(materia_id); }
  if (docente_id) { subFiltros.push(`docente_id = ?`); subParams.push(docente_id); }
  // ─────────────────────────────────────────────────────────────────────────

  const where    = filtros.join(' AND ');
  const subWhere = subFiltros.length > 0 ? `WHERE ${subFiltros.join(' AND ')}` : '';

  const rows = await pool.query(`
    SELECT
      rep.min_id   AS id_asignacion,
      a.grupo_id,
      a.materia_id,
      a.docente_id,
      a.periodo_id,
      a.aula_id,
      a.dia_semana,
      TIME_FORMAT(a.hora_inicio, '%H:%i') AS hora_inicio,
      TIME_FORMAT(a.hora_fin,    '%H:%i') AS hora_fin
    FROM asignaciones a
    INNER JOIN periodos p ON a.periodo_id = p.id_periodo
    INNER JOIN (
      SELECT MIN(id_asignacion) AS min_id, grupo_id, materia_id, docente_id, periodo_id, aula_id
      FROM asignaciones ${subWhere}
      GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
    ) rep ON a.grupo_id <=> rep.grupo_id AND a.materia_id = rep.materia_id AND a.docente_id = rep.docente_id AND a.periodo_id = rep.periodo_id AND a.aula_id = rep.aula_id
    WHERE ${where}
    ORDER BY rep.min_id ASC, a.dia_semana ASC
  `, [...subParams, ...params]);

  return rows;
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── HU-38: Métodos para sincronización de promedios consolidados ─────────────
// Devuelve las asignaciones ABIERTA+ACEPTADA de un grupo con el codigo_unico
// de la materia para hacer el match contra el catálogo de SESA.
const ObtenerAsignacionesAbiertasPorGrupo = async (grupo_id) => {
  const gId = nullify(grupo_id);
  const rows = await pool.query(`
    SELECT DISTINCT a.materia_id, m.codigo_unico, m.nombre AS nombre_materia
    FROM asignaciones a
    INNER JOIN materias m ON a.materia_id = m.id_materia
    WHERE a.grupo_id <=> ? AND a.estatus_acta = 'ABIERTA' AND a.estatus_confirmacion = 'ACEPTADA'
    ORDER BY a.materia_id ASC
  `, [gId]);
  return rows;
};

// Cierra todas las filas ABIERTA de una asignación lógica (grupo+materia)
// y guarda el promedio_consolidado recibido desde SESA.
const cerrarAsignacionConPromedio = async (grupo_id, materia_id, promedio, usuario_id) => {
  const gId = nullify(grupo_id);
  const result = await pool.query(`
    UPDATE asignaciones SET estatus_acta = 'CERRADA', promedio_consolidado = ?, modificado_por = ?, fecha_modificacion = NOW()
    WHERE grupo_id <=> ? AND materia_id = ? AND estatus_acta = 'ABIERTA'
  `, [promedio, usuario_id, gId, materia_id]);
  return result.affectedRows;
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getAsignacionesParaSincronizacion, checkDocenteConflict, checkGrupoConflict, checkAulaConflict,
  checkMateriaDuplicadaGrupo, checkReglasNegocioAsignacion, checkNivelAcademico, marcarReporteExternoMasivo, 
  createAsignaciones, getTotalHorasDocente, obtenerTodasLasAsignaciones, updateAsignacionesAgrupadas, 
  getIdsAsignacionAgrupada, cancelarAsignacionAgrupada, getHorariosAsignacionCerrada, reactivarAsignacionAgrupada, 
  actualizarConfirmacionDocente, rechazarAsignacionesPorDocente, rechazarAsignacionesPorGrupo, rechazarAsignacionesPorAula,
  ObtenerAsignaciones, ObtenerAsignacionesAbiertasPorGrupo, cerrarAsignacionConPromedio, checkMateriaAsignadaAOtroGrupo, rechazarAsignacionesPorMateria, rechazarAsignacionesPorCarrera, rechazarAsignacionesPorAcademia
};