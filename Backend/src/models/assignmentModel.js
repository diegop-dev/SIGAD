const pool = require('../config/database');

// API de sincronización externa (HU-37 / API-05)
const getAsignacionesParaSincronizacion = async (materia_id, grupo_id) => {
  // validación de parámetros para evitar consultas mal formadas
  if (!materia_id || !grupo_id) {
    return [];
  }

  // consulta optimizada sin JOINs, proyectando estrictamente lo solicitado en el PDF
  const rows = await pool.query(` SELECT id_asignacion, docente_id, dia_semana, hora_inicio, hora_fin FROM asignaciones WHERE materia_id = ? AND grupo_id = ? AND estatus_acta != 'CERRADA' ORDER BY dia_semana ASC, hora_inicio ASC `, [materia_id, grupo_id]);
  return rows;
};

// ==========================================
// Validaciones de cruce de horarios (HU-33)
// ==========================================

const checkDocenteConflict = async (docente_id, periodo_id, dia_semana, hora_inicio, hora_fin) => {
  const rows = await pool.query(`
    SELECT a.id_asignacion 
    FROM asignaciones a
    WHERE a.docente_id = ? 
      AND a.periodo_id = ? 
      AND a.dia_semana = ?
      AND a.estatus_acta != 'CERRADA'
      AND (
        (a.hora_inicio < ? AND a.hora_fin > ?) OR
        (a.hora_inicio >= ? AND a.hora_inicio < ?)
      )
  `, [docente_id, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin]);
  
  return rows.length > 0;
};

const checkGrupoConflict = async (grupo_id, periodo_id, dia_semana, hora_inicio, hora_fin) => {
  const rows = await pool.query(`
    SELECT a.id_asignacion 
    FROM asignaciones a
    WHERE a.grupo_id = ? 
      AND a.periodo_id = ? 
      AND a.dia_semana = ?
      AND a.estatus_acta != 'CERRADA'
      AND (
        (a.hora_inicio < ? AND a.hora_fin > ?) OR
        (a.hora_inicio >= ? AND a.hora_inicio < ?)
      )
  `, [grupo_id, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin]);
  
  return rows.length > 0;
};

const checkAulaConflict = async (aula_id, periodo_id, dia_semana, hora_inicio, hora_fin) => {
  const rows = await pool.query(`
    SELECT a.id_asignacion 
    FROM asignaciones a
    WHERE a.aula_id = ? 
      AND a.periodo_id = ? 
      AND a.dia_semana = ?
      AND a.estatus_acta != 'CERRADA'
      AND (
        (a.hora_inicio < ? AND a.hora_fin > ?) OR
        (a.hora_inicio >= ? AND a.hora_inicio < ?)
      )
  `, [aula_id, periodo_id, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin]);
  
  return rows.length > 0;
};

// ==========================================
// Validación de congruencia académica integral
// ==========================================

const checkReglasNegocioAsignacion = async (materia_id, grupo_id, docente_id) => {
  // ejecuta la validación cruzada múltiple proyectando solo el id para minimizar la carga de memoria
  const rows = await pool.query(`
    SELECT m.id_materia 
    FROM materias m
    INNER JOIN grupos g ON g.id_grupo = ?
    INNER JOIN carreras c ON c.id_carrera = g.carrera_id
    INNER JOIN docentes d ON d.id_docente = ?
    WHERE m.id_materia = ? 
      AND (m.carrera_id = g.carrera_id OR m.tipo_asignatura = 'TRONCO_COMUN')
      AND m.cuatrimestre_id = g.cuatrimestre_id
      AND d.academia_id = c.academia_id
  `, [grupo_id, docente_id, materia_id]);
  
  // retorna true si todas las reglas académicas se cumplen, false si hay alguna incongruencia
  return rows.length > 0;
};

// ==========================================
// Transacción de creación (HU-33)
// ==========================================

const createAsignaciones = async (asignacionesData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO asignaciones (
        periodo_id, 
        materia_id, 
        docente_id, 
        grupo_id, 
        aula_id, 
        dia_semana, 
        hora_inicio, 
        hora_fin, 
        creado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertedIds = [];

    for (const data of asignacionesData) {
      const result = await connection.query(insertQuery, [
        data.periodo_id,
        data.materia_id,
        data.docente_id,
        data.grupo_id,
        data.aula_id,
        data.dia_semana,
        data.hora_inicio,
        data.hora_fin,
        data.creado_por
      ]);
      insertedIds.push(result.insertId);
    }

    await connection.commit();
    return insertedIds;

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ==========================================
// Consulta relacional con filtros (HU-34)
// ==========================================

const getAllAsignaciones = async (filters = {}) => {
  let query = `
    SELECT 
      a.id_asignacion,
      a.dia_semana,
      a.hora_inicio,
      a.hora_fin,
      a.estatus_confirmacion,
      a.estatus_acta,
      p.codigo AS nombre_periodo,
      m.nombre AS nombre_materia,
      g.identificador AS nombre_grupo,
      au.nombre_codigo AS nombre_aula,
      a.docente_id,
      u.nombres AS docente_nombres,
      u.apellido_paterno AS docente_apellido_paterno,
      u.apellido_materno AS docente_apellido_materno
    FROM asignaciones a
    INNER JOIN periodos p ON a.periodo_id = p.id_periodo
    INNER JOIN materias m ON a.materia_id = m.id_materia
    INNER JOIN grupos g ON a.grupo_id = g.id_grupo
    INNER JOIN aulas au ON a.aula_id = au.id_aula
    INNER JOIN docentes d ON a.docente_id = d.id_docente
    INNER JOIN usuarios u ON d.usuario_id = u.id_usuario
    WHERE a.estatus_acta != 'CERRADA'
  `;

  const queryParams = [];

  if (filters.periodo_id) {
    query += ` AND a.periodo_id = ?`;
    queryParams.push(filters.periodo_id);
  }
  if (filters.docente_id) {
    query += ` AND a.docente_id = ?`;
    queryParams.push(filters.docente_id);
  }
  if (filters.grupo_id) {
    query += ` AND a.grupo_id = ?`;
    queryParams.push(filters.grupo_id);
  }

  query += ` ORDER BY p.fecha_inicio DESC, u.apellido_paterno ASC, a.dia_semana ASC, a.hora_inicio ASC`;

  const rows = await pool.query(query, queryParams);
  return rows;
};

module.exports = {
  getAsignacionesParaSincronizacion,
  checkDocenteConflict,
  checkGrupoConflict,
  checkAulaConflict,
  checkReglasNegocioAsignacion,
  createAsignaciones,
  getAllAsignaciones
};