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
  coordinadorOcupado: async (usuario_id) => {
  let conn;
  try {
    conn = await db.getConnection();
    const rows = await conn.query(
      `SELECT COUNT(*) AS total
       FROM academias
       WHERE usuario_id = ?
       AND estatus = 'ACTIVO'
       AND fecha_eliminacion IS NULL`,
      [usuario_id]
    );
    return rows[0].total > 0;
  } finally {
    if (conn) conn.release();
  }
},

  validarNombre: async (nombre) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(
        "SELECT COUNT(*) AS total FROM academias WHERE nombre = ? AND fecha_eliminacion IS NULL",
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
        `INSERT INTO academias (nombre, descripcion,  estado, municipio, codigo_postal, direccion, usuario_id, estatus, creado_por)
         VALUES (?, ?, ?, ?, ?)`,
        [
          data.nombre,
          data.descripcion,
           data.estado,
        data.municipio,
        data.codigo_postal,
        data.direccion,
          data.coordinador_id, 
          data.estatus || 'ACTIVO',
          data.creado_por
        ]
      );
    } finally {
      if (conn) conn.release();
    }
  }

};

module.exports = Academia;