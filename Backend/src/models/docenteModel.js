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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVO', ?, NOW(), NULL)
      `;

      const docenteRes = await conn.query(docenteQuery, [
        datos.usuario_id, datos.matricula, datos.rfc, datos.curp, datos.clave_ine,
        datos.domicilio, datos.celular, datos.nivel_academico, datos.antiguedad_fecha,
        datos.creado_por
      ]);

      const idDocente = Number(docenteRes.insertId);

      if (datos.documentos && datos.documentos.length > 0) {
        const docQuery = `
          INSERT INTO documentos_docente (id_docente, tipo_documento, url_archivo, fecha_subida)
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
    const query = `
      SELECT d.*, u.nombres, u.apellido_paterno, u.apellido_materno 
      FROM docentes d
      JOIN usuarios u ON d.usuario_id = u.id_usuario
    `;
    return await db.query(query);
  }
};

module.exports = docenteModel;
