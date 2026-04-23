const pool = require('../config/database');
const PDFDocument = require('pdfkit');

const obtenerReporteAsignaciones = async (req, res) => {
  const { periodo_id } = req.query;

  try {
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

/* ─────────────────────────────────────────────────── */
/* EXPORTAR REPORTE A PDF (Estilo Audit Log)           */
/* ─────────────────────────────────────────────────── */
const exportarReporteAsignacionesPDF = async (req, res) => {
  try {
    const { periodo_id, texto, agruparPor } = req.query; // docente, aula, o nada

    let query = `
      SELECT 
        a.id_asignacion,
        p.codigo AS periodo,
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
      JOIN Periodos p ON a.periodo_id = p.id_periodo
      JOIN Aulas au ON a.aula_id = au.id_aula
      LEFT JOIN Grupos g ON a.grupo_id = g.id_grupo
      WHERE 1=1
    `;

    const params = [];
    if (periodo_id) {
      query += ` AND a.periodo_id = ? `;
      params.push(periodo_id);
    }

    if (texto) {
      query += ` AND (CONCAT(u.nombres, ' ', u.apellido_paterno, ' ', u.apellido_materno) LIKE ? OR m.nombre LIKE ?) `;
      params.push(`%${texto}%`, `%${texto}%`);
    }

    // Ajustar ordenamiento según agrupación
    if (agruparPor === 'aula') {
      query += ` ORDER BY aula ASC, a.dia_semana ASC, a.hora_inicio ASC`;
    } else if (agruparPor === 'docente') {
      query += ` ORDER BY docente ASC, a.dia_semana ASC, a.hora_inicio ASC`;
    } else {
      query += ` ORDER BY docente ASC, a.dia_semana ASC, a.hora_inicio ASC`;
    }

    const logs = await pool.query(query, params);

    const doc = new PDFDocument({
      margin: 0,
      size: 'A4',
      layout: 'landscape',
      autoFirstPage: false,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte_asignaciones_${new Date().toISOString().split('T')[0]}.pdf"`
    );
    doc.pipe(res);

    /* ── Paleta ── */
    const NAVY  = '#0B1828';
    const NAVY2 = '#1E3A5F';
    const WHITE = '#FFFFFF';
    const GRAY1 = '#F8FAFC';
    const GRAY2 = '#E2E8F0';
    const TEXT  = '#1E293B';
    const MUTED = '#64748B';

    const BADGE = {
      OBLIGATORIA:  { text: '#065F46', bg: '#D1FAE5' },
      OPTATIVA:     { text: '#5B21B6', bg: '#EDE9FE' },
      TRONCO_COMUN: { text: '#334155', bg: '#F1F5F9' },
      MAESTRIA:     { text: '#92400E', bg: '#FEF3C7' },
      LICENCIATURA: { text: '#1E40AF', bg: '#DBEAFE' },
    };

    const PAGE_W      = 841.89; 
    const PAGE_H      = 595.28;
    const MARGIN      = 40;
    const CONTENT_W   = PAGE_W - MARGIN * 2;
    const HEADER_H    = 72;
    const FOOTER_H    = 24;
    const COL_HDR_H   = 22;
    const ROW_H       = 32; 
    const HDR_ROW_H   = 20; // Altura de fila de encabezado de grupo
    const TABLE_TOP   = HEADER_H + 4;
    const SAFE_BOTTOM = PAGE_H - FOOTER_H - 2;

    const COLS = [
      { label: 'Docente',         w: 0.28 },
      { label: 'Materia y Grupo', w: 0.42 },
      { label: 'Horario y Aula',  w: 0.20 },
      { label: 'Estatus',         status: true, w: 0.10 },
    ].map(c => ({ ...c, w: Math.floor(c.w * CONTENT_W) }));

    const DIAS = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo' };
    const fmtH = (h) => h ? h.substring(0, 5) : '--:--';

    let pageNum = 0;

    const drawPageHeader = () => {
      doc.rect(0, 0, PAGE_W, HEADER_H).fill(NAVY);
      doc.fontSize(15).fillColor(WHITE).font('Helvetica-Bold')
         .text('Reporte de Asignaciones Docentes', MARGIN, 16);
      
      let subtitulo = `Generado el ${new Date().toLocaleString('es-MX')}`;
      if (agruparPor === 'aula') subtitulo += ' · Agrupado por Aula';
      else if (agruparPor === 'docente') subtitulo += ' · Agrupado por Docente';

      doc.fontSize(8).fillColor('rgba(255,255,255,0.6)').font('Helvetica')
         .text(subtitulo, MARGIN, 37);
      
      doc.fontSize(20).fillColor(WHITE).font('Helvetica-Bold')
         .text(logs.length.toLocaleString(), PAGE_W - MARGIN - 90, 12, { width: 90, align: 'right' });
      doc.fontSize(7.5).fillColor('rgba(255,255,255,0.55)').font('Helvetica')
         .text('asignaciones', PAGE_W - MARGIN - 90, 38, { width: 90, align: 'right' });
    };

    const drawPageFooter = () => {
      doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H).fill(NAVY);
      doc.fontSize(7).fillColor('rgba(255,255,255,0.45)').font('Helvetica')
         .text(`SIGAD · Sistema de Gestión Académica Digital · Pág. ${pageNum}`, MARGIN, PAGE_H - FOOTER_H + 8, { width: CONTENT_W, align: 'left' });
    };

    const drawTableHeader = (yPos) => {
      doc.rect(MARGIN, yPos, CONTENT_W, COL_HDR_H).fill(NAVY2);
      let x = MARGIN;
      COLS.forEach(col => {
        doc.fontSize(7).fillColor(WHITE).font('Helvetica-Bold')
           .text(col.label.toUpperCase(), x + 6, yPos + 7);
        x += col.w;
      });
      return yPos + COL_HDR_H;
    };

    doc.on('pageAdded', () => {
      pageNum++;
      drawPageHeader();
      drawPageFooter();
      doc.y = TABLE_TOP;
    });

    doc.addPage();
    let y = drawTableHeader(TABLE_TOP);
    let grupoActual = null;

    logs.forEach((log, i) => {
      // Determinar el valor del grupo actual
      const valorGrupo = agruparPor === 'aula' ? log.aula : agruparPor === 'docente' ? log.docente : null;
      const cambioGrupo = agruparPor && valorGrupo !== grupoActual;

      // Verificar espacio para Salto de Grupo o Fila
      const alturaNecesaria = cambioGrupo ? (HDR_ROW_H + ROW_H) : ROW_H;
      
      if (y + alturaNecesaria > SAFE_BOTTOM) {
        doc.addPage();
        y = drawTableHeader(TABLE_TOP);
      }

      // Dibujar Encabezado de Grupo si cambió
      if (cambioGrupo) {
        grupoActual = valorGrupo;
        doc.rect(MARGIN, y, CONTENT_W, HDR_ROW_H).fill('#F1F5F9');
        doc.fontSize(8).fillColor(NAVY).font('Helvetica-Bold')
           .text(valorGrupo.toUpperCase(), MARGIN + 6, y + 6);
        doc.moveTo(MARGIN, y + HDR_ROW_H).lineTo(MARGIN + CONTENT_W, y + HDR_ROW_H).strokeColor(GRAY2).lineWidth(0.5).stroke();
        y += HDR_ROW_H;
      }

      doc.rect(MARGIN, y, CONTENT_W, ROW_H).fill(i % 2 === 0 ? WHITE : GRAY1);
      doc.moveTo(MARGIN, y + ROW_H).lineTo(MARGIN + CONTENT_W, y + ROW_H).strokeColor(GRAY2).lineWidth(0.3).stroke();

      let x = MARGIN;

      /* Col 1: Docente */
      doc.fontSize(8.5).fillColor(TEXT).font('Helvetica-Bold')
         .text(log.docente || '—', x + 6, y + 8, { width: COLS[0].w - 12, ellipsis: true });
      doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
         .text(`Matrícula: ${log.matricula_empleado || '—'}`, x + 6, y + 20);
      x += COLS[0].w;

      /* Col 2: Materia y Grupo */
      doc.fontSize(8.5).fillColor(TEXT).font('Helvetica-Bold')
         .text(log.materia || '—', x + 6, y + 8, { width: COLS[1].w - 12, ellipsis: true });
      
      const grupoText = log.grupo === 'N/A' ? log.periodo : `Grupo: ${log.grupo} · ${log.periodo}`;
      doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
         .text(grupoText, x + 6, y + 20);

      // Badges
      const levelBadge = BADGE[log.nivel_academico] || BADGE.LICENCIATURA;
      const typeBadge  = BADGE[log.tipo_materia] || BADGE.TRONCO_COMUN;

      // Nivel Badge
      doc.rect(x + 200, y + 18, 55, 10).fill(levelBadge.bg);
      doc.fontSize(6).fillColor(levelBadge.text).font('Helvetica-Bold')
         .text(log.nivel_academico || 'LIC', x + 200, y + 20, { width: 55, align: 'center' });
      
      // Tipo Badge
      const typeLabel = (log.tipo_materia || 'TRONCO').replace(/_/g, ' ');
      doc.rect(x + 260, y + 18, 65, 10).fill(typeBadge.bg);
      doc.fontSize(6).fillColor(typeBadge.text).font('Helvetica-Bold')
         .text(typeLabel, x + 260, y + 20, { width: 65, align: 'center' });

      x += COLS[1].w;

      /* Col 3: Horario */
      const horario = `${DIAS[log.dia_semana] || '—'}: ${fmtH(log.hora_inicio)} - ${fmtH(log.hora_fin)}`;
      doc.fontSize(7.5).fillColor(TEXT).font('Helvetica-Bold')
         .text(horario, x + 6, y + 8);
      doc.fontSize(7.5).fillColor(MUTED).font('Helvetica')
         .text(`Aula: ${log.aula || '—'}`, x + 6, y + 20);
      x += COLS[2].w;

      /* Col 4: Estatus */
      const estatus = log.estatus_confirmacion || '—';
      const estatusColor = estatus === 'ACEPTADA' ? '#059669' : estatus === 'RECHAZADA' ? '#DC2626' : '#2563EB';
      doc.fontSize(7).fillColor(estatusColor).font('Helvetica-Bold')
         .text(estatus, x + 6, y + 12, { width: COLS[3].w - 8, align: 'center' });

      y += ROW_H;
    });

    doc.end();
  } catch (error) {
    console.error('[Error en reporteController - exportarReporteAsignacionesPDF]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el PDF del reporte.' });
    }
  }
};

module.exports = { obtenerReporteAsignaciones, exportarReporteAsignacionesPDF };