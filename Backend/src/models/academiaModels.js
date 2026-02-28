const db = require('../config/database');

const Academia = {

  getCoordinadoresDisponibles: async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT id_usuario, nombres, apellido_paterno
        FROM usuarios
        WHERE rol_id = 3
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
        `INSERT INTO academias (nombre, descripcion, usuario_id, creado_por)
         VALUES (?, ?, ?, ?)`,
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
  }

};

module.exports = Academia;