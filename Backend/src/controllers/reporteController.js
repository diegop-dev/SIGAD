const pool = require('../config/database');

const obtenerReporteAsignaciones = async (req, res) => {
  // Opcional: Recibir el ID del periodo por query (ej. ?periodo_id=1)
  const { periodo_id } = req.query;

  try {
    let query = `
      SELECT 
        a.id_asignacion,
        p.codigo AS periodo,
        c.nombre_carrera AS carrera,
        CONCAT(u.nombres, ' ', u.apellido_paterno, ' ', u.apellido_materno) AS docente,
        d.matricula_empleado,
        m.nombre AS materia,
        g.identificador AS grupo,
        au.nombre_codigo AS aula,
        a.dia_semana,
        a.hora_inicio,
        a.hora_fin,
        a.estatus_confirmacion
      FROM Asignaciones a
      JOIN Docentes d ON a.docente_id = d.id_docente
      JOIN Usuarios u ON d.usuario_id = u.id_usuario
      JOIN Materias m ON a.materia_id = m.id_materia
      JOIN Carreras c ON m.carrera_id = c.id_carrera
      JOIN Grupos g ON a.grupo_id = g.id_grupo
      JOIN Periodos p ON a.periodo_id = p.id_periodo
      JOIN Aulas au ON a.aula_id = au.id_aula
    `;

    const params = [];

    // Si nos mandan un periodo específico, filtramos; si no, traemos todo
    if (periodo_id) {
      query += ` WHERE a.periodo_id = ? `;
      params.push(periodo_id);
    }

    // Ordenamos por Docente y luego por Día de la semana para que el reporte tenga sentido
    query += ` ORDER BY docente ASC, a.dia_semana ASC, a.hora_inicio ASC`;

    const reporte = await pool.query(query, params);
    
    res.status(200).json(reporte);
  } catch (error) {
    console.error("Error al generar reporte de asignaciones:", error);
    res.status(500).json({ message: "Error interno al generar el informe." });
  }
};

module.exports = { obtenerReporteAsignaciones };