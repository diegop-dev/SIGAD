const pool = require('../config/database');

const authModel = {
  // Busca un usuario por su correo institucional para el login
  findByInstitutionalEmail: async (institutional_email) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_usuario, nombres, apellido_paterno, password_hash, foto_perfil_url, rol_id, estatus, es_password_temporal 
         FROM Usuarios 
         WHERE institutional_email = ? LIMIT 1`,
        [institutional_email]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = authModel;
