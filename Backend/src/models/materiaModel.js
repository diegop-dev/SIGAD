const pool = require("../config/database");

const materiaModel = {

  getMateriaById: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT * FROM Materias WHERE id_materia = ?",
        [id]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  getCuatrimestreActivo: async (cuatrimestre_id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT estatus FROM Cuatrimestres WHERE id_cuatrimestre = ?`,
        [cuatrimestre_id]
      );
      if (!rows.length) return false;
      return rows[0].estatus === "ACTIVO";
    } finally {
      if (conn) conn.release();
    }
  },

  getAcademiaDeMateria: async (id_materia) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT a.id_academia, a.usuario_id
        FROM Materias m
        JOIN Carreras c ON m.carrera_id = c.id_carrera
        JOIN Academias a ON c.academia_id = a.id_academia
        WHERE m.id_materia = ?
      `,[id_materia]);
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  // ========================================================
  // MODIFICADO: Se incluyó nivel_academico y <=> para carrera_id (Tronco Común)
  // ========================================================
  verificarMateriaDuplicada: async (nombre, carrera_id, nivel_academico, id_actual = null) => {
    let conn;
    try {
      conn = await pool.getConnection();
      let query = `
        SELECT id_materia
        FROM Materias
        WHERE nombre = ?
        AND carrera_id <=> ?
        AND nivel_academico = ?
      `;
      const params = [nombre, carrera_id || null, nivel_academico];

      if (id_actual) {
        query += ` AND id_materia != ?`;
        params.push(id_actual);
      }

      const rows = await conn.query(query, params);
      return rows.length > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  verificarCodigoExistente: async (codigo) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT id_materia FROM Materias WHERE codigo_unico = ? LIMIT 1",
        [codigo]
      );
      return rows.length > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  getMateriasParaSincronizacion: async (carrera_id, cuatrimestre_id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      if (!carrera_id || !cuatrimestre_id) return [];

      const rows = await conn.query(`
        SELECT id_materia, codigo_unico, nombre, cupo_maximo
        FROM Materias
        WHERE carrera_id = ?
        AND cuatrimestre_id = ?
        AND estatus = 'ACTIVO'
        ORDER BY id_materia ASC
      `,[carrera_id, cuatrimestre_id]);

      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  getAllMaterias: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
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

  // ========================================================
  // INSERCIÓN
  // ========================================================
  createMateria: async (data) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(`
        INSERT INTO Materias
        (codigo_unico, periodo_id, cuatrimestre_id, nombre, creditos, cupo_maximo, tipo_asignatura, nivel_academico, carrera_id, creado_por)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,[
        data.codigo_unico,
        data.periodo_id,
        data.cuatrimestre_id,
        data.nombre,
        data.creditos,
        data.cupo_maximo,
        data.tipo_asignatura,
        data.nivel_academico,
        data.carrera_id,
        data.creado_por
      ]);
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  // ========================================================
  // ACTUALIZACIÓN
  // ========================================================
  updateMateria: async (id, data) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`
        UPDATE Materias
        SET
          codigo_unico = ?,
          nombre = ?,
          creditos = ?,
          cupo_maximo = ?,
          tipo_asignatura = ?,
          nivel_academico = ?, 
          periodo_id = ?,
          cuatrimestre_id = ?,
          carrera_id = ?,
          modificado_por = ?
        WHERE id_materia = ?
      `,[
        data.codigo_unico,
        data.nombre,
        data.creditos,
        data.cupo_maximo,
        data.tipo_asignatura,
        data.nivel_academico,
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
      const rows = await conn.query(`
        SELECT COUNT(*) AS total
        FROM Asignaciones
        WHERE materia_id = ?
      `,[id]);
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
      await conn.query(`
        UPDATE Materias
        SET
          estatus = IF(estatus='ACTIVO','INACTIVO','ACTIVO'),
          eliminado_por = IF(estatus='ACTIVO', ?, NULL),
          fecha_eliminacion = IF(estatus='ACTIVO', NOW(), NULL),
          modificado_por = ?
        WHERE id_materia = ?
      `,[usuario,usuario,id]);
    } finally {
      if (conn) conn.release();
    }
  }

};

module.exports = materiaModel;