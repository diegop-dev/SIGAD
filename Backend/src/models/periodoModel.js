const pool = require("../config/database");

const periodoModel = {

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

  createPeriodo: async (data) => {

    let conn;

    try {

      conn = await pool.getConnection();

      const result = await conn.query(`
        INSERT INTO Periodos
        (codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif, creado_por)
        VALUES (?,?,?,?,?,?)
      `,[
        data.codigo,
        data.anio,
        data.fecha_inicio,
        data.fecha_fin,
        data.fecha_limite_calif,
        data.creado_por
      ]);

      return {
        id: result.insertId
      };

    } finally {
      if (conn) conn.release();
    }
  },

  updatePeriodo: async (id,data) => {

    let conn;

    try {

      conn = await pool.getConnection();

      await conn.query(`
        UPDATE Periodos
        SET
          codigo = ?,
          anio = ?,
          fecha_inicio = ?,
          fecha_fin = ?,
          fecha_limite_calif = ?,
          modificado_por = ?
        WHERE id_periodo = ?
      `,[
        data.codigo,
        data.anio,
        data.fecha_inicio,
        data.fecha_fin,
        data.fecha_limite_calif,
        data.modificado_por,
        id
      ]);

    } finally {
      if (conn) conn.release();
    }

  },

  inactivarPeriodo: async (id,usuario) => {

    let conn;

    try {

      conn = await pool.getConnection();

      await conn.query(`
        UPDATE Periodos
        SET
          estatus = 'INACTIVO',
          eliminado_por = ?,
          fecha_eliminacion = NOW()
        WHERE id_periodo = ?
      `,[usuario,id]);

    } finally {
      if (conn) conn.release();
    }

  }

};

module.exports = periodoModel;