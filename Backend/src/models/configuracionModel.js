const pool = require('../config/database');

/* ── Inicialización de la tabla y valores por defecto ─────────── */
const initConfigTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave              VARCHAR(100) PRIMARY KEY,
        valor              VARCHAR(500) NOT NULL,
        descripcion        VARCHAR(300),
        modificado_por     INT,
        fecha_modificacion DATETIME DEFAULT NOW()
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Inserta valores por defecto si no existen
    await pool.query(`
      INSERT IGNORE INTO configuracion (clave, valor, descripcion) VALUES
        ('max_horas_semana',         '18', 'Máximo de horas semanales por docente'),
        ('max_horas_continuas',      '3',  'Máximo de horas continuas por bloque de clase'),
        ('max_asignaciones_docente', '6',  'Máximo de asignaciones (materias) por docente por periodo')
    `);
  } catch (err) {
    console.error('[configuracionModel] No se pudo inicializar la tabla configuracion:', err.message);
  }
};

/* ── Obtener todas las claves como objeto {clave: {valor, descripcion}} */
const getConfiguracion = async () => {
  const rows = await pool.query(
    'SELECT clave, valor, descripcion FROM configuracion ORDER BY clave ASC'
  );
  return rows.reduce((acc, row) => {
    acc[row.clave] = { valor: row.valor, descripcion: row.descripcion };
    return acc;
  }, {});
};

/* ── Obtener un solo valor por clave ───────────────────────────── */
const getValor = async (clave) => {
  const rows = await pool.query(
    'SELECT valor FROM configuracion WHERE clave = ?',
    [clave]
  );
  return rows.length > 0 ? rows[0].valor : null;
};

/* ── Actualizar un valor ──────────────────────────────────────── */
const updateValor = async (clave, valor, usuario_id) => {
  await pool.query(
    `UPDATE configuracion
     SET valor = ?, modificado_por = ?, fecha_modificacion = NOW()
     WHERE clave = ?`,
    [String(valor), usuario_id, clave]
  );
};

module.exports = { initConfigTable, getConfiguracion, getValor, updateValor };
