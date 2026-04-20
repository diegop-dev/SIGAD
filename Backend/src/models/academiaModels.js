const db = require('../config/database');

const Academia = {
  getAcademiaById: async (id) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(
        "SELECT * FROM academias WHERE id_academia = ?",
        [id]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  getAcademiaByUsuario: async (usuario_id) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(
        "SELECT id_academia, nombre FROM academias WHERE usuario_id = ? AND estatus = 'ACTIVO' LIMIT 1",
        [usuario_id]
      );
      return rows[0];
    } finally {
      if (conn) conn.release();
    }
  },

  getCoordinadoresDisponibles: async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT id_usuario, nombres, apellido_paterno, apellido_materno, foto_perfil_url
        FROM usuarios
        WHERE rol_id = 2  -- 🔹 Administradores/Coordinadores
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  validarNombre: async (nombre, id_academia = null) => {
    let conn;
    try {
      conn = await db.getConnection();
      let query = "SELECT COUNT(*) AS total FROM academias WHERE nombre = ?";
      let params = [nombre];

      if (id_academia) {
        query += " AND id_academia != ?";
        params.push(id_academia);
      }

      const rows = await conn.query(query, params);
      return rows[0].total > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  // ─── VALIDACIÓN DE INTEGRIDAD PARA EDICIÓN Y BAJA LÓGICA ──────────────────
  // Regla de negocio: restringe la alteración del nombre o coordinador si
  // la academia tiene materias vinculadas a una asignación docente vigente.
  checkDependenciasActivas: async (id_academia) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT COUNT(DISTINCT rep.min_id) AS dependencias_activas
        FROM academias ac
        INNER JOIN carreras c ON ac.id_academia = c.academia_id
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
        WHERE ac.id_academia = ? 
          AND ac.estatus = 'ACTIVO'
          AND a.estatus_acta = 'ABIERTA'
          AND a.estatus_confirmacion = 'ACEPTADA'
          AND p.estatus = 'ACTIVO'
      `, [id_academia]);
      
      return rows[0].dependencias_activas > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  checkDependenciasEnviadas: async (id_academia) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT COUNT(a.id_asignacion) AS dependencias_enviadas
        FROM academias ac
        INNER JOIN carreras c ON ac.id_academia = c.academia_id
        INNER JOIN materias m ON c.id_carrera = m.carrera_id
        INNER JOIN asignaciones a ON m.id_materia = a.materia_id
        INNER JOIN periodos p ON a.periodo_id = p.id_periodo
        WHERE ac.id_academia = ? 
          AND a.estatus_acta = 'ABIERTA'
          AND a.estatus_confirmacion = 'ENVIADA'
          AND p.estatus = 'ACTIVO'
      `, [id_academia]);
      return rows[0].dependencias_enviadas > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  registrar: async (data) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.query(
        `INSERT INTO academias (nombre, descripcion, usuario_id, creado_por, estatus, fecha_creacion)
         VALUES (?, ?, ?, ?, 'ACTIVO', NOW())`,
        [data.nombre, data.descripcion, data.usuario_id, data.creado_por]
      );
    } finally {
      if (conn) conn.release();
    }
  },

  actualizar: async (id, data) => {
    let conn;
    try {
      conn = await db.getConnection();
      
      let updates = [
        'modificado_por = ?', 
        'fecha_modificacion = NOW()'
      ];
      let params = [data.modificado_por];

      if (data.descripcion !== undefined) {
        updates.push('descripcion = ?');
        params.push(data.descripcion);
      }
      if (data.nombre !== undefined) {
        updates.push('nombre = ?');
        params.push(data.nombre);
      }
      if (data.usuario_id !== undefined) {
        updates.push('usuario_id = ?');
        params.push(data.usuario_id);
      }

      let query = `UPDATE academias SET ${updates.join(', ')} WHERE id_academia = ?`;
      params.push(id);

      await conn.query(query, params);
      return { success: true };
    } finally {
      if (conn) conn.release();
    }
  },

  toggleAcademiaStatus: async (id, usuario) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.query(`
        UPDATE academias
        SET
          estatus           = IF(estatus = 'ACTIVO', 'INACTIVO', 'ACTIVO'),
          eliminado_por     = IF(estatus = 'ACTIVO', ?, NULL),
          fecha_eliminacion = IF(estatus = 'ACTIVO', NOW(), NULL),
          modificado_por    = ?
        WHERE id_academia = ?
      `, [usuario, usuario, id]);
      return { success: true };
    } finally {
      if (conn) conn.release();
    }
  },

  getAcademias: async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT 
          a.id_academia,
          a.nombre,
          a.descripcion,
          a.usuario_id,
          DATE_FORMAT(a.fecha_creacion, '%d/%m/%Y') AS fecha_creacion,
          a.estatus,
          CONCAT(
            u.nombres, ' ',
            u.apellido_paterno,
            IF(u.apellido_materno IS NOT NULL AND u.apellido_materno != '',
              CONCAT(' ', u.apellido_materno),
              ''
            )
          ) AS coordinador_nombre,
          u.foto_perfil_url AS coordinador_foto_perfil_url
        FROM academias a
        LEFT JOIN usuarios u ON a.usuario_id = u.id_usuario
        ORDER BY a.fecha_creacion DESC
      `);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  getCarrerasByAcademia: async (id_academia) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT id_carrera, codigo_unico, nombre_carrera, modalidad, nivel_academico, estatus 
        FROM carreras 
        WHERE academia_id = ?
        ORDER BY nivel_academico ASC, nombre_carrera ASC
      `, [id_academia]);
      return rows;
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = Academia;