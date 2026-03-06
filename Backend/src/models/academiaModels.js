const db = require('../config/database');

const Academia = {

  getCoordinadoresDisponibles: async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT id_usuario, nombres, apellido_paterno
        FROM usuarios
        WHERE rol_id = 2  -- 🔹 Administradores/Coordinadores
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  validarNombre: async (nombre, id_academia = null) => {
    let conn;
    try {
      conn = await db.getConnection();
      let query = "SELECT COUNT(*) AS total FROM academias WHERE nombre = ?";
      let params = [nombre];

      if (id_academia) {
        query += " AND id_academia != ?";
        params.push(id_academia);
      }

      const rows = await conn.query(query, params);
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
        [data.nombre, data.descripcion, data.usuario_id, data.creado_por]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  // 🔹 ACTUALIZADO: Graba el ID que llega directamente del controlador
  actualizar: async (id, data) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.query(
        `UPDATE academias 
         SET nombre = ?, 
             descripcion = ?, 
             usuario_id = ?, 
             modificado_por = ?, 
             fecha_modificacion = NOW()
         WHERE id_academia = ?`,
        [data.nombre, data.descripcion, data.usuario_id, data.modificado_por, id]
      );
      return { success: true };
    } finally {
      if (conn) conn.release();
    }
  },

  // 🔹 ACTUALIZADO: Registra la trazabilidad exacta del usuario logueado
  cambiarEstatus: async (id, nuevoEstatus, modificado_por) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.query(
        `UPDATE academias 
         SET estatus = ?, 
             modificado_por = ?, 
             fecha_modificacion = NOW() 
         WHERE id_academia = ?`,
        [nuevoEstatus, modificado_por, id]
      );
      return { success: true };
    } finally {
      if (conn) conn.release();
    }
  },


  getAcademias: async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT 
          a.id_academia,
          a.nombre,
          a.descripcion,
          a.usuario_id, 
          -- 🔹 CAMBIO AQUÍ: Formato Día-Mes-Año
          DATE_FORMAT(a.fecha_creacion, '%d/%m/%Y') AS fecha_creacion,
          a.estatus,
          CONCAT(u.nombres, ' ', u.apellido_paterno) AS coordinador_nombre
        FROM academias a
        LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario
        ORDER BY a.fecha_creacion DESC -- Ordenar por las más recientes
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = Academia;