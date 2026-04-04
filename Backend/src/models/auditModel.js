const pool = require('../config/database');

/* ── Inicialización de la tabla (se llama una vez al arrancar) ── */
const initAuditTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id_log          INT AUTO_INCREMENT PRIMARY KEY,
        modulo          VARCHAR(60)  NOT NULL,
        accion          ENUM('CREACION','MODIFICACION','BAJA','LOGIN','CAMBIO_CONTRASENA') NOT NULL,
        registro_afectado VARCHAR(250),
        detalle         TEXT,
        usuario_id      INT,
        ip_address      VARCHAR(45),
        fecha           DATETIME DEFAULT NOW(),
        INDEX idx_audit_fecha    (fecha),
        INDEX idx_audit_usuario  (usuario_id),
        INDEX idx_audit_modulo   (modulo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  } catch (err) {
    console.error('[auditModel] No se pudo crear audit_logs:', err.message);
  }
};

/* ── Consultar logs con filtros y paginación ──────────────────── */
const getAuditLogs = async ({ desde, hasta, modulo, texto, limit = 50, offset = 0 }) => {
  let query = `
    SELECT
      al.id_log,
      al.modulo,
      al.accion,
      al.registro_afectado,
      al.detalle,
      al.ip_address,
      al.fecha,
      u.nombres,
      u.apellido_paterno,
      CASE u.rol_id
        WHEN 1 THEN 'Superadministrador'
        WHEN 2 THEN 'Administrador'
        WHEN 3 THEN 'Docente'
        ELSE 'Desconocido'
      END AS nombre_rol
    FROM audit_logs al
    LEFT JOIN usuarios u ON al.usuario_id = u.id_usuario
    WHERE 1=1
  `;
  const params = [];

  if (desde) {
    query += ' AND al.fecha >= ?';
    params.push(desde + ' 00:00:00');
  }
  if (hasta) {
    query += ' AND al.fecha <= ?';
    params.push(hasta + ' 23:59:59');
  }
  if (modulo) {
    query += ' AND al.modulo = ?';
    params.push(modulo);
  }
  if (texto) {
    query += ' AND (al.detalle LIKE ? OR u.nombres LIKE ? OR u.apellido_paterno LIKE ? OR al.registro_afectado LIKE ?)';
    const like = `%${texto}%`;
    params.push(like, like, like, like);
  }

  query += ' ORDER BY al.fecha DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  return await pool.query(query, params);
};

/* ── Contar logs para paginación ──────────────────────────────── */
const countAuditLogs = async ({ desde, hasta, modulo, texto }) => {
  let query = `
    SELECT COUNT(*) AS total
    FROM audit_logs al
    LEFT JOIN usuarios u ON al.usuario_id = u.id_usuario
    WHERE 1=1
  `;
  const params = [];

  if (desde) { query += ' AND al.fecha >= ?'; params.push(desde + ' 00:00:00'); }
  if (hasta) { query += ' AND al.fecha <= ?'; params.push(hasta + ' 23:59:59'); }
  if (modulo) { query += ' AND al.modulo = ?'; params.push(modulo); }
  if (texto) {
    query += ' AND (al.detalle LIKE ? OR u.nombres LIKE ? OR u.apellido_paterno LIKE ? OR al.registro_afectado LIKE ?)';
    const like = `%${texto}%`;
    params.push(like, like, like, like);
  }

  const rows = await pool.query(query, params);
  return Number(rows[0].total);
};

module.exports = { initAuditTable, getAuditLogs, countAuditLogs };
