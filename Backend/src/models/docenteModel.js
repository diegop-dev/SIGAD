const db = require('../config/database');
const getInsertId = (res) => Number(res.insertId || (Array.isArray(res) && res[0]?.insertId));

const docenteModel = {
  getDocenteParaSincronizacion: async (id_docente) => {
    if (!id_docente) return [];

    try {
      const query = `
        SELECT matricula_empleado 
        FROM docentes 
        WHERE id_docente = ? AND estatus = 'ACTIVO'
      `;
      return await db.query(query, [id_docente]);
    } catch (error) {
      console.error("[Error getDocenteParaSincronizacion]:", error.message);
      throw error;
    }
  },

  // --- CONSULTAS DE LECTURA ---
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
      console.error("[Error getUsuariosDisponibles]:", error.message);
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

  getAllDocentes: async () => {
    // 1. Traemos a todos los docentes con un solo JOIN
    const queryDocentes = `
      SELECT d.*, u.nombres, u.apellido_paterno, u.apellido_materno, 
             u.institutional_email, u.foto_perfil_url, a.nombre as nombre_academia
      FROM docentes d
      JOIN usuarios u ON d.usuario_id = u.id_usuario
      LEFT JOIN academias a ON d.academia_id = a.id_academia
    `;
    const docentes = await db.query(queryDocentes);
    if (docentes.length === 0) return [];

    // 2. Traemos TODOS los documentos de una sola vez para optimizar rendimiento
    const queryDocs = 'SELECT docente_id, tipo_documento, url_archivo FROM documentos_docentes';
    const todosLosDocs = await db.query(queryDocs);

    // 3. Mapeamos los documentos a su respectivo docente en memoria
    return docentes.map(docente => ({
      ...docente,
      documentos: todosLosDocs.filter(d => d.docente_id === docente.id_docente)
    }));
  },

  // --- OPERACIONES DE ESCRITURA (CON TRANSACCIONES) ---
  createUsuarioYDocente: async (datos) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      // 1. Insertar Usuario
      const userRes = await conn.query(`
        INSERT INTO usuarios (
          nombres, apellido_paterno, apellido_materno, personal_email, 
          institutional_email, password_hash, foto_perfil_url, rol_id, 
          creado_por, fecha_creacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 3, ?, NOW())
      `, [
        datos.nombres, datos.apellido_paterno, datos.apellido_materno,
        datos.personal_email, datos.institutional_email, datos.password_hash,
        datos.foto_perfil_url || null, datos.creado_por
      ]);

      const idUsuario = getInsertId(userRes);
      if (!idUsuario) throw new Error("Fallo al generar el ID del usuario.");

      // 2. Insertar Docente
      const docenteRes = await conn.query(`
        INSERT INTO docentes (
          usuario_id, matricula_empleado, rfc, curp, clave_ine, domicilio, 
          celular, nivel_academico, antiguedad_fecha, estatus, 
          creado_por, fecha_creacion, academia_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, NOW(), ?)
      `, [
        idUsuario, datos.matricula, datos.rfc, datos.curp, datos.clave_ine,
        datos.domicilio, datos.celular, datos.nivel_academico,
        datos.antiguedad_fecha || datos.fecha_ingreso,
        datos.creado_por, datos.academia_id
      ]);

      const idDocente = getInsertId(docenteRes);

      // 3. Insertar Documentos (si existen)
      if (datos.documentos?.length > 0) {
        const docQuery = `INSERT INTO documentos_docentes (docente_id, tipo_documento, url_archivo, fecha_subida) VALUES (?, ?, ?, NOW())`;
        for (const doc of datos.documentos) {
          await conn.query(docQuery, [idDocente, doc.tipo, doc.url]);
        }
      }

      await conn.commit();
      return { idUsuario, idDocente };
    } catch (error) {
      if (conn) await conn.rollback();
      console.error("[Error createUsuarioYDocente]:", error.message);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  },

  updateDocente: async (id, datos) => {
    let conn;
    try {
      conn = await db.getConnection();
      await conn.beginTransaction();

      // 1. Actualización de datos básicos
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

      // 2. Gestión de documentos (Upsert lógico)
      if (datos.documentos?.length > 0) {
        for (const doc of datos.documentos) {
          const [existing] = await conn.query(
            'SELECT id_documento FROM documentos_docentes WHERE docente_id = ? AND tipo_documento = ? LIMIT 1',
            [id, doc.tipo]
          );

          if (existing) {
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
      console.error("[Error updateDocente]:", error.message);
      throw error;
    } finally {
      if (conn) conn.release();
    }
  },

  // --- ESTADOS (SOFT DELETE) ---
  deactivateDocente: async (id_docente, eliminado_por, motivo_baja) => {
    const query = `
      UPDATE docentes
      SET estatus = 'BAJA', eliminado_por = ?, fecha_eliminacion = NOW(), motivo_baja = ?
      WHERE id_docente = ?
    `;
    const result = await db.query(query, [eliminado_por, motivo_baja, id_docente]);
    return result.affectedRows;
  },

  reactivateDocente: async (id_docente, modificado_por) => {
    const query = `
      UPDATE docentes
      SET estatus = 'ACTIVO', modificado_por = ?, fecha_modificacion = NOW(), 
          eliminado_por = NULL, fecha_eliminacion = NULL, motivo_baja = NULL
      WHERE id_docente = ?
    `;
    const result = await db.query(query, [modificado_por, id_docente]);
    return result.affectedRows;
  }
};

module.exports = docenteModel;