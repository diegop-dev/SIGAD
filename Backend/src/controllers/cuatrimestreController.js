const pool = require("../config/database");

const getCuatrimestres = async (req, res) => {

  let conn;

  try {

    conn = await pool.getConnection();

    const rows = await conn.query(`
      SELECT 
        id_cuatrimestre,
        nombre
      FROM Cuatrimestres
      ORDER BY nombre ASC
    `);

    res.json(rows);

  } catch (error) {

    console.error("[Error getCuatrimestres]:", error);
    res.status(500).json({ error: "Error al obtener cuatrimestres" });

  } finally {

    if (conn) conn.release();

  }
};

module.exports = { getCuatrimestres };