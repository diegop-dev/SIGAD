const pool = require('../config/database');

const validarCarreraEnPeriodo = async (carrera_id, periodo_id) => {
  const result = await pool.query(`
    SELECT id_materia 
    FROM materias 
    WHERE carrera_id = ? AND periodo_id = ? AND estatus = 'ACTIVO'
    LIMIT 1
  `, [carrera_id, periodo_id]);
  
  // Manejo seguro de arreglos
  const rows = Array.isArray(result) && Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
  return rows.length > 0;
};

const upsertMetrica = async (periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general, usuario_id) => {
  const resultQuery = await pool.query(
    'SELECT id_metrica FROM metricas_historicas WHERE periodo_id = ? AND carrera_id = ?',
    [periodo_id, carrera_id]
  );
  
  const rows = Array.isArray(resultQuery) && Array.isArray(resultQuery[0]) ? resultQuery[0] : (Array.isArray(resultQuery) ? resultQuery : []);
  const existing = rows[0];

  if (existing) {
    const updateResult = await pool.query(
      `UPDATE metricas_historicas 
       SET total_inscritos = ?, total_egresados = ?, promedio_general = ?, modificado_por = ?, fecha_modificacion = NOW() 
       WHERE id_metrica = ?`,
      [total_inscritos, total_egresados, promedio_general, usuario_id, existing.id_metrica]
    );
    return updateResult;
  } else {
    const insertResult = await pool.query(
      `INSERT INTO metricas_historicas 
        (periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general, creado_por, fecha_creacion) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general, usuario_id]
    );
    return insertResult;
  }
};

const getMetricasParaDashboard = async () => {
  const result = await pool.query(`
    SELECT 
      m.id_metrica, 
      m.periodo_id, 
      p.codigo AS nombre_periodo, 
      m.carrera_id, 
      c.nombre_carrera, 
      m.total_inscritos, 
      m.total_egresados, 
      m.promedio_general
    FROM metricas_historicas m
    INNER JOIN periodos p ON m.periodo_id = p.id_periodo
    INNER JOIN carreras c ON m.carrera_id = c.id_carrera
    ORDER BY p.fecha_inicio DESC, c.nombre_carrera ASC
  `);
  
  // Extrae el arreglo correcto sin importar la librería
  return Array.isArray(result) && Array.isArray(result[0]) ? result[0] : (Array.isArray(result) ? result : []);
};

module.exports = {
  validarCarreraEnPeriodo,
  upsertMetrica,
  getMetricasParaDashboard
};