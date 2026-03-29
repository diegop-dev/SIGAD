const pool = require("../config/database");

const carreraModel = {
  getCarreraById: async (id_carrera) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT * FROM carreras WHERE id_carrera = ?", [id_carrera]);
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  findExistingCarrera: async (nombre_carrera, modalidad, nivel_academico) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_carrera, nombre_carrera 
         FROM carreras 
         WHERE nombre_carrera = ? AND modalidad = ? AND nivel_academico = ? LIMIT 1`,
        [nombre_carrera, modalidad, nivel_academico],
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  verificarSiglasExistentes: async (siglas, excluir_id = null) => {
    let conn;
    try {
      conn = await pool.getConnection();
      let query = "SELECT COUNT(*) AS total FROM carreras WHERE codigo_unico = ?";
      let params = [siglas];
      if (excluir_id) {
        query += " AND id_carrera != ?";
        params.push(excluir_id);
      }
      const rows = await conn.query(query, params);
      return rows[0].total > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  getAcademiasActivas: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT id_academia, nombre FROM academias WHERE estatus = 'ACTIVO'"
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  crearCarrera: async (datosCarrera) => {
    const { codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, creado_por } = datosCarrera;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO carreras (codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, estatus, creado_por, fecha_creacion)
         VALUES (?, ?, ?, ?, ?, 'ACTIVO', ?, NOW())`,
        [codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, creado_por],
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  getAllCarreras: async (periodo_id = null) => {
    let conn;
    try {
      conn = await pool.getConnection();
      if (periodo_id) {
        const rows = await conn.query(`
          SELECT DISTINCT 
            c.id_carrera, 
            c.codigo_unico,
            c.nombre_carrera, 
            c.modalidad,
            c.nivel_academico,
            c.estatus,
            c.academia_id
          FROM carreras c
          INNER JOIN materias m ON c.id_carrera = m.carrera_id
          WHERE m.periodo_id = ? AND c.estatus = 'ACTIVO'
          ORDER BY c.nombre_carrera ASC
        `, [periodo_id]);
        return rows;
      } else {
        const rows = await conn.query(`
          SELECT 
            c.id_carrera, 
            c.codigo_unico,
            c.nombre_carrera, 
            c.modalidad,
            c.nivel_academico,
            c.estatus,
            c.academia_id, 
            a.nombre AS nombre_academia
          FROM carreras c
          LEFT JOIN academias a ON c.academia_id = a.id_academia
          ORDER BY c.id_carrera DESC
        `);
        return rows;
      }
    } finally {
      if (conn) conn.release();
    }
  },

  getCarrerasParaSincronizacion: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`SELECT id_carrera, nombre_carrera FROM carreras WHERE estatus = 'ACTIVO'`);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  actualizarCarrera: async (id_carrera, datosCarrera) => {
    const { codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, modificado_por } = datosCarrera;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE carreras 
         SET codigo_unico = ?, nombre_carrera = ?, modalidad = ?, academia_id = ?, nivel_academico = ?, modificado_por = ?, fecha_modificacion = NOW()
         WHERE id_carrera = ?`,
        [codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, modificado_por, id_carrera]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  deactivateCarrera: async (id_carrera, eliminado_por, motivo_baja) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE carreras 
         SET estatus = 'INACTIVO', eliminado_por = ?, motivo_baja = ?, fecha_eliminacion = NOW()
         WHERE id_carrera = ?`,
        [eliminado_por, motivo_baja, id_carrera]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  // ─── EP-02 SESA: GET /programas_academicos ───────────────────────────────────
  // Devuelve carreras activas con los nombres de campo que espera SESA.
  // id_carrera  → id_programa_academico
  // nombre_carrera → nombre_programa
  ObtenerProgramasAcademicos: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT
          id_carrera    AS id_programa_academico,
          codigo_unico,
          nombre_carrera AS nombre_programa,
          modalidad,
          nivel_academico
        FROM carreras
        WHERE estatus = 'ACTIVO'
        ORDER BY nivel_academico ASC, nombre_carrera ASC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
};

module.exports = carreraModel;