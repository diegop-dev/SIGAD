const db = require('../config/database');

const docenteModel = {

  getDocenteById: async (id_docente) => {
    try {
      const query = `SELECT * FROM docentes WHERE id_docente = ? LIMIT 1`;
      const rows = await db.query(query, [id_docente]);
      return rows[0] || null;
    } catch (error) {
      console.error("[Error getDocenteById]:", error.message);
      throw error;
    }
  },

  getDocenteParaSincronizacion: async (id_docente) => {
    try {
      if (!id_docente) return [];
      const query = `SELECT matricula_empleado FROM docentes WHERE id_docente = ? AND estatus = 'ACTIVO'`;
      const rows = await db.query(query, [id_docente]);
      return rows;
    } catch (error) {
      console.error("[Error getDocenteParaSincronizacion]:", error.message);
      throw error;
    }
  },

  getUsuariosDisponibles: async () => {
    try {
      const query = `
        SELECT id_usuario, nombres, apellido_paterno, apellido_materno, personal_email 
        FROM usuarios 
        WHERE id_usuario NOT IN (SELECT usuario_id FROM docentes)
        AND rol_id = 3
      `;
      return await db.query(query);
    } catch (error) {
      console.error("Error al filtrar por rol:", error.message);
      throw error;
    }
  },

  getLastMatricula: async () => {
    const query = 'SELECT matricula_empleado FROM docentes ORDER BY id_docente DESC LIMIT 1';
    const rows = await db.query(query);
    return rows.length > 0 ? rows[0].matricula_empleado : null;
  },

  verifyDuplicates: async (rfc, curp) => {
    const query = 'SELECT id_docente FROM docentes WHERE rfc = ? OR curp = ? LIMIT 1';
    const rows = await db.query(query, [rfc, curp]);
    return rows.length > 0 ? rows[0] : null;
  },

  // ─── VALIDACIÓN DE INTEGRIDAD PARA EDICIÓN Y BAJA DE DOCENTES ─────────────
  // Regla de negocio: no se puede desactivar a un docente ni alterar su
  // nivel académico o academia si cuenta con asignaciones vigentes.
  // Modificar el nivel académico corrompería la validación de la HU-58.
  checkDependenciasActivas: async (id_docente) => {
    let conn;
    try {
      conn = await db.getConnection();
      const rows = await conn.query(`
        SELECT COUNT(DISTINCT rep.min_id) AS dependencias_activas
        FROM docentes d
        INNER JOIN asignaciones a ON d.id_docente = a.docente_id
        INNER JOIN periodos p ON a.periodo_id = p.id_periodo
        INNER JOIN (
          SELECT 
            MIN(id_asignacion) AS min_id,
            grupo_id, materia_id, docente_id, periodo_id, aula_id
          FROM asignaciones
          GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
        ) rep ON a.grupo_id <=> rep.grupo_id 
             AND a.materia_id = rep.materia_id 
             AND a.docente_id = rep.docente_id 
             AND a.periodo_id = rep.periodo_id 
             AND a.aula_id = rep.aula_id
        WHERE d.id_docente = ? 
          AND d.estatus = 'ACTIVO'
          AND a.estatus_acta = 'ABIERTA'
          AND a.estatus_confirmacion = 'ACEPTADA'
          AND p.estatus = 'ACTIVO'
      `, [id_docente]);
      
      return rows[0].dependencias_activas > 0;
    } finally {
      if (conn) conn.release();
    }
  },

  createUsuarioYDocente: async (datos) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      const userQuery = `
        INSERT INTO usuarios (
          nombres, apellido_paterno, apellido_materno, 
          personal_email, institutional_email, password_hash, 
          foto_perfil_url, rol_id, creado_por, fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 3, ?, NOW())
      `;
      const userRes = await conn.query(userQuery, [
        datos.nombres, datos.apellido_paterno, datos.apellido_materno,
        datos.personal_email, datos.institutional_email, datos.password_hash,
        datos.foto_perfil_url || null, datos.creado_por
      ]);

      const idUsuario = Number(userRes.insertId || userRes[0]?.insertId);
      if (!idUsuario) throw new Error("Fallo al generar el ID del usuario.");

      const docenteQuery = `
        INSERT INTO docentes (
          usuario_id, matricula_empleado, rfc, curp, clave_ine, 
          domicilio, celular, nivel_academico, antiguedad_fecha, 
          estatus, creado_por, fecha_creacion, academia_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, NOW(), ?)
      `;
      const paramsDocente = [
        idUsuario, datos.matricula, datos.rfc, datos.curp, datos.clave_ine,
        datos.domicilio, datos.celular, datos.nivel_academico,
        datos.antiguedad_fecha || datos.fecha_ingreso,
        datos.creado_por, datos.academia_id
      ];
      const docenteRes = await conn.query(docenteQuery, paramsDocente);
      const idDocente = Number(docenteRes.insertId || docenteRes[0]?.insertId);

      if (datos.documentos && datos.documentos.length > 0) {
        const docQuery = `
          INSERT INTO documentos_docentes (docente_id, tipo_documento, url_archivo, fecha_subida)
          VALUES (?, ?, ?, NOW())
        `;
        for (const doc of datos.documentos) {
          await conn.query(docQuery, [idDocente, doc.tipo, doc.url]);
        }
      }

      await conn.commit();
      return { idUsuario, idDocente };
    } catch (error) {
      if (conn) await conn.rollback();
      console.error("[Transacción unificada fallida]:", error.message);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  },

  getAllDocentes: async () => {
    const query = `
      SELECT 
        d.*, 
        u.nombres, u.apellido_paterno, u.apellido_materno, u.institutional_email, u.foto_perfil_url,
        a.nombre AS nombre_academia
      FROM docentes d
      JOIN usuarios u ON d.usuario_id = u.id_usuario
      LEFT JOIN academias a ON d.academia_id = a.id_academia
    `;
    const docentes = await db.query(query);
    for (let i = 0; i < docentes.length; i++) {
      const docs = await db.query(
        'SELECT tipo_documento, url_archivo FROM documentos_docentes WHERE docente_id = ?',
        [docentes[i].id_docente]
      );
      docentes[i].documentos = docs;
    }
    return docentes;
  },

  updateDocente: async (id, datos) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      // construcción dinámica de la consulta para permitir exclusión de campos sensibles
      let updates = [
        'rfc = ?', 'curp = ?', 'clave_ine = ?', 
        'celular = ?', 'modificado_por = ?', 'fecha_modificacion = NOW()'
      ];
      let queryParams = [
        datos.rfc, datos.curp, datos.clave_ine, 
        datos.celular, datos.modificado_por || null
      ];

      // solo inyectamos nivel_academico y academia_id si el controlador los envía
      if (datos.nivel_academico !== undefined) {
        updates.push('nivel_academico = ?');
        queryParams.push(datos.nivel_academico);
      }
      if (datos.academia_id !== undefined) {
        updates.push('academia_id = ?');
        queryParams.push(datos.academia_id);
      }
      if (datos.domicilio !== undefined) {
        updates.push('domicilio = ?');
        queryParams.push(datos.domicilio);
      }

      let updateQuery = `UPDATE docentes SET ${updates.join(', ')} WHERE id_docente = ?`;
      queryParams.push(id);
      
      await conn.query(updateQuery, queryParams);

      if (datos.documentos && datos.documentos.length > 0) {
        for (const doc of datos.documentos) {
          const existing = await conn.query(
            'SELECT id_documento FROM documentos_docentes WHERE docente_id = ? AND tipo_documento = ? LIMIT 1',
            [id, doc.tipo]
          );
          const hasExisting = Array.isArray(existing) && existing.length > 0 && !Array.isArray(existing[0]);
          if (hasExisting || existing.length > 0) {
            await conn.query(
              'UPDATE documentos_docentes SET url_archivo = ?, fecha_subida = NOW() WHERE docente_id = ? AND tipo_documento = ?',
              [doc.url, id, doc.tipo]
            );
          } else {
            await conn.query(
              'INSERT INTO documentos_docentes (docente_id, tipo_documento, url_archivo, fecha_subida) VALUES (?, ?, ?, NOW())',
              [id, doc.tipo, doc.url]
            );
          }
        }
      }

      await conn.commit();
      return true;
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  },

  deactivateDocente: async (id_docente, eliminado_por, motivo_baja) => {
    const result = await db.query(
      `UPDATE docentes SET estatus = 'BAJA', eliminado_por = ?, fecha_eliminacion = NOW(), motivo_baja = ? WHERE id_docente = ?`,
      [eliminado_por, motivo_baja, id_docente]
    );
    return result.affectedRows;
  },

  reactivateDocente: async (id_docente, modificado_por) => {
    const result = await db.query(
      `UPDATE docentes
       SET estatus = 'ACTIVO', modificado_por = ?, fecha_modificacion = NOW(),
           eliminado_por = NULL, fecha_eliminacion = NULL, motivo_baja = NULL
       WHERE id_docente = ?`,
      [modificado_por, id_docente]
    );
    return result.affectedRows;
  },

  // ─── EP-07 SESA: GET /docentes/catalogo ────────────────────────────────────────────────
  // Devuelve docentes activos con los 4 campos que SESA necesita.
  // No incluye nombre ni correo — esos datos se obtienen via EP-08.
  ObtenerDocentes: async () => {
    const rows = await db.query(`
      SELECT
        d.id_docente,
        d.usuario_id,
        d.matricula_empleado,
        d.nivel_academico
      FROM docentes d
      WHERE d.estatus = 'ACTIVO'
      ORDER BY d.id_docente ASC
    `);
    return rows;
  },
  
  // ─── EP-08 SESA: GET /users/catalogo/{id_usuario} ───────────────────────────────────
  // Devuelve los datos personales de un usuario por su ID.
  // Se llama una vez por cada docente obtenido en EP-07 para enriquecer su perfil.
  ObtenerUsuarioPorId: async (id_usuario) => {
    const rows = await db.query(`
      SELECT
        id_usuario,
        nombres,
        apellido_paterno,
        apellido_materno,
        personal_email,
        institutional_email
      FROM usuarios
      WHERE id_usuario = ?
      LIMIT 1
    `, [id_usuario]);
    return rows[0] ?? null;
  },

  getHistorialCompleto: async (id_docente) => {

    const perfilQuery = `
      SELECT 
        d.id_docente, d.matricula_empleado, d.nivel_academico, d.antiguedad_fecha,
        u.nombres, u.apellido_paterno, u.apellido_materno,
        TIMESTAMPDIFF(YEAR, d.antiguedad_fecha, CURDATE()) AS anos_antiguedad
      FROM docentes d
      JOIN usuarios u ON d.usuario_id = u.id_usuario
      WHERE d.id_docente = ?
    `;
    const perfilRows = await db.query(perfilQuery, [id_docente]);
    
    if (perfilRows.length === 0) return null;

    const perfil = perfilRows[0];
    if (perfil.anos_antiguedad !== undefined) {
      perfil.anos_antiguedad = Number(perfil.anos_antiguedad);
    }

const historialQuery = `
      SELECT 
        p.codigo AS periodo, p.anio,
        m.nombre AS materia,
        m.nivel_academico,
        m.tipo_asignatura,
        COALESCE(g.identificador, 'N/A') AS grupo,
        a.promedio_consolidado, 
        a.estatus_acta,
        a.estatus_confirmacion
      FROM asignaciones a
      INNER JOIN (
        SELECT MAX(id_asignacion) AS max_id
        FROM asignaciones
        GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id, estatus_acta, estatus_confirmacion
      ) rep ON a.id_asignacion = rep.max_id
      JOIN materias m  ON a.materia_id = m.id_materia
      LEFT JOIN grupos g ON a.grupo_id = g.id_grupo
      JOIN periodos p  ON a.periodo_id = p.id_periodo
      WHERE a.docente_id = ?
      ORDER BY p.fecha_inicio DESC, a.id_asignacion DESC
    `;
    
    const historial = await db.query(historialQuery, [id_docente]);

    return { perfil, historial };
  },

};

module.exports = docenteModel;