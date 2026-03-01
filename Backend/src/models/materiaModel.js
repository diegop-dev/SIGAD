const pool = require("../config/database");

const materiaModel = {
  // Verifica si ya existe una materia con ese código
  findByCodigo: async (codigo_unico) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_materia FROM Materias WHERE codigo_unico = ? LIMIT 1`,
        [codigo_unico]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  // Obtener todas las materias
  getAllMaterias: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT * FROM Materias ORDER BY id_materia DESC`
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // Crear nueva materia
  createMateria: async (materiaData) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO Materias 
        (codigo_unico, nombre, creditos, cuatrimestre, tipo_asignatura, carrera_id, creado_por) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          materiaData.codigo_unico,
          materiaData.nombre,
          materiaData.creditos,
          materiaData.cuatrimestre,
          materiaData.tipo_asignatura,
          materiaData.carrera_id,
          materiaData.creado_por,
        ]
      );
      return result.insertId;
    } finally {
      if (conn) conn.release();
    }
  },

  // Actualizar materia
  updateMateria: async (id, materiaData) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Materias 
         SET nombre = ?, creditos = ?, cuatrimestre = ?, tipo_asignatura = ?, carrera_id = ?, estatus = ?
         WHERE id_materia = ?`,
        [
          materiaData.nombre,
          materiaData.creditos,
          materiaData.cuatrimestre,
          materiaData.tipo_asignatura,
          materiaData.carrera_id,
          materiaData.estatus,
          id,
        ]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  // Baja lógica
  deleteMateria: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Materias SET estatus = 'INACTIVO' WHERE id_materia = ?`,
        [id]
      );
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = materiaModel;