const pool = require("../config/database");

const carreraModel = {
  getAllCarreras: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_carrera, nombre_carrera FROM Carreras`
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = carreraModel;