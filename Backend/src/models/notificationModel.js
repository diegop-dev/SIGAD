const pool = require('../config/database');

const createNotification = async (usuario_id, mensaje, severidad = 'BAJA') => {
  const result = await pool.query(
    `INSERT INTO notificaciones (usuario_id, mensaje, severidad, leida, fecha_creacion) 
     VALUES (?, ?, ?, 0, NOW())`,
    [usuario_id, mensaje, severidad]
  );
  return result.insertId;
};

const getNotificacionesByUser = async (usuario_id) => {
  const rows = await pool.query(
    `SELECT id_notificacion as id, mensaje, severidad, leida, fecha_creacion 
     FROM notificaciones 
     WHERE usuario_id = ? AND leida = 0 
     ORDER BY fecha_creacion DESC`,
    [usuario_id]
  );
  return rows;
};

const marcarComoLeida = async (id_notificacion, usuario_id) => {
  const result = await pool.query(
    `UPDATE notificaciones SET leida = 1 WHERE id_notificacion = ? AND usuario_id = ?`,
    [id_notificacion, usuario_id]
  );
  return result.affectedRows;
};

module.exports = {
  createNotification,
  getNotificacionesByUser,
  marcarComoLeida
};