const pool = require("../config/database");

// Funciones de validación interna
const validateUserData = (data) => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s[a-zA-ZÀ-ÿ\u00f1\u00d1]+)*$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const cleanData = { ...data };

  // Validación de nombres y apellidos (Req 5, 6 y 7)
  const nameFields = ['nombres', 'apellido_paterno', 'apellido_materno'];
  nameFields.forEach(field => {
    if (cleanData[field]) {
      cleanData[field] = cleanData[field].trim();
      if (!nameRegex.test(cleanData[field])) {
        throw new Error(`El campo ${field} contiene caracteres inválidos o espacios extra.`);
      }
    }
  });

  // Validación de correos (Req 3, 5 y 8)
  const emailFields = ['personal_email', 'institutional_email'];
  emailFields.forEach(field => {
    if (cleanData[field]) {
      cleanData[field] = cleanData[field].trim();
      if (!emailRegex.test(cleanData[field]) || (cleanData[field].match(/@/g) || []).length !== 1) {
        throw new Error(`El campo ${field} no tiene un formato de correo válido o contiene múltiples @.`);
      }
    }
  });

  return cleanData;
};


const userModel = {
  
  // Consultas de lectura
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

  // Validación de integridad para baja de usuarios docente
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

  
  // Consultas de escritura
  createUser: async (userData) => {
    let conn;
    try {
      // Aplicamos limpieza y validación antes de procesar en BD
      const cleanData = validateUserData(userData);
      
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO Usuarios 
        (nombres, apellido_paterno, apellido_materno, personal_email, institutional_email, password_hash, foto_perfil_url, rol_id, creado_por) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cleanData.nombres,
          cleanData.apellido_paterno,
          cleanData.apellido_materno,
          cleanData.personal_email,
          cleanData.institutional_email,
          cleanData.password_hash, // Nota: La complejidad de la contraseña debe validarse en el controlador ANTES del hash
          cleanData.foto_perfil_url,
          cleanData.rol_id,
          cleanData.creado_por,
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
      // Aplicamos limpieza y validación a los datos a actualizar
      const cleanData = validateUserData(updateData);

      const fields = Object.keys(cleanData);
      const values = Object.values(cleanData);
      
      if (fields.length === 0) return 0;

      conn = await pool.getConnection();
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

  // Desactivar usuario
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

  // Reactivar usuario
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