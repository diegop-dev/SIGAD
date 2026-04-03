const pool = require("../config/database");

const carreraModel = {
  getCarreraById: async (id_carrera) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query("SELECT * FROM carreras WHERE id_carrera = ?", [id_carrera]);
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  findExistingCarrera: async (nombre_carrera, modalidad, nivel_academico) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_carrera, nombre_carrera 
         FROM carreras 
         WHERE nombre_carrera = ? AND modalidad = ? AND nivel_academico = ? LIMIT 1`,
        [nombre_carrera, modalidad, nivel_academico],
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  verificarSiglasExistentes: async (siglas, excluir_id = null) => {
    let conn;
    try {
      conn = await pool.getConnection();
      let query = "SELECT COUNT(*) AS total FROM carreras WHERE codigo_unico = ?";
      let params = [siglas];
      if (excluir_id) {
        query += " AND id_carrera != ?";
        params.push(excluir_id);
      }
      const rows = await conn.query(query, params);
      return rows[0].total > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  getAcademiasActivas: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        "SELECT id_academia, nombre FROM academias WHERE estatus = 'ACTIVO'"
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  crearCarrera: async (datosCarrera) => {
    const { codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, creado_por } = datosCarrera;
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `INSERT INTO carreras (codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, estatus, creado_por, fecha_creacion)
         VALUES (?, ?, ?, ?, ?, 'ACTIVO', ?, NOW())`,
        [codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, creado_por],
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  getAllCarreras: async (periodo_id = null) => {
    let conn;
    try {
      conn = await pool.getConnection();
      if (periodo_id) {
        const rows = await conn.query(`
          SELECT DISTINCT 
            c.id_carrera, 
            c.codigo_unico,
            c.nombre_carrera, 
            c.modalidad,
            c.nivel_academico,
            c.estatus,
            c.academia_id
          FROM carreras c
          INNER JOIN materias m ON c.id_carrera = m.carrera_id
          WHERE m.periodo_id = ? AND c.estatus = 'ACTIVO'
          ORDER BY c.nombre_carrera ASC
        `, [periodo_id]);
        return rows;
      } else {
        const rows = await conn.query(`
          SELECT 
            c.id_carrera, 
            c.codigo_unico,
            c.nombre_carrera, 
            c.modalidad,
            c.nivel_academico,
            c.estatus,
            c.academia_id, 
            a.nombre AS nombre_academia
          FROM carreras c
          LEFT JOIN academias a ON c.academia_id = a.id_academia
          ORDER BY c.id_carrera DESC
        `);
        return rows;
      }
    } finally {
      if (conn) conn.release();
    }
  },

  getCarrerasParaSincronizacion: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`SELECT id_carrera, nombre_carrera FROM carreras WHERE estatus = 'ACTIVO'`);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // ─── VALIDACIÓN DE INTEGRIDAD PARA EDICIÓN Y BAJA LOGICA ──────────────────
  // Regla de negocio: restringe mutaciones estructurales si la carrera
  // tiene materias vinculadas a una asignación docente vigente.
  checkDependenciasActivas: async (id_carrera) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT COUNT(DISTINCT rep.min_id) AS dependencias_activas
        FROM carreras c
        INNER JOIN materias m ON c.id_carrera = m.carrera_id
        INNER JOIN Asignaciones a ON m.id_materia = a.materia_id
        INNER JOIN Periodos p ON a.periodo_id = p.id_periodo
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
        WHERE c.id_carrera = ? 
          AND c.estatus = 'ACTIVO'
          AND a.estatus_acta = 'ABIERTA'
          AND a.estatus_confirmacion = 'ACEPTADA'
          AND p.estatus = 'ACTIVO'
      `, [id_carrera]);
      
      return rows[0].dependencias_activas > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  actualizarCarrera: async (id_carrera, datosCarrera) => {
    const { codigo_unico, nombre_carrera, modalidad, academia_id, nivel_academico, modificado_por } = datosCarrera;
    let conn;
    try {
      conn = await pool.getConnection();
      
      // base de campos de actualización siempre permitidos
      let updates = [
        'codigo_unico = ?',
        'nombre_carrera = ?',
        'modificado_por = ?',
        'fecha_modificacion = NOW()'
      ];
      
      let queryParams = [
        codigo_unico,
        nombre_carrera,
        modificado_por
      ];

      // inyección condicional de campos estructurales
      if (modalidad !== undefined) {
        updates.push('modalidad = ?');
        queryParams.push(modalidad);
      }
      if (academia_id !== undefined) {
        updates.push('academia_id = ?');
        queryParams.push(academia_id);
      }
      if (nivel_academico !== undefined) {
        updates.push('nivel_academico = ?');
        queryParams.push(nivel_academico);
      }

      let query = `UPDATE carreras SET ${updates.join(', ')} WHERE id_carrera = ?`;
      queryParams.push(id_carrera);

      const result = await conn.query(query, queryParams);
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  deactivateCarrera: async (id_carrera, eliminado_por, motivo_baja) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(
        `UPDATE carreras 
         SET estatus = 'INACTIVO', eliminado_por = ?, motivo_baja = ?, fecha_eliminacion = NOW()
         WHERE id_carrera = ?`,
        [eliminado_por, motivo_baja, id_carrera]
      );
      return result;
    } finally {
      if (conn) conn.release();
    }
  },

  // ─── EP-02 SESA: GET /programas_academicos ───────────────────────────────────
  // Devuelve carreras activas con los nombres de campo que espera SESA.
  // id_carrera  → id_programa_academico
  // nombre_carrera → nombre_programa
  ObtenerProgramasAcademicos: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(`
        SELECT
          id_carrera    AS id_programa_academico,
          codigo_unico,
          nombre_carrera AS nombre_programa,
          modalidad,
          nivel_academico
        FROM carreras
        WHERE estatus = 'ACTIVO'
        ORDER BY nivel_academico ASC, nombre_carrera ASC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },
  // ─────────────────────────────────────────────────────────────────────────────
};

module.exports = carreraModel;