const pool = require('../config/database');

const obtenerReporteAsignaciones = async (req, res) => {
  const { periodo_id } = req.query;

  try {
    // Se cambian los INNER JOIN por LEFT JOIN en Carreras y Grupos
    // para incluir las materias de tronco común.
    // NUEVO: Extraemos m.tipo_asignatura y m.nivel_academico para los badges del PDF.
    let query = `
      SELECT 
        a.id_asignacion,
        p.codigo AS periodo,
        COALESCE(c.nombre_carrera) AS carrera,
        CONCAT(u.nombres, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS docente,
        d.matricula_empleado,
        m.nombre AS materia,
        m.tipo_asignatura AS tipo_materia,
        m.nivel_academico,
        COALESCE(g.identificador, 'N/A') AS grupo,
        au.nombre_codigo AS aula,
        a.dia_semana,
        a.hora_inicio,
        a.hora_fin,
        a.estatus_confirmacion
      FROM Asignaciones a
      INNER JOIN (
        SELECT MIN(id_asignacion) AS min_id
        FROM Asignaciones
        GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
      ) rep ON a.id_asignacion = rep.min_id
      JOIN Docentes d ON a.docente_id = d.id_docente
      JOIN Usuarios u ON d.usuario_id = u.id_usuario
      JOIN Materias m ON a.materia_id = m.id_materia
      LEFT JOIN Carreras c ON m.carrera_id = c.id_carrera
      LEFT JOIN Grupos g ON a.grupo_id = g.id_grupo
      JOIN Periodos p ON a.periodo_id = p.id_periodo
      JOIN Aulas au ON a.aula_id = au.id_aula
      WHERE 1=1
    `;

    const params = [];

    if (periodo_id) {
      query += ` AND a.periodo_id = ? `;
      params.push(periodo_id);
    }

    query += ` ORDER BY docente ASC, a.hora_inicio ASC`;

    const reporte = await pool.query(query, params);
    
    res.status(200).json(reporte);
  } catch (error) {
    console.error("Error al generar reporte de asignaciones:", error);
    res.status(500).json({ message: "Error interno al generar el informe." });
  }
};

module.exports = { obtenerReporteAsignaciones };