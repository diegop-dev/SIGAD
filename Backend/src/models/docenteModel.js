const db = require('../config/database');

const docenteModel = {
  getUsuariosDisponibles: async () => {
    try {
      const query = `
        SELECT 
          id_usuario, 
          nombres, 
          apellido_paterno, 
          apellido_materno, 
          personal_email 
        FROM usuarios 
        WHERE id_usuario NOT IN (SELECT usuario_id FROM docentes)
        AND rol_id = 3
      `;
      const rows = await db.query(query);
      return rows;
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

  createDocente: async (datos) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      const docenteQuery = `
        INSERT INTO docentes (
          usuario_id, matricula_empleado, rfc, curp, clave_ine, 
          domicilio, celular, nivel_academico, antiguedad_fecha, 
          estatus, creado_por, fecha_creacion, academia_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, NOW(), ?)
      `;

      const docenteRes = await conn.query(docenteQuery, [
        datos.usuario_id, datos.matricula, datos.rfc, datos.curp, datos.clave_ine,
        datos.domicilio, datos.celular, datos.nivel_academico, datos.antiguedad_fecha,
        datos.creado_por, datos.academia_id
      ]);

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
      return idDocente;
    } catch (error) {
      if (conn) await conn.rollback();
      throw error;
    } finally {
      if (conn) conn.release();
    }
  },

  getAllDocentes: async () => {
    // 🎁 EXTRA: Agregamos el correo y el nombre de la academia con un JOIN
    const query = `
      SELECT 
        d.*, 
        u.nombres, u.apellido_paterno, u.apellido_materno, u.institutional_email,
        a.nombre as nombre_academia
      FROM docentes d
      JOIN usuarios u ON d.usuario_id = u.id_usuario
      LEFT JOIN academias a ON d.academia_id = a.id_academia
    `;
    return await db.query(query);
  },

  // ✨ NUEVA FUNCIÓN PARA ACTUALIZAR ✨
  updateDocente: async (id, datos) => {
    let conn;
    try {
      // Usamos una transacción igual que en crear, por seguridad
      conn = await db.getConnection();
      await conn.beginTransaction();

      let updateQuery = `
        UPDATE docentes 
        SET rfc = ?, curp = ?, clave_ine = ?, celular = ?, 
            nivel_academico = ?, academia_id = ?, modificado_por = ?, 
            fecha_modificacion = NOW()
      `;
      
      let queryParams = [
        datos.rfc, datos.curp, datos.clave_ine, datos.celular,
        datos.nivel_academico, datos.academia_id, datos.modificado_por || null
      ];

      if (datos.domicilio) {
        updateQuery += `, domicilio = ?`;
        queryParams.push(datos.domicilio);
      }

      updateQuery += ` WHERE id_docente = ?`;
      queryParams.push(id);

      await conn.query(updateQuery, queryParams);

      // Actualizar documentos si enviaron nuevos
      if (datos.documentos && datos.documentos.length > 0) {
        for (const doc of datos.documentos) {
          const existingQuery = 'SELECT id_documento FROM documentos_docentes WHERE docente_id = ? AND tipo_documento = ? LIMIT 1';
          const existing = await conn.query(existingQuery, [id, doc.tipo]);

          // Comprobación segura según cómo devuelva los datos tu db.query
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
  }
};

module.exports = docenteModel;