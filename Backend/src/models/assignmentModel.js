const pool = require('../config/database').pool;

// ==========================================
// VALIDACIONES DE CRUCE DE HORARIOS (HU-33)
// ==========================================

// Verifica si un DOCENTE ya tiene clases en ese día y cruce de horas en el mismo periodo
const checkDocenteConflict = async (id_docente, id_periodo, dia_semana, hora_inicio, hora_fin) => {
  const [rows] = await pool.execute(`
    SELECT a.id_asignacion 
    FROM asignaciones a
    WHERE a.id_docente = ? 
      AND a.id_periodo = ? 
      AND a.dia_semana = ?
      AND a.estatus_acta != 'CERRADA'
      AND (
        (a.hora_inicio < ? AND a.hora_fin > ?) OR
        (a.hora_inicio >= ? AND a.hora_inicio < ?)
      )
  `, [id_docente, id_periodo, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin]);
  return rows.length > 0;
};

// Verifica si un GRUPO ya tiene clases en ese día y cruce de horas en el mismo periodo
const checkGrupoConflict = async (id_grupo, id_periodo, dia_semana, hora_inicio, hora_fin) => {
  const [rows] = await pool.execute(`
    SELECT a.id_asignacion 
    FROM asignaciones a
    WHERE a.id_grupo = ? 
      AND a.id_periodo = ? 
      AND a.dia_semana = ?
      AND a.estatus_acta != 'CERRADA'
      AND (
        (a.hora_inicio < ? AND a.hora_fin > ?) OR
        (a.hora_inicio >= ? AND a.hora_inicio < ?)
      )
  `, [id_grupo, id_periodo, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin]);
  return rows.length > 0;
};

// Verifica si un AULA ya está ocupada en ese día y cruce de horas en el mismo periodo
const checkAulaConflict = async (aula_id, id_periodo, dia_semana, hora_inicio, hora_fin) => {
  const [rows] = await pool.execute(`
    SELECT a.id_asignacion 
    FROM asignaciones a
    WHERE a.aula_id = ? 
      AND a.id_periodo = ? 
      AND a.dia_semana = ?
      AND a.estatus_acta != 'CERRADA'
      AND (
        (a.hora_inicio < ? AND a.hora_fin > ?) OR
        (a.hora_inicio >= ? AND a.hora_inicio < ?)
      )
  `, [aula_id, id_periodo, dia_semana, hora_fin, hora_inicio, hora_inicio, hora_fin]);
  return rows.length > 0;
};

// ==========================================
// TRANSACCIÓN DE CREACIÓN (HU-33)
// ==========================================

// Inserta múltiples asignaciones (una por cada bloque de horario/día)
const createAsignaciones = async (asignacionesData) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO asignaciones (
        id_periodo, 
        id_materia, 
        id_docente, 
        id_grupo, 
        aula_id, 
        dia_semana, 
        hora_inicio, 
        hora_fin, 
        creado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertedIds = [];

    // Iteramos sobre cada bloque de horario y lo insertamos
    for (const data of asignacionesData) {
      const [result] = await connection.execute(insertQuery, [
        data.id_periodo,
        data.id_materia,
        data.id_docente,
        data.id_grupo,
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
// CONSULTA RELACIONAL CON FILTROS (HU-34)
// ==========================================

// Obtiene todas las asignaciones con los nombres cruzados (JOINs) y filtros opcionales
const getAllAsignaciones = async (filters = {}) => {
  let query = `
    SELECT 
      a.id_asignacion,
      a.dia_semana,
      a.hora_inicio,
      a.hora_fin,
      a.estatus_confirmacion,
      a.estatus_acta,
      p.nombre_periodo,
      m.nombre_materia,
      g.nombre_grupo,
      au.nombre_aula,
      a.id_docente,
      u.nombres AS docente_nombres,
      u.apellido_paterno AS docente_apellido_paterno,
      u.apellido_materno AS docente_apellido_materno
    FROM asignaciones a
    INNER JOIN periodos p ON a.id_periodo = p.id_periodo
    INNER JOIN materias m ON a.id_materia = m.id_materia
    INNER JOIN grupos g ON a.id_grupo = g.id_grupo
    INNER JOIN aulas au ON a.aula_id = au.id_aula
    INNER JOIN docentes d ON a.id_docente = d.id_docente
    INNER JOIN usuarios u ON d.id_usuario = u.id_usuario
    WHERE a.estatus_acta != 'CERRADA'
  `;

  const queryParams = [];

  // Construcción dinámica de filtros WHERE
  if (filters.id_periodo) {
    query += ` AND a.id_periodo = ?`;
    queryParams.push(filters.id_periodo);
  }
  
  if (filters.id_docente) {
    query += ` AND a.id_docente = ?`;
    queryParams.push(filters.id_docente);
  }

  if (filters.id_grupo) {
    query += ` AND a.id_grupo = ?`;
    queryParams.push(filters.id_grupo);
  }

  // Ordenamos para que la tabla en el frontend se vea estructurada
  query += ` ORDER BY p.fecha_inicio DESC, u.apellido_paterno ASC, a.dia_semana ASC, a.hora_inicio ASC`;

  const [rows] = await pool.execute(query, queryParams);
  return rows;
};

module.exports = {
  checkDocenteConflict,
  checkGrupoConflict,
  checkAulaConflict,
  createAsignaciones,
  getAllAsignaciones
};