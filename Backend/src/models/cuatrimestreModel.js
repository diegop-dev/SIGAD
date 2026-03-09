const pool = require("../config/database");

const cuatrimestreModel = {
  // método dedicado a la obtención de periodos para sincronización e interfaz
  getCuatrimestres: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(` SELECT id_cuatrimestre, nombre FROM cuatrimestres ORDER BY id_cuatrimestre ASC `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = cuatrimestreModel;