const pool = require("../config/database");

const materiaModel = {

  findByCodigo: async (codigo_unico) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_materia FROM Materias 
         WHERE codigo_unico = ? 
         LIMIT 1`,
        [codigo_unico]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  findByCodigoExcludingId: async (codigo_unico, id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_materia FROM Materias 
         WHERE codigo_unico = ? 
         AND id_materia != ? 
         LIMIT 1`,
        [codigo_unico, id]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  getAllMaterias: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT * FROM Materias 
         WHERE estatus = 'ACTIVO'
         ORDER BY id_materia DESC`
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  createMateria: async (materiaData) => {
  let conn;
  try {
    conn = await pool.getConnection();

    const last = await conn.query(
      `SELECT id_materia FROM Materias ORDER BY id_materia DESC LIMIT 1`
    );

    const nextId = last.length > 0 ? last[0].id_materia + 1 : 1;

    const codigoGenerado = `MAT-${String(nextId).padStart(5, "0")}`;

    const result = await conn.query(
      `INSERT INTO Materias 
      (codigo_unico, nombre, creditos, cuatrimestre, tipo_asignatura, carrera_id, creado_por) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        codigoGenerado,
        materiaData.nombre,
        materiaData.creditos,
        materiaData.cuatrimestre,
        materiaData.tipo_asignatura,
        materiaData.carrera_id,
        materiaData.creado_por,
      ]
    );

    return {
      id: result.insertId,
      codigo_unico: codigoGenerado,
    };

  } finally {
    if (conn) conn.release();
  }
},

  updateMateria: async (id, materiaData) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Materias 
         SET nombre = ?, 
             creditos = ?, 
             cuatrimestre = ?, 
             tipo_asignatura = ?, 
             carrera_id = ?
         WHERE id_materia = ?`,
        [
          materiaData.nombre,
          materiaData.creditos,
          materiaData.cuatrimestre,
          materiaData.tipo_asignatura,
          materiaData.carrera_id,
          id,
        ]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  deleteMateria: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Materias 
         SET estatus = 'INACTIVO'
         WHERE id_materia = ?`,
        [id]
      );
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = materiaModel;