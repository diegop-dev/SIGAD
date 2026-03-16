const pool = require('../config/database');

// ==========================================
// NUEVO: Validación de congruencia operativa
// ==========================================
const validarCarreraEnPeriodo = async (carrera_id, periodo_id) => {
  // Verificamos si existe al menos una materia activa vinculada a esa carrera en ese periodo
  const rows = await pool.query(`
    SELECT id_materia 
    FROM materias 
    WHERE carrera_id = ? AND periodo_id = ? AND estatus = 'ACTIVO'
    LIMIT 1
  `, [carrera_id, periodo_id]);
  
  return rows.length > 0;
};

const upsertMetrica = async (periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general, usuario_id) => {
  // Verificamos si ya existe una métrica para ese periodo y carrera
  const [existing] = await pool.query(
    'SELECT id_metrica FROM metricas_historicas WHERE periodo_id = ? AND carrera_id = ?',
    [periodo_id, carrera_id]
  );

  if (existing) {
    // Si existe, actualizamos
    const result = await pool.query(
      `UPDATE metricas_historicas 
       SET total_inscritos = ?, 
           total_egresados = ?, 
           promedio_general = ?, 
           modificado_por = ?, 
           fecha_modificacion = NOW() 
       WHERE id_metrica = ?`,
      [total_inscritos, total_egresados, promedio_general, usuario_id, existing.id_metrica]
    );
    return result.affectedRows;
  } else {
    // Si no existe, insertamos un nuevo registro
    const result = await pool.query(
      `INSERT INTO metricas_historicas 
        (periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general, creado_por, fecha_creacion) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general, usuario_id]
    );
    return result.insertId;
  }
};

const getMetricasParaDashboard = async () => {
  // Hacemos JOIN con carreras y periodos para que el Frontend tenga los nombres listos para graficar
  const rows = await pool.query(`
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
  return rows;
};

module.exports = {
  validarCarreraEnPeriodo, // Exportamos la nueva validación
  upsertMetrica,
  getMetricasParaDashboard
};