const pool = require('../config/database');

// Helper para asegurar que grupo nulo se trate como NULL en BD y no como string vacío
const nullify = (val) => (val === '' || val === undefined) ? null : val;

// API de sincronización externa: Solo enviamos clases activas
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

// ==========================================
// Validaciones de empalmes (Solo evaluamos contra ABIERTAS)
// ==========================================

const checkDocenteConflict = async (docente_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds = []) => {
  let query = `
    SELECT a.id_asignacion FROM asignaciones a
    WHERE a.docente_id = ? AND a.periodo_id = ? AND a.dia_semana = ?
      AND a.estatus_acta = 'ABIERTA'
      AND ((a.hora_inicio < ? AND a.hora_fin > ?) OR (a.hora_inicio >= ? AND a.hora_inicio < ?))
  `;
  const params = [docente_id, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin];
  if (excludeIds.length > 0) { query += ` AND a.id_asignacion NOT IN (?)`; params.push(excludeIds); }
  const rows = await pool.query(query, params);
  return rows.length > 0;
};

const checkGrupoConflict = async (grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin, excludeIds = []) => {
  const gId = nullify(grupo_id);
  if (!gId) return false; // Si es tronco común global sin grupo, no choca a nivel de grupo

  let query = `
    SELECT a.id_asignacion FROM asignaciones a
    WHERE a.grupo_id = ? AND a.periodo_id = ? AND a.dia_semana = ?
      AND a.estatus_acta = 'ABIERTA'
      AND ((a.hora_inicio < ? AND a.hora_fin > ?) OR (a.hora_inicio >= ? AND a.hora_inicio < ?))
  `;
  const params = [gId, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin];
  if (excludeIds.length > 0) { query += ` AND a.id_asignacion NOT IN (?)`; params.push(excludeIds); }
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
  if (excludeIds.length > 0) { query += ` AND a.id_asignacion NOT IN (?)`; params.push(excludeIds); }
  const rows = await pool.query(query, params);
  return rows.length > 0;
};

