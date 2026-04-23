const pool = require('../config/database');

const parseTime = (val) => {
  if (!val) return '00:00:00';
  if (typeof val === 'string') return val.substring(0, 8);
  if (typeof val === 'object' && 'hours' in val) {
    const h = String(val.hours   ?? 0).padStart(2, '0');
    const m = String(val.minutes ?? 0).padStart(2, '0');
    const s = String(val.seconds ?? 0).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
  return String(val);
};

const horarioModel = {

  getDocenteByUsuario: async (id_usuario) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT d.id_docente, d.usuario_id,
                u.nombres, u.apellido_paterno, u.apellido_materno
         FROM docentes d
         INNER JOIN Usuarios u ON u.id_usuario = d.usuario_id
         WHERE d.usuario_id = ? AND d.estatus = 'ACTIVO'
         LIMIT 1`,
        [id_usuario]
      );
      if (!rows[0]) return null;
      return {
        id_docente:       Number(rows[0].id_docente),
        usuario_id:       Number(rows[0].usuario_id),
        nombres:          rows[0].nombres,
        apellido_paterno: rows[0].apellido_paterno,
        apellido_materno: rows[0].apellido_materno,
      };
    } finally {
      if (conn) conn.release();
    }
  },

  getPeriodosConHorario: async (id_docente) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT DISTINCT
           p.id_periodo, p.codigo, p.anio, p.estatus,
           p.fecha_inicio, p.fecha_fin
         FROM asignaciones a
         INNER JOIN periodos p ON p.id_periodo = a.periodo_id
         WHERE a.docente_id           = ?
           AND a.estatus_acta         = 'ABIERTA'
           AND a.estatus_confirmacion = 'ACEPTADA'
         ORDER BY p.anio DESC, p.fecha_inicio DESC`,
        [id_docente]
      );
      return rows.map(r => ({
        id_periodo:   Number(r.id_periodo),
        codigo:       r.codigo,
        anio:         r.anio,
        estatus:      r.estatus,
        fecha_inicio: r.fecha_inicio,
        fecha_fin:    r.fecha_fin,
      }));
    } finally {
      if (conn) conn.release();
    }
  },

  getHorarioDocente: async (id_docente, id_periodo) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT
           a.id_asignacion,
           a.dia_semana,
           a.hora_inicio,
           a.hora_fin,
           m.nombre          AS nombre_materia,
           m.codigo_unico,
           m.nivel_academico,
           m.tipo_asignatura,
           COALESCE(g.identificador, 'TRONCO COMÚN') AS nombre_grupo,
           au.nombre_codigo  AS nombre_aula,
           p.codigo          AS codigo_periodo,
           p.anio            AS anio_periodo
         FROM asignaciones a
         INNER JOIN materias m  ON m.id_materia  = a.materia_id
         LEFT  JOIN grupos   g  ON g.id_grupo    = a.grupo_id
         INNER JOIN aulas    au ON au.id_aula     = a.aula_id
         INNER JOIN periodos p  ON p.id_periodo   = a.periodo_id
         WHERE a.docente_id           = ?
           AND a.periodo_id           = ?
           AND a.estatus_acta         = 'ABIERTA'
           AND a.estatus_confirmacion = 'ACEPTADA'
         ORDER BY a.dia_semana ASC, a.hora_inicio ASC`,
        [id_docente, id_periodo]
      );
      return rows.map(row => ({
        id_asignacion:   Number(row.id_asignacion),
        dia_semana:      Number(row.dia_semana),
        hora_inicio:     parseTime(row.hora_inicio),
        hora_fin:        parseTime(row.hora_fin),
        nombre_materia:  String(row.nombre_materia),
        // ── Campos nuevos ──────────────────────────────────────────────
        codigo_unico:    row.codigo_unico    ? String(row.codigo_unico)    : null,
        nivel_academico: row.nivel_academico ? String(row.nivel_academico) : null,
        tipo_asignatura: row.tipo_asignatura ? String(row.tipo_asignatura) : null,
        // ──────────────────────────────────────────────────────────────
        nombre_grupo:    String(row.nombre_grupo),
        nombre_aula:     String(row.nombre_aula),
        codigo_periodo:  String(row.codigo_periodo),
        anio_periodo:    row.anio_periodo !== undefined ? Number(row.anio_periodo) : null,
      }));
    } finally {
      if (conn) conn.release();
    }
  },
};

module.exports = horarioModel;