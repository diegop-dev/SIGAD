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

  // ==========================================
  // MODIFICADO: Se incluyó nivel_academico en la inserción
  // ==========================================
  crearGrupo: async (datosGrupo) => {
    const { identificador, carrera_id, cuatrimestre_id, nivel_academico, creado_por } = datosGrupo;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO grupos (identificador, carrera_id, cuatrimestre_id, nivel_academico, estatus, creado_por, fecha_creacion)
         VALUES (?, ?, ?, ?, 'ACTIVO', ?, NOW())`,
        [identificador, carrera_id, cuatrimestre_id, nivel_academico, creado_por]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  // ==========================================
  // MODIFICADO: Se incluyó g.nivel_academico en la proyección
  // ==========================================
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
          g.nivel_academico,
          g.estatus,
          c.nombre_carrera,
          c.modalidad,
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

  // Obtener las primeras 3 letras o código único de la carrera para usarlas como siglas
  getCarreraSiglas: async (carrera_id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT codigo_unico FROM carreras WHERE id_carrera = ?", [carrera_id]);
      // Extraemos el código único completo (que ahora ya tiene la 'L' o 'M' gracias a la actualización de carreras)
      return rows[0] ? rows[0].codigo_unico : 'XXX';
    } finally {
      if (conn) conn.release();
    }
  },

  // Actualizar el texto del identificador después de haber generado el registro
  actualizarIdentificador: async (id_grupo, identificador) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query("UPDATE grupos SET identificador = ? WHERE id_grupo = ?", [identificador, id_grupo]);
    } finally {
      if (conn) conn.release();
    }
  },

  // ==========================================
  // MODIFICADO: Se incluyó nivel_academico
  // ==========================================
  getGrupoById: async (id_grupo) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_grupo, identificador, carrera_id, cuatrimestre_id, nivel_academico, estatus 
         FROM grupos WHERE id_grupo = ? LIMIT 1`,
        [id_grupo]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  // Obtener todos los grupos asociados a una carrera específica
  getGruposByCarrera: async (carrera_id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT id_grupo, identificador FROM grupos WHERE carrera_id = ?",
        [carrera_id]
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // ==========================================
  // MODIFICADO: Se incluyó nivel_academico en la actualización
  // ==========================================
  actualizarGrupo: async (id_grupo, datosGrupo) => {
    const { identificador, carrera_id, cuatrimestre_id, nivel_academico, modificado_por } = datosGrupo;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE grupos 
         SET identificador = ?, carrera_id = ?, cuatrimestre_id = ?, nivel_academico = ?, modificado_por = ?, fecha_modificacion = NOW()
         WHERE id_grupo = ?`,
        [identificador, carrera_id, cuatrimestre_id, nivel_academico, modificado_por, id_grupo]
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

  // Dar de baja un grupo (Soft delete)
  desactivarGrupo: async (id_grupo, eliminado_por) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE grupos 
         SET estatus = 'INACTIVO', modificado_por = ?, fecha_modificacion = NOW()
         WHERE id_grupo = ?`,
        [eliminado_por, id_grupo]
      );
      return result.affectedRows;
    } finally {
      if (conn) conn.release();
    }
  },

  // Reactivar un grupo dado de baja
  reactivarGrupo: async (id_grupo, modificado_por) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE grupos 
         SET estatus = 'ACTIVO', modificado_por = ?, fecha_modificacion = NOW()
         WHERE id_grupo = ?`,
        [modificado_por, id_grupo]
      );
      return result.affectedRows;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = grupoModel;