const pool = require('../config/database');

const verificarDependenciasAula = async (id_aula) => {
  const query = `
    SELECT COUNT(DISTINCT rep.min_id) AS dependencias_activas
    FROM Aulas au
    INNER JOIN Asignaciones a ON au.id_aula = a.aula_id
    INNER JOIN Periodos p ON a.periodo_id = p.id_periodo
    INNER JOIN (
      SELECT 
        MIN(id_asignacion) AS min_id,
        grupo_id, materia_id, docente_id, periodo_id, aula_id
      FROM Asignaciones
      GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
    ) rep ON a.grupo_id <=> rep.grupo_id 
         AND a.materia_id = rep.materia_id 
         AND a.docente_id = rep.docente_id 
         AND a.periodo_id = rep.periodo_id 
         AND a.aula_id    = rep.aula_id
    WHERE au.id_aula           = ? 
      AND au.estatus            = 'ACTIVO'
      AND a.estatus_acta        = 'ABIERTA'
      AND a.estatus_confirmacion = 'ACEPTADA'
      AND p.estatus             = 'ACTIVO'
  `;
  const resultado = await pool.query(query, [id_aula]);
  return resultado[0].dependencias_activas > 0;
};

const checkDependenciasEnviadas = async (id_aula) => {
  const query = `
    SELECT COUNT(DISTINCT rep.min_id) AS dependencias_enviadas
    FROM Aulas au
    INNER JOIN Asignaciones a ON au.id_aula = a.aula_id
    INNER JOIN Periodos p ON a.periodo_id = p.id_periodo
    INNER JOIN (
      SELECT 
        MIN(id_asignacion) AS min_id,
        grupo_id, materia_id, docente_id, periodo_id, aula_id
      FROM Asignaciones
      GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
    ) rep ON a.grupo_id <=> rep.grupo_id 
         AND a.materia_id = rep.materia_id 
         AND a.docente_id = rep.docente_id 
         AND a.periodo_id = rep.periodo_id 
         AND a.aula_id    = rep.aula_id
    WHERE au.id_aula           = ? 
      AND a.estatus_acta        = 'ABIERTA'
      AND a.estatus_confirmacion = 'ENVIADA'
      AND p.estatus             = 'ACTIVO'
  `;
  const resultado = await pool.query(query, [id_aula]);
  return resultado[0].dependencias_enviadas > 0;
};

const findByNombreCodigo = async (nombre, excludedId = null) => {
  if (excludedId) {
    const resultado = await pool.query(
      'SELECT id_aula FROM Aulas WHERE nombre_codigo = ? AND id_aula != ?',
      [nombre, excludedId]
    );
    return resultado;
  }
  const resultado = await pool.query(
    'SELECT id_aula FROM Aulas WHERE nombre_codigo = ?',
    [nombre]
  );
  return resultado;
};

const createAula = async (nombre, tipo, capacidad, ubicacion, creado_por) => {
  const resultado = await pool.query(
    `INSERT INTO Aulas (nombre_codigo, tipo, capacidad, ubicacion, estatus, creado_por, fecha_creacion) 
     VALUES (?, ?, ?, ?, 'ACTIVO', ?, NOW())`,
    [nombre, tipo, capacidad, ubicacion, creado_por]
  );
  return resultado.insertId;
};

const getTodasAulas = async () => {
  const resultados = await pool.query(`
    SELECT id_aula, nombre_codigo, tipo, capacidad, ubicacion, estatus 
    FROM Aulas
    ORDER BY nombre_codigo ASC
  `);
  return resultados;
};

const getAulaById = async (id_aula) => {
  const resultado = await pool.query(
    'SELECT nombre_codigo, tipo, ubicacion FROM Aulas WHERE id_aula = ?',
    [id_aula]
  );
  return resultado.length > 0 ? resultado[0] : null;
};

const updateAula = async (id, nombre, tipo, capacidad, ubicacion, estatus, modificado_por) => {
  const resultado = await pool.query(
    `UPDATE Aulas 
     SET nombre_codigo = ?, tipo = ?, capacidad = ?, ubicacion = ?, estatus = ?,
         modificado_por = ?, fecha_modificacion = NOW()
     WHERE id_aula = ?`,
    [nombre, tipo, capacidad, ubicacion, estatus, modificado_por, id]
  );
  return resultado.affectedRows > 0;
};

const getNombreForAudit = async (id_aula) => {
  const resultado = await pool.query(
    'SELECT nombre_codigo FROM Aulas WHERE id_aula = ?',
    [id_aula]
  );
  return resultado.length > 0 ? resultado[0].nombre_codigo : 'Desconocido';
};

const setEstatusInactivo = async (id, eliminado_por) => {
  const resultado = await pool.query(
    `UPDATE Aulas 
     SET estatus = 'INACTIVO', eliminado_por = ?, fecha_eliminacion = NOW() 
     WHERE id_aula = ?`,
    [eliminado_por, id]
  );
  return resultado.affectedRows > 0;
};

const getAulasActivas = async () => {
  const aulas = await pool.query(`
    SELECT id_aula, nombre_codigo, capacidad, tipo
    FROM Aulas
    WHERE estatus = 'ACTIVO'
    ORDER BY nombre_codigo ASC
  `);
  return aulas;
};

const getAsignacionesByAulaId = async (id_aula) => {
  const query = `
    SELECT 
      a.id_asignacion,
      m.nombre AS materia,
      CONCAT(u.nombres, ' ', u.apellido_paterno, ' ', IFNULL(u.apellido_materno, '')) AS docente,
      IFNULL(g.identificador, 'N/A') AS grupo,
      c.nombre_carrera AS carrera,
      a.dia_semana,
      a.hora_inicio,
      a.hora_fin,
      p.codigo AS nombre_periodo
    FROM Asignaciones a
    JOIN Materias m ON a.materia_id = m.id_materia
    JOIN Docentes d ON a.docente_id = d.id_docente
    JOIN Usuarios u ON d.usuario_id = u.id_usuario
    LEFT JOIN Grupos g ON a.grupo_id = g.id_grupo
    LEFT JOIN Carreras c ON g.carrera_id = c.id_carrera
    JOIN Periodos p ON a.periodo_id = p.id_periodo
    WHERE a.aula_id = ?
      AND a.estatus_acta = 'ABIERTA'
      AND a.estatus_confirmacion = 'ACEPTADA'
      AND p.estatus = 'ACTIVO'
    ORDER BY a.dia_semana ASC, a.hora_inicio ASC
  `;
  const asigs = await pool.query(query, [id_aula]);
  return asigs;
};

module.exports = {
  verificarDependenciasAula,
  checkDependenciasEnviadas,
  findByNombreCodigo,
  createAula,
  getTodasAulas,
  getAulaById,
  updateAula,
  getNombreForAudit,
  setEstatusInactivo,
  getAulasActivas,
  getAsignacionesByAulaId
};
