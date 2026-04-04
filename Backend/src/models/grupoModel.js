const pool = require("../config/database");

const grupoModel = {
  getGruposParaSincronizacion: async (carrera_id, cuatrimestre_id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      if (!carrera_id || !cuatrimestre_id) return [];
      const rows = await conn.query(`
        SELECT id_grupo, identificador
        FROM grupos
        WHERE carrera_id = ? AND cuatrimestre_id = ? AND estatus = 'ACTIVO'
        ORDER BY id_grupo ASC
      `, [carrera_id, cuatrimestre_id]);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

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

  getCarreraSiglas: async (carrera_id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT codigo_unico FROM carreras WHERE id_carrera = ?",
        [carrera_id]
      );
      return rows[0] ? rows[0].codigo_unico : 'XXX';
    } finally {
      if (conn) conn.release();
    }
  },

  actualizarIdentificador: async (id_grupo, identificador) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        "UPDATE grupos SET identificador = ? WHERE id_grupo = ?",
        [identificador, id_grupo]
      );
    } finally {
      if (conn) conn.release();
    }
  },

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
  },

  // ─── EP-05 SESA: GET /grupos/catalogo ──────────────────────────────────────────────────
  // Filtro implícito: estatus = ACTIVO.
  // Filtros opcionales: id_programa_academico (carrera_id), cuatrimestre_id.
  ObtenerGrupos: async ({ id_programa_academico, cuatrimestre_id } = {}) => {
    let conn;
    try {
      conn = await pool.getConnection();

      const filtros = [`g.estatus = 'ACTIVO'`];
      const params  = [];

      if (id_programa_academico) {
        filtros.push(`g.carrera_id = ?`);
        params.push(id_programa_academico);
      }
      if (cuatrimestre_id) {
        filtros.push(`g.cuatrimestre_id = ?`);
        params.push(cuatrimestre_id);
      }

      const where = filtros.join(" AND ");

      const rows = await conn.query(`
        SELECT
          g.id_grupo,
          g.identificador,
          g.nivel_academico,
          g.carrera_id    AS id_programa_academico,
          g.cuatrimestre_id
        FROM grupos g
        WHERE ${where}
        ORDER BY g.id_grupo ASC
      `, params);

      return rows;
    } finally {
      if (conn) conn.release();
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
};

module.exports = grupoModel;