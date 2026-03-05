const db = require('../config/database');

const Academia = {

  getCoordinadoresDisponibles: async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT id_usuario, nombres, apellido_paterno
        FROM usuarios
        WHERE rol_id = 2
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  validarNombre: async (nombre) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(
        "SELECT COUNT(*) AS total FROM academias WHERE nombre = ?",
        [nombre]
      );
      return rows[0].total > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  registrar: async (data) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.query(
        `INSERT INTO academias (nombre, descripcion, usuario_id, creado_por, estatus)
         VALUES (?, ?, ?, ?, 'ACTIVO')`,
        [
          data.nombre,
          data.descripcion,
          data.coordinador_id, 
          data.creado_por
        ]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  // 🔹 TODAS (ADMIN)
getAcademias: async () => {
  let conn;
  try {
    conn = await db.getConnection();
    const rows = await conn.query(`
      SELECT 
        a.id_academia,
        a.nombre,
        a.descripcion,
        DATE_FORMAT(a.fecha_creacion, '%Y-%m-%d') AS fecha_creacion,
        a.estatus,
        CONCAT(u.nombres, ' ', u.apellido_paterno) AS coordinador_nombre
      FROM academias a
      LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario
      ORDER BY a.nombre ASC
    `);

    return rows;
  } finally {
    if (conn) conn.release();
  }
},

  // 🔹 SOLO ACTIVAS (CLIENTE)
  getAcademiasActivasCliente: async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT 
          a.id_academia,
          a.nombre,
          a.descripcion,
          a.fecha_registro,
          CONCAT(u.nombres, ' ', u.apellido_paterno) AS coordinador_nombre
        FROM academias a
        LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario
        WHERE a.estatus = 'ACTIVO'
        ORDER BY a.nombre ASC
      `);

      return rows;
    } finally {
      if (conn) conn.release();
    }
  }

};

module.exports = Academia;