const pool = require("../config/database");

const userModel = {
  // ==========================================
  // CONSULTAS DE LECTURA
  // ==========================================

  findExistingEmails: async (personal_email, institutional_email) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_usuario, personal_email, institutional_email 
         FROM Usuarios 
         WHERE personal_email = ? OR institutional_email = ? LIMIT 1`,
        [personal_email, institutional_email]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  findExistingEmailsExceptUser: async (personal_email, institutional_email, id_usuario) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_usuario, personal_email, institutional_email 
         FROM Usuarios 
         WHERE (personal_email = ? OR institutional_email = ?) 
         AND id_usuario != ? LIMIT 1`,
        [personal_email, institutional_email, id_usuario]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  findUserById: async (id_usuario) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT * FROM Usuarios WHERE id_usuario = ? LIMIT 1`,
        [id_usuario]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  getAllUsers: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT u.id_usuario, u.rol_id, u.nombres, u.apellido_paterno, u.apellido_materno, 
                u.personal_email, u.institutional_email, u.foto_perfil_url, u.estatus, u.fecha_creacion, r.nombre as nombre_rol 
         FROM Usuarios u 
         INNER JOIN Roles r ON u.rol_id = r.id_rol 
         ORDER BY u.id_usuario DESC`
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // ==========================================
  // CONSULTAS DE ESCRITURA (MUTACIONES)
  // ==========================================

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
        ]
      );
      return result.insertId;
    } finally {
      if (conn) conn.release();
    }
  },

  updateUser: async (id_usuario, updateData) => {
    let conn;
    try {
      conn = await pool.getConnection();
      
      const fields = Object.keys(updateData);
      const values = Object.values(updateData);
      
      if (fields.length === 0) return 0;

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      values.push(id_usuario); 

      const result = await conn.query(
        `UPDATE Usuarios SET ${setClause} WHERE id_usuario = ?`,
        values
      );
      
      return result.affectedRows; 
    } finally {
      if (conn) conn.release();
    }
  },

  // HU-04 DESACTIVAR USUARIO (Soft Delete)
  deactivateUser: async (id_usuario, eliminado_por) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE Usuarios 
         SET estatus = 'INACTIVO', 
             eliminado_por = ?, 
             fecha_eliminacion = NOW() 
         WHERE id_usuario = ?`,
        [eliminado_por, id_usuario]
      );
      return result.affectedRows;
    } finally {
      if (conn) conn.release();
    }
  },

  // NUEVO: REACTIVAR USUARIO
  activateUser: async (id_usuario, modificado_por) => {
    let conn;
    try {
      conn = await pool.getConnection();
      // Limpiamos los rastros de eliminación y lo volvemos a poner ACTIVO
      const result = await conn.query(
        `UPDATE Usuarios 
         SET estatus = 'ACTIVO', 
             eliminado_por = NULL, 
             fecha_eliminacion = NULL,
             modificado_por = ?
         WHERE id_usuario = ?`,
        [modificado_por, id_usuario]
      );
      return result.affectedRows;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = userModel;
