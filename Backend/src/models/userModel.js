const pool = require("../config/database");

const userModel = {
  // Verifica si el correo personal o institucional ya está registrado
  findExistingEmails: async (personal_email, institutional_email) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_usuario, personal_email, institutional_email 
         FROM Usuarios 
         WHERE personal_email = ? OR institutional_email = ? LIMIT 1`,
        [personal_email, institutional_email],
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  // Añade esto dentro del objeto userModel
  getAllUsers: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT u.id_usuario, u.nombres, u.apellido_paterno, u.apellido_materno, 
              u.personal_email, u.institutional_email, u.foto_perfil_url, u.estatus, u.fecha_creacion, r.nombre as nombre_rol 
       FROM Usuarios u 
       INNER JOIN Roles r ON u.rol_id = r.id_rol 
       ORDER BY u.id_usuario DESC`,
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // Inserta el nuevo usuario con sus campos obligatorios y de auditoría
  createUser: async (userData) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO Usuarios 
        (nombres, apellido_paterno, apellido_materno, personal_email, institutional_email, password_hash, foto_perfil_url, rol_id, creado_por) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userData.nombres,
          userData.apellido_paterno,
          userData.apellido_materno,
          userData.personal_email,
          userData.institutional_email,
          userData.password_hash,
          userData.foto_perfil_url,
          userData.rol_id,
          userData.creado_por,
        ],
      );
      return result.insertId;
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = userModel;
