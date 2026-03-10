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

  findExistingCarrera: async (nombre_carrera, modalidad) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_carrera, nombre_carrera 
         FROM carreras 
         WHERE nombre_carrera = ? AND modalidad = ? LIMIT 1`,
        [nombre_carrera, modalidad],
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  verificarSiglasExistentes: async (siglas) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT COUNT(*) AS total FROM carreras WHERE codigo_unico = ?",
        [siglas]
      );
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
    const { codigo_unico, nombre_carrera, modalidad, academia_id, creado_por } = datosCarrera;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO carreras (codigo_unico, nombre_carrera, modalidad, academia_id, estatus, creado_por, fecha_creacion)
         VALUES (?, ?, ?, ?, 'ACTIVO', ?, NOW())`,
        [codigo_unico, nombre_carrera, modalidad, academia_id, creado_por],
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  getAllCarreras: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT 
          c.id_carrera, 
          c.codigo_unico,
          c.nombre_carrera, 
          c.modalidad,
          c.estatus, 
          a.nombre AS nombre_academia
        FROM carreras c
        LEFT JOIN academias a ON c.academia_id = a.id_academia
        ORDER BY c.id_carrera DESC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  getCarrerasParaSincronizacion: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(` SELECT id_carrera, nombre_carrera FROM carreras WHERE estatus = 'ACTIVO' `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = carreraModel;