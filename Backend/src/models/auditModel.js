const pool = require("../config/database");

/* ── Inicialización de la tabla (se llama una vez al arrancar) ── */
const initAuditTable = async () => {
  try {
    // Crea la tabla si no existe (incluye usuario_rol y CUENTA_BLOQUEADA desde el inicio)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id_log              INT AUTO_INCREMENT PRIMARY KEY,
        modulo              VARCHAR(60)  NOT NULL,
        accion              ENUM(
                              'CREACION',
                              'MODIFICACION',
                              'BAJA',
                              'LOGIN',
                              'CAMBIO_CONTRASENA',
                              'CUENTA_BLOQUEADA'
                            ) NOT NULL,
        registro_afectado   VARCHAR(250),
        detalle             TEXT,
        usuario_id          INT,
        usuario_rol         VARCHAR(50),
        ip_address          VARCHAR(45),
        fecha               DATETIME DEFAULT NOW(),
        INDEX idx_audit_fecha    (fecha),
        INDEX idx_audit_usuario  (usuario_id),
        INDEX idx_audit_modulo   (modulo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Migración de respaldo: agrega usuario_rol si la tabla ya existía sin ese campo
    await pool.query(`
      ALTER TABLE audit_logs
        ADD COLUMN IF NOT EXISTS usuario_rol VARCHAR(50) NULL AFTER usuario_id
    `);

    // Migración de respaldo: amplía el ENUM con CUENTA_BLOQUEADA si ya existía la tabla
    await pool.query(`
      ALTER TABLE audit_logs
        MODIFY COLUMN accion ENUM(
          'CREACION',
          'MODIFICACION',
          'BAJA',
          'LOGIN',
          'CAMBIO_CONTRASENA',
          'CUENTA_BLOQUEADA'
        ) NOT NULL
    `);
  } catch (err) {
    console.error(
      "[auditModel] No se pudo inicializar audit_logs:",
      err.message,
    );
  }
};

// ÚNICO cambio respecto a la entrega anterior:
// se agrega CONCAT(...) AS nombre_usuario al SELECT
const getAuditLogs = async ({
  desde,
  hasta,
  modulo,
  texto,
  limit = 50,
  offset = 0,
}) => {
  let query = `
      SELECT
    al.id_log,
    al.modulo,
    al.accion,
    al.registro_afectado,
    al.usuario_id,                                          -- ← agregado
    al.ip_address,
    al.fecha,
    CONCAT(
      u.nombres, ' ',
      u.apellido_paterno, ' ',
      COALESCE(u.apellido_materno, '')                      -- ← apellido_materno
    ) AS nombre_usuario,
    COALESCE(
      al.usuario_rol,
      CASE u.rol_id
        WHEN 1 THEN 'Superadministrador'
        WHEN 2 THEN 'Administrador'
        WHEN 3 THEN 'Docente'
        ELSE 'Desconocido'
      END
    ) AS nombre_rol
  FROM audit_logs al
  LEFT JOIN usuarios u ON al.usuario_id = u.id_usuario
  WHERE 1=1
  `;
  // ...resto sin cambios

  const params = [];

  if (desde) {
    query += " AND al.fecha >= ?";
    params.push(desde + " 00:00:00");
  }
  if (hasta) {
    query += " AND al.fecha <= ?";
    params.push(hasta + " 23:59:59");
  }
  if (modulo) {
    query += " AND al.modulo = ?";
    params.push(modulo);
  }
  if (texto) {
    query += ` AND (
      al.detalle            LIKE ? OR
      u.nombres             LIKE ? OR
      u.apellido_paterno    LIKE ? OR
      al.registro_afectado  LIKE ?
    )`;
    const like = `%${texto}%`;
    params.push(like, like, like, like);
  }

  query += " ORDER BY al.fecha DESC LIMIT ? OFFSET ?";
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

  if (desde) {
    query += " AND al.fecha >= ?";
    params.push(desde + " 00:00:00");
  }
  if (hasta) {
    query += " AND al.fecha <= ?";
    params.push(hasta + " 23:59:59");
  }
  if (modulo) {
    query += " AND al.modulo = ?";
    params.push(modulo);
  }
  if (texto) {
    query += ` AND (
      al.detalle            LIKE ? OR
      u.nombres             LIKE ? OR
      u.apellido_paterno    LIKE ? OR
      al.registro_afectado  LIKE ?
    )`;
    const like = `%${texto}%`;
    params.push(like, like, like, like);
  }

  const rows = await pool.query(query, params);
  return Number(rows[0].total);
};

module.exports = { initAuditTable, getAuditLogs, countAuditLogs };