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

  // ─── VALIDACIÓN DE INTEGRIDAD PARA BAJA DE USUARIOS ────────────────────────
  // Regla de negocio: un usuario con rol docente no puede ser desactivado si
  // tiene un expediente ligado a una asignación docente existente.
  //
  // PROBLEMA DE IDENTIDAD:
  // En SIGAD cada fila de asignaciones tiene su propio id_asignacion único.
  // Si solo hacemos un JOIN simple, podríamos contar registros huérfanos o 
  // versiones de historial.
  //
  // SOLUCIÓN: Subquery que calcula MIN(id_asignacion) agrupado por la clave
  // lógica (grupo_id, materia_id, docente_id, periodo_id, aula_id).
  // Ese MIN actúa como ID estable y representativo. validamos cruzando la
  // tabla Usuarios con Docentes y verificamos si existen bloques de asignación
  // vigentes (acta abierta y periodo activo).
  checkDependenciasDocente: async (id_usuario) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT COUNT(DISTINCT rep.min_id) AS dependencias_activas
        FROM Usuarios u
        INNER JOIN Docentes d ON u.id_usuario = d.usuario_id
        INNER JOIN Asignaciones a ON d.id_docente = a.docente_id
        INNER JOIN Periodos p ON a.periodo_id = p.id_periodo
        INNER JOIN (
          SELECT 
            MIN(id_asignacion) AS min_id,
            grupo_id, materia_id, docente_id, periodo_id, aula_id
          FROM Asignaciones
          GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
        ) rep ON a.grupo_id <=> rep.grupo_id 
             AND a.materia_id = rep.materia_id 
             AND a.docente_id = rep.docente_id 
             AND a.periodo_id = rep.periodo_id 
             AND a.aula_id = rep.aula_id
        WHERE u.id_usuario = ? 
          AND u.estatus = 'ACTIVO'
          AND a.estatus_acta = 'ABIERTA'
          AND a.estatus_confirmacion = 'ACEPTADA'
          AND p.estatus = 'ACTIVO'
      `, [id_usuario]);
      
      return rows[0].dependencias_activas > 0;
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
      // limpiamos los rastros de eliminación y lo volvemos a poner activo
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