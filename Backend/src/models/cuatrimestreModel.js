const pool = require("../config/database");

const cuatrimestreModel = {
  // Método dedicado a la obtención de cuatrimestres para interfaz interna
  getCuatrimestres: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT id_cuatrimestre, nombre
        FROM cuatrimestres
        ORDER BY id_cuatrimestre ASC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // ─── EP-03 SESA: GET /cuatrimestres/catalogo ──────────────────────────────────────────
  // Devuelve los 9 cuatrimestres del plan de estudios sin filtro de estatus,
  // tal como especifica SESA. Misma query que getCuatrimestres; método
  // separado para mantener independencia entre la API interna y la de SESA.
  ObtenerCuatrimestres: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT id_cuatrimestre, nombre
        FROM cuatrimestres
        ORDER BY id_cuatrimestre ASC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
};

module.exports = cuatrimestreModel;