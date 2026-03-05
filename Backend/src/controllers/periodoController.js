const pool = require("../config/database");

const getPeriodos = async (req, res) => {
  let conn;

  try {

    conn = await pool.getConnection();

    const rows = await conn.query(`
      SELECT 
        id_periodo,
        codigo
      FROM Periodos
      ORDER BY id_periodo DESC
    `);

    res.json(rows);

  } catch (error) {

    console.error("[Error getPeriodos]:", error);
    res.status(500).json({ error: "Error al obtener periodos" });

  } finally {

    if (conn) conn.release();

  }
};

module.exports = { getPeriodos };