const checkReglasNegocioAsignacion = async (materia_id, grupo_id, docente_id, periodo_id) => {
  const gId = nullify(grupo_id);
  
  if (gId) {
    // Validación estándar para asignaciones con grupo
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
    // Si no hay grupo (gId === null), solo comprobamos que sea Tronco Común
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
      SELECT 
        d.nivel_academico AS docente_nivel, 
        g.nivel_academico AS grupo_nivel,
        m.nivel_academico AS materia_nivel
      FROM docentes d, grupos g, materias m
      WHERE d.id_docente = ? AND g.id_grupo = ? AND m.id_materia = ?
    `, [docente_id, gId, materia_id]);
    return rows[0];
  } else {
    // Si no hay grupo, usamos el nivel de la materia como fallback
    const rows = await pool.query(`
      SELECT 
        d.nivel_academico AS docente_nivel, 
        m.nivel_academico AS grupo_nivel, 
        m.nivel_academico AS materia_nivel
      FROM docentes d, materias m
      WHERE d.id_docente = ? AND m.id_materia = ?
    `, [docente_id, materia_id]);
    return rows[0];
  }
};

// ==========================================
// MARCAR REPORTE EXTERNO SEGÚN MATCH (HU-39)
// ==========================================
const marcarReporteExternoMasivo = async (periodo_id, grupo_id, docentesReportadosIds) => {
  if (!docentesReportadosIds || docentesReportadosIds.length === 0) return 0;
  const gId = nullify(grupo_id);
  
  const result = await pool.query(
    `UPDATE asignaciones 
     SET tiene_reporte_externo = 1 
     WHERE periodo_id = ? 
       AND grupo_id <=> ? 
       AND docente_id IN (?) 
       AND estatus_acta = 'ABIERTA'`,
    [periodo_id, gId, docentesReportadosIds]
  );
  return result.affectedRows;
};

// ==========================================
// Transacciones
// ==========================================

const createAsignaciones = async (asignacionesData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (asignacionesData.length > 0) {
      const { periodo_id, materia_id, docente_id, grupo_id, creado_por } = asignacionesData[0];
      const gId = nullify(grupo_id);
      await connection.query(`
        UPDATE asignaciones 
        SET estatus_confirmacion = 'ENVIADA',
            modificado_por = ?,
            fecha_modificacion = NOW()
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

const getAllAsignaciones = async (filters = {}) => {
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
    LEFT JOIN grupos g ON a.grupo_id = g.id_grupo /* ✨ AHORA USAMOS LEFT JOIN PARA ACEPTAR NULOS ✨ */
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
    WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? 
      AND estatus_acta = 'CERRADA'
  `, [periodo_id, materia_id, docente_id, gId]);
  return rows;
};

const reactivarAsignacionAgrupada = async (periodo_id, materia_id, docente_id, grupo_id, usuario_id) => {
  const gId = nullify(grupo_id);
  const result = await pool.query(`
    UPDATE asignaciones 
    SET estatus_acta = 'ABIERTA', 
        estatus_confirmacion = 'ENVIADA',
        eliminado_por = NULL, 
        fecha_eliminacion = NULL,
        modificado_por = ?, 
        fecha_modificacion = NOW()
    WHERE periodo_id = ? AND materia_id = ? AND docente_id = ? AND grupo_id <=> ? AND estatus_acta = 'CERRADA'
  `, [usuario_id, periodo_id, materia_id, docente_id, gId]);
  return result.affectedRows;
};

const actualizarConfirmacionDocente = async (periodo_id, materia_id, docente_id, grupo_id, nuevo_estatus, usuario_id) => {
  const gId = nullify(grupo_id);
  const result = await pool.query(`
    UPDATE asignaciones 
    SET estatus_confirmacion = ?, 
        modificado_por = ?, 
        fecha_modificacion = NOW()
    WHERE periodo_id = ? 
      AND materia_id = ? 
      AND docente_id = ? 
      AND grupo_id <=> ? 
      AND estatus_acta = 'ABIERTA'
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

// ==========================================
// Suma de horas semanales del docente en el periodo (solo ABIERTA)
// Excluye los IDs pasados (para la validación de modificación)
// ==========================================
const getTotalHorasDocente = async (docente_id, periodo_id, excludeIds = []) => {
  let query = `
    SELECT COALESCE(
      SUM(TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio)) / 3600), 0
    ) AS total_horas
    FROM asignaciones
    WHERE docente_id = ? AND periodo_id = ? AND estatus_acta = 'ABIERTA'
  `;
  const params = [docente_id, periodo_id];
  if (excludeIds.length > 0) {
    query += ' AND id_asignacion NOT IN (?)';
    params.push(excludeIds);
  }
  const rows = await pool.query(query, params);
  return parseFloat(rows[0].total_horas) || 0;
};

// ==========================================
// Cuenta asignaciones (materias únicas) del docente en el periodo
// ==========================================
const countAsignacionesDocente = async (docente_id, periodo_id, excludeMateria = null) => {
  let query = `
    SELECT COUNT(DISTINCT materia_id) AS total
    FROM asignaciones
    WHERE docente_id = ? AND periodo_id = ? AND estatus_acta = 'ABIERTA'
  `;
  const params = [docente_id, periodo_id];
  if (excludeMateria) {
    query += ' AND materia_id != ?';
    params.push(excludeMateria);
  }
  const rows = await pool.query(query, params);
  return parseInt(rows[0].total) || 0;
};

// ==========================================
// Suma de horas semanales del docente en el periodo (solo ABIERTA)
// Excluye los IDs pasados (para la validación de modificación)
// ==========================================
const getTotalHorasDocente = async (docente_id, periodo_id, excludeIds = []) => {
  let query = `
    SELECT COALESCE(
      SUM(TIME_TO_SEC(TIMEDIFF(hora_fin, hora_inicio)) / 3600), 0
    ) AS total_horas
    FROM asignaciones
    WHERE docente_id = ? AND periodo_id = ? AND estatus_acta = 'ABIERTA'
  `;
  const params = [docente_id, periodo_id];
  if (excludeIds.length > 0) {
    query += ' AND id_asignacion NOT IN (?)';
    params.push(excludeIds);
  }
  const rows = await pool.query(query, params);
  return parseFloat(rows[0].total_horas) || 0;
};

// ==========================================
// Cuenta asignaciones (materias únicas) del docente en el periodo
// ==========================================
const countAsignacionesDocente = async (docente_id, periodo_id, excludeMateria = null) => {
  let query = `
    SELECT COUNT(DISTINCT materia_id) AS total
    FROM asignaciones
    WHERE docente_id = ? AND periodo_id = ? AND estatus_acta = 'ABIERTA'
  `;
  const params = [docente_id, periodo_id];
  if (excludeMateria) {
    query += ' AND materia_id != ?';
    params.push(excludeMateria);
  }
  const rows = await pool.query(query, params);
  return parseInt(rows[0].total) || 0;
};

module.exports = {
  getAsignacionesParaSincronizacion, checkDocenteConflict, checkGrupoConflict, checkAulaConflict,
  checkReglasNegocioAsignacion, checkNivelAcademico, marcarReporteExternoMasivo, createAsignaciones, 
  getAllAsignaciones, updateAsignacionesAgrupadas, getIdsAsignacionAgrupada, cancelarAsignacionAgrupada, 
  getHorariosAsignacionCerrada, reactivarAsignacionAgrupada, actualizarConfirmacionDocente, 
  rechazarAsignacionesPorDocente, rechazarAsignacionesPorGrupo,
  getTotalHorasDocente, countAsignacionesDocente
};