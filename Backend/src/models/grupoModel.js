const pool = require("../config/database");

const grupoModel = {
  // método exclusivo para la API de sincronización externa (HU-37 / API-04)
  getGruposParaSincronizacion: async (carrera_id, cuatrimestre_id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // si faltan parámetros devolvemos un arreglo vacío por seguridad
      if (!carrera_id || !cuatrimestre_id) {
        return [];
      }

      // consulta optimizada sin joins, proyectando estrictamente lo solicitado en el PDF
      const rows = await conn.query(` SELECT id_grupo, identificador FROM grupos WHERE carrera_id = ? AND cuatrimestre_id = ? AND estatus = 'ACTIVO' ORDER BY id_grupo ASC `, [carrera_id, cuatrimestre_id]);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  crearGrupo: async (datosGrupo) => {
    const { identificador, carrera_id, cuatrimestre_id, creado_por } = datosGrupo;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO grupos (identificador, carrera_id, cuatrimestre_id, estatus, creado_por, fecha_creacion)
         VALUES (?, ?, ?, 'ACTIVO', ?, NOW())`,
        [identificador, carrera_id, cuatrimestre_id, creado_por]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

getAllGrupos: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT 
          g.id_grupo, 
          g.identificador, 
          g.carrera_id, 
          g.cuatrimestre_id,
          g.estatus,
          c.nombre_carrera,
          cu.nombre AS nombre_cuatrimestre
        FROM grupos g
        LEFT JOIN carreras c ON g.carrera_id = c.id_carrera
        LEFT JOIN cuatrimestres cu ON g.cuatrimestre_id = cu.id_cuatrimestre
        ORDER BY g.id_grupo DESC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  getGrupoById: async (id_grupo) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_grupo, identificador, carrera_id, cuatrimestre_id, estatus 
         FROM grupos WHERE id_grupo = ? LIMIT 1`,
        [id_grupo]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  actualizarGrupo: async (id_grupo, datosGrupo) => {
    const { identificador, carrera_id, cuatrimestre_id, modificado_por } = datosGrupo;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE grupos 
         SET identificador = ?, carrera_id = ?, cuatrimestre_id = ?, modificado_por = ?, fecha_modificacion = NOW()
         WHERE id_grupo = ?`,
        [identificador, carrera_id, cuatrimestre_id, modificado_por, id_grupo]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  validarExistencia: async (identificador, carrera_id, grupo_id = null) => {
    let conn;
    try {
      conn = await pool.getConnection();
      let query = "SELECT COUNT(*) AS total FROM grupos WHERE identificador = ? AND carrera_id = ?";
      let params = [identificador, carrera_id];

      if (grupo_id) {
        query += " AND id_grupo != ?";
        params.push(grupo_id);
      }

      const rows = await conn.query(query, params);
      return rows[0].total > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  cambiarEstatus: async (id_grupo, nuevoEstatus, modificado_por) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE grupos 
         SET estatus = ?, modificado_por = ?, fecha_modificacion = NOW()
         WHERE id_grupo = ?`,
        [nuevoEstatus, modificado_por, id_grupo]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = grupoModel;