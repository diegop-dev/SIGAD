const pool = require("../config/database");

const periodoModel = {
  getPeriodoById: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT * FROM Periodos WHERE id_periodo = ?`,
        [id]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  getAllPeriodos: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT
          id_periodo,
          codigo,
          anio,
          fecha_inicio,
          fecha_fin,
          fecha_limite_calif,
          estatus
        FROM Periodos
        ORDER BY fecha_inicio DESC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // ─── EP-01 SESA: GET /periodos/activo ────────────────────────────────────────
  // Devuelve el único periodo con estatus ACTIVO.
  // La respuesta es un objeto plano (no arreglo) según la spec de SESA.
  ObtenerPeriodoActivo: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT
          id_periodo,
          codigo,
          anio,
          DATE_FORMAT(fecha_inicio,      '%Y-%m-%d') AS fecha_inicio,
          DATE_FORMAT(fecha_fin,         '%Y-%m-%d') AS fecha_fin,
          DATE_FORMAT(fecha_limite_calif,'%Y-%m-%d') AS fecha_limite_calif,
          estatus
        FROM Periodos
        WHERE estatus = 'ACTIVO'
        LIMIT 1
      `);
      return rows[0] ?? null;
    } finally {
      if (conn) conn.release();
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────

  createPeriodo: async (data) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(`
        INSERT INTO Periodos
          (codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif, creado_por)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        data.codigo,
        data.anio,
        data.fecha_inicio,
        data.fecha_fin,
        data.fecha_limite_calif,
        data.creado_por,
      ]);
      return { id: result.insertId };
    } finally {
      if (conn) conn.release();
    }
  },

  updatePeriodo: async (id, data) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`
        UPDATE Periodos
        SET
          codigo            = ?,
          anio              = ?,
          fecha_inicio      = ?,
          fecha_fin         = ?,
          fecha_limite_calif= ?,
          modificado_por    = ?
        WHERE id_periodo = ?
      `, [
        data.codigo,
        data.anio,
        data.fecha_inicio,
        data.fecha_fin,
        data.fecha_limite_calif,
        data.modificado_por,
        id,
      ]);
    } finally {
      if (conn) conn.release();
    }
  },

  deletePeriodoFisico: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `DELETE FROM Periodos WHERE id_periodo = ?`,
        [id]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  togglePeriodoStatus: async (id, usuario) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`
        UPDATE Periodos
        SET
          estatus           = IF(estatus = 'ACTIVO', 'INACTIVO', 'ACTIVO'),
          eliminado_por     = IF(estatus = 'ACTIVO', ?, NULL),
          fecha_eliminacion = IF(estatus = 'ACTIVO', NOW(), NULL),
          modificado_por    = ?
        WHERE id_periodo = ?
      `, [usuario, usuario, id]);
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = periodoModel;