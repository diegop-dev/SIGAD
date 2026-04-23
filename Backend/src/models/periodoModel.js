const pool = require("../config/database");

const periodoModel = {
  getPeriodoById: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT * FROM Periodos WHERE id_periodo = ?`,
        [id]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

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

  // ─── VALIDACIÓN DE INTEGRIDAD PARA EDICIÓN Y BAJA LÓGICA ──────────────────
  // Regla de negocio: restringe la alteración de fechas críticas o la 
  // desactivación del periodo si existen asignaciones docentes vigentes.
  checkDependenciasActivas: async (id_periodo) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT COUNT(DISTINCT rep.min_id) AS dependencias_activas
        FROM Periodos p
        INNER JOIN Asignaciones a ON p.id_periodo = a.periodo_id
        INNER JOIN (
          SELECT 
            MIN(id_asignacion) AS min_id,
            grupo_id, materia_id, docente_id, periodo_id, aula_id
          FROM Asignaciones
          GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
        ) rep ON a.grupo_id <=> rep.grupo_id 
             AND a.materia_id = rep.materia_id 
             AND a.docente_id = rep.docente_id 
             AND a.periodo_id = rep.periodo_id 
             AND a.aula_id = rep.aula_id
        WHERE p.id_periodo = ? 
          AND p.estatus = 'ACTIVO'
          AND a.estatus_acta = 'ABIERTA'
          AND a.estatus_confirmacion = 'ACEPTADA'
      `, [id_periodo]);
      
      return rows[0].dependencias_activas > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  // ─── EP-01 SESA: GET /periodos/activo ────────────────────────────────────────
  // Devuelve el único periodo con estatus ACTIVO.
  // La respuesta es un objeto plano (no arreglo) según la spec de SESA.
  ObtenerPeriodoActivo: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT
          id_periodo,
          codigo,
          anio,
          DATE_FORMAT(fecha_inicio,      '%Y-%m-%d') AS fecha_inicio,
          DATE_FORMAT(fecha_fin,         '%Y-%m-%d') AS fecha_fin,
          DATE_FORMAT(fecha_limite_calif,'%Y-%m-%d') AS fecha_limite_calif,
          estatus
        FROM Periodos
        WHERE estatus = 'ACTIVO'
        LIMIT 1
      `);
      return rows[0] ?? null;
    } finally {
      if (conn) conn.release();
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────

  createPeriodo: async (data) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(`
        INSERT INTO Periodos
          (codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif, creado_por)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        data.codigo,
        data.anio,
        data.fecha_inicio,
        data.fecha_fin,
        data.fecha_limite_calif,
        data.creado_por,
      ]);
      return { id: result.insertId };
    } finally {
      if (conn) conn.release();
    }
  },

  updatePeriodo: async (id, data) => {
    let conn;
    try {
      conn = await pool.getConnection();

      // Campos base siempre permitidos
      let updates = [
        'codigo = ?',
        'anio = ?',
        'modificado_por = ?'
      ];
      
      let queryParams = [
        data.codigo,
        data.anio,
        data.modificado_por
      ];

      // Inyección condicional de campos estructurales (fechas)
      if (data.fecha_inicio !== undefined) {
        updates.push('fecha_inicio = ?');
        queryParams.push(data.fecha_inicio);
      }
      if (data.fecha_fin !== undefined) {
        updates.push('fecha_fin = ?');
        queryParams.push(data.fecha_fin);
      }
      if (data.fecha_limite_calif !== undefined) {
        updates.push('fecha_limite_calif = ?');
        queryParams.push(data.fecha_limite_calif);
      }

      let query = `UPDATE Periodos SET ${updates.join(', ')} WHERE id_periodo = ?`;
      queryParams.push(id);

      await conn.query(query, queryParams);
    } finally {
      if (conn) conn.release();
    }
  },

  deletePeriodoFisico: async (id) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(
        `DELETE FROM Periodos WHERE id_periodo = ?`,
        [id]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  togglePeriodoStatus: async (id, usuario) => {
    let conn;
    try {
      conn = await pool.getConnection();
      await conn.query(`
        UPDATE Periodos
        SET
          estatus           = IF(estatus = 'ACTIVO', 'INACTIVO', 'ACTIVO'),
          eliminado_por     = IF(estatus = 'ACTIVO', ?, NULL),
          fecha_eliminacion = IF(estatus = 'ACTIVO', NOW(), NULL),
          modificado_por    = ?
        WHERE id_periodo = ?
      `, [usuario, usuario, id]);
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = periodoModel;