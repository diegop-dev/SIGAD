const pool = require('../config/database');

const authModel = {
  // Busca un usuario por su correo institucional para el login
  encontrarPorCorreoInstitucional: async (institutional_email) => {
    let conn;
    try {
      conn = await pool.getConnection();
      // Se agrega 'intentos_fallidos' y 'bloqueado_hasta' al SELECT
      const rows = await conn.query(
        `SELECT id_usuario, nombres, apellido_paterno, password_hash, foto_perfil_url, rol_id, estatus, es_password_temporal, intentos_fallidos, bloqueado_hasta 
         FROM Usuarios 
         WHERE institutional_email = ? LIMIT 1`,
        [institutional_email]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  // Incrementa el contador de intentos fallidos
  registrarIntentoFallido: async (institutional_email) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Usuarios 
         SET intentos_fallidos = intentos_fallidos + 1 
         WHERE institutional_email = ?`,
        [institutional_email]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  // Bloquea la cuenta estableciendo una fecha/hora de expiración del bloqueo
  bloquearCuenta: async (institutional_email, lockUntilDate) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Usuarios 
         SET bloqueado_hasta = ? 
         WHERE institutional_email = ?`,
        [lockUntilDate, institutional_email]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  // Resetea los intentos fallidos a 0 (se usa cuando el login es exitoso)
  resetearIntento: async (institutional_email) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Usuarios 
         SET intentos_fallidos = 0, bloqueado_hasta = NULL 
         WHERE institutional_email = ?`,
        [institutional_email]
      );
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = authModel;