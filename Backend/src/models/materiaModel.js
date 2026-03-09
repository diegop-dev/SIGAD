const pool = require("../config/database");

const materiaModel = {
  getAllMaterias: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      // Se mantiene el JOIN para devolver la información curricular cruzada
      const rows = await conn.query(`
        SELECT
          m.*,
          c.nombre AS cuatrimestre_nombre,
          p.codigo AS periodo_codigo,
          car.nombre_carrera
        FROM Materias m
        LEFT JOIN Cuatrimestres c ON m.cuatrimestre_id = c.id_cuatrimestre
        LEFT JOIN Periodos p ON m.periodo_id = p.id_periodo
        LEFT JOIN Carreras car ON m.carrera_id = car.id_carrera
        ORDER BY m.id_materia DESC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  createMateria: async (data) => {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // Inserción directa. El codigo_unico ahora proviene del frontend.
      const result = await conn.query(
        `INSERT INTO Materias
        (codigo_unico, periodo_id, cuatrimestre_id, nombre, creditos, cupo_maximo, tipo_asignatura, carrera_id, creado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.codigo_unico,
          data.periodo_id,
          data.cuatrimestre_id,
          data.nombre,
          data.creditos,
          data.cupo_maximo,
          data.tipo_asignatura,
          data.carrera_id,
          data.creado_por
        ]
      );

      return {
        id: result.insertId,
        codigo_unico: data.codigo_unico
      };
    } finally {
      if (conn) conn.release();
    }
  },

  updateMateria: async (id, data) => {
    let conn;
    try {
      conn = await pool.getConnection();
      
      // Se añade codigo_unico a la sentencia UPDATE
      await conn.query(`
        UPDATE Materias
        SET
          codigo_unico = ?,
          nombre = ?,
          creditos = ?,
          cupo_maximo = ?,
          tipo_asignatura = ?,
          periodo_id = ?,
          cuatrimestre_id = ?,
          carrera_id = ?,
          modificado_por = ?
        WHERE id_materia = ?
      `, [
        data.codigo_unico,
        data.nombre,
        data.creditos,
        data.cupo_maximo,
        data.tipo_asignatura,
        data.periodo_id,
        data.cuatrimestre_id,
        data.carrera_id,
        data.modificado_por,
        id
      ]);
    } finally {
      if (conn) conn.release();
    }
  },

  checkMateriaUsage: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT COUNT(*) AS total 
        FROM Asignaciones 
        WHERE materia_id = ?`,
        [id]
      );
      return Number(rows[0].total);
    } finally {
      if (conn) conn.release();
    }
  },

  deleteMateriaFisica: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `DELETE FROM Materias WHERE id_materia = ?`,
        [id]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  toggleMateriaStatus: async (id, usuario) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `UPDATE Materias
        SET
          estatus = IF(estatus='ACTIVO', 'INACTIVO', 'ACTIVO'),
          eliminado_por = ?,
          fecha_eliminacion = NOW()
        WHERE id_materia = ?`,
        [usuario, id]
      );
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = materiaModel;