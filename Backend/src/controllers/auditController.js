const auditModel = require('../models/auditModel');
const PDFDocument = require('pdfkit');

const getLogs = async (req, res) => {
  try {
    const { desde, hasta, modulo, texto, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      auditModel.getAuditLogs({ desde, hasta, modulo, texto, limit, offset }),
      auditModel.countAuditLogs({ desde, hasta, modulo, texto }),
    ]);
    res.status(200).json({
      data: logs, total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    console.error('[Error en auditController - getLogs]:', error);
    res.status(500).json({ error: 'Error al obtener el registro de auditoría.' });
  }
};

/* ─────────────────────────────────────────────────── */

const exportAuditPDF = async (req, res) => {
  try {
    const { desde, hasta, modulo, texto } = req.query;

    const [logs, total] = await Promise.all([
      auditModel.getAuditLogs({ desde, hasta, modulo, texto, limit: 10000, offset: 0 }),
      auditModel.countAuditLogs({ desde, hasta, modulo, texto }),
    ]);

    // ← autoFirstPage: false — registramos el listener primero,
    //   luego creamos la primera página manualmente con doc.addPage()
    //   para que el evento pageAdded dispare correctamente en TODAS las páginas
    const doc = new PDFDocument({
      margin: 0,
      size: 'A4',
      layout: 'landscape',
      autoFirstPage: false,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="auditoria_${new Date().toISOString().split('T')[0]}.pdf"`
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
      CREACION:          { text: '#065F46', bg: '#D1FAE5' },
      MODIFICACION:      { text: '#92400E', bg: '#FEF3C7' },
      BAJA:              { text: '#991B1B', bg: '#FEE2E2' },
      LOGIN:             { text: '#1E40AF', bg: '#DBEAFE' },
      CAMBIO_CONTRASENA: { text: '#5B21B6', bg: '#EDE9FE' },
      CUENTA_BLOQUEADA:  { text: '#9A3412', bg: '#FFEDD5' },
    };

    const PAGE_W      = 841.89; // A4 landscape points
    const PAGE_H      = 595.28;
    const MARGIN      = 40;
    const CONTENT_W   = PAGE_W - MARGIN * 2;
    const HEADER_H    = 72;
    const FOOTER_H    = 24;
    const COL_HDR_H   = 22;
    const ROW_H       = 20;
    const TABLE_TOP   = HEADER_H + 4;
    const SAFE_BOTTOM = PAGE_H - FOOTER_H - 2;

    /* ── Columnas ── */
    const COLS = [
      { label: 'Módulo',            w: 0.09 },
      { label: 'Acción',            w: 0.14 },
      { label: 'Registro afectado', w: 0.27 },
      { label: 'ID',                w: 0.04 },
      { label: 'Usuario',           w: 0.18 },
      { label: 'Rol',               w: 0.11 },
      { label: 'IP',                w: 0.09 },
      { label: 'Fecha',             w: 0.08 },
    ].map(c => ({ ...c, w: Math.floor(c.w * CONTENT_W) }));

    const fmtDate = (iso) => {
      if (!iso) return '—';
      return new Date(iso).toLocaleString('es-MX', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    };

    let pageNum = 0;

    /* ── Header ── */
    const drawPageHeader = () => {
      doc.rect(0, 0, PAGE_W, HEADER_H).fill(NAVY);

      doc.fontSize(15).fillColor(WHITE).font('Helvetica-Bold')
         .text('Registro de Auditoría — SIGAD', MARGIN, 16,
               { width: CONTENT_W * 0.65, lineBreak: false });

      doc.fontSize(8).fillColor('rgba(255,255,255,0.6)').font('Helvetica')
         .text('Generado el ' + new Date().toLocaleString('es-MX'), MARGIN, 37,
               { lineBreak: false });

      const filtros = [
        desde  && `Desde: ${desde}`,
        hasta  && `Hasta: ${hasta}`,
        modulo && `Módulo: ${modulo}`,
        texto  && `Búsqueda: "${texto}"`,
      ].filter(Boolean).join('   ·   ');

      if (filtros) {
        doc.fontSize(7).fillColor('rgba(255,255,255,0.45)').font('Helvetica')
           .text(filtros, MARGIN, 52, { width: CONTENT_W * 0.7, lineBreak: false });
      }

      doc.fontSize(20).fillColor(WHITE).font('Helvetica-Bold')
         .text(total.toLocaleString(), PAGE_W - MARGIN - 90, 12,
               { width: 90, align: 'right', lineBreak: false });
      doc.fontSize(7.5).fillColor('rgba(255,255,255,0.55)').font('Helvetica')
         .text('registros totales', PAGE_W - MARGIN - 90, 38,
               { width: 90, align: 'right', lineBreak: false });
    };

    /* ── Footer ── */
    const drawPageFooter = () => {
      doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H).fill(NAVY);
      doc.fontSize(7).fillColor('rgba(255,255,255,0.45)').font('Helvetica')
         .text(
           `Documento generado automáticamente por SIGAD · Confidencial · Pág. ${pageNum}`,
           MARGIN, PAGE_H - FOOTER_H + 8,
           { width: CONTENT_W, align: 'left', lineBreak: false }
         );
    };

    /* ── Cabecera de tabla ── */
    const drawTableHeader = (yPos) => {
      doc.rect(MARGIN, yPos, CONTENT_W, COL_HDR_H).fill(NAVY2);
      let x = MARGIN;
      COLS.forEach(col => {
        doc.fontSize(6.5).fillColor(WHITE).font('Helvetica-Bold')
           .text(col.label.toUpperCase(), x + 4, yPos + 7,
                 { width: col.w - 8, lineBreak: false });
        x += col.w;
      });
      return yPos + COL_HDR_H;
    };

    /* ── Listener — se registra ANTES de crear cualquier página ── */
    doc.on('pageAdded', () => {
      pageNum++;
      drawPageHeader();
      drawPageFooter();
      doc.y = TABLE_TOP;
    });

    // Primera página: ahora sí dispara pageAdded → header + footer dibujados
    doc.addPage();
    let y = drawTableHeader(TABLE_TOP);

    /* ── Filas ── */
    logs.forEach((log, i) => {
      if (y + ROW_H > SAFE_BOTTOM) {
        doc.addPage(); // dispara pageAdded → header + footer + doc.y = TABLE_TOP
        y = drawTableHeader(TABLE_TOP);
      }

      /* Fondo alterno */
      doc.rect(MARGIN, y, CONTENT_W, ROW_H).fill(i % 2 === 0 ? WHITE : GRAY1);

      /* Divisor */
      doc.moveTo(MARGIN, y + ROW_H)
         .lineTo(MARGIN + CONTENT_W, y + ROW_H)
         .strokeColor(GRAY2).lineWidth(0.3).stroke();

      const cellY = y + 6;
      let x = MARGIN;

      /* Módulo */
      doc.fontSize(7).fillColor(TEXT).font('Helvetica-Bold')
         .text(log.modulo ?? '—', x + 4, cellY,
               { width: COLS[0].w - 8, lineBreak: false });
      x += COLS[0].w;

      /* Acción con badge centrado */
      const badge      = BADGE[log.accion] ?? { text: MUTED, bg: '#F1F5F9' };
      const badgeLabel = log.accion ?? '—';
      const badgeW     = COLS[1].w - 12;
      const badgeX     = x + 6;
      const badgeY     = y + 4;
      const badgeH     = 13;

      doc.rect(badgeX, badgeY, badgeW, badgeH).fill(badge.bg);

      doc.fontSize(6).font('Helvetica-Bold');
      const textW = doc.widthOfString(badgeLabel);
      const textX = badgeX + (badgeW - textW) / 2;
      const textY = badgeY + (badgeH - 6) / 2;

      doc.fillColor(badge.text).text(badgeLabel, textX, textY, { lineBreak: false });
      x += COLS[1].w;

      /* Registro afectado */
      doc.fontSize(6.5).fillColor(TEXT).font('Helvetica')
         .text(log.registro_afectado ?? '—', x + 4, cellY,
               { width: COLS[2].w - 8, lineBreak: false, ellipsis: true });
      x += COLS[2].w;

      /* ID */
      doc.fontSize(7).fillColor(MUTED).font('Helvetica')
         .text(String(log.usuario_id ?? '—'), x + 2, cellY,
               { width: COLS[3].w - 4, align: 'center', lineBreak: false });
      x += COLS[3].w;

      /* Usuario */
      doc.fontSize(6.5).fillColor(TEXT).font('Helvetica')
         .text(log.nombre_usuario ?? '—', x + 4, cellY,
               { width: COLS[4].w - 8, lineBreak: false, ellipsis: true });
      x += COLS[4].w;

      /* Rol */
      doc.fontSize(6.5).fillColor(MUTED).font('Helvetica')
         .text(log.nombre_rol ?? '—', x + 4, cellY,
               { width: COLS[5].w - 8, lineBreak: false, ellipsis: true });
      x += COLS[5].w;

      /* IP */
      doc.fontSize(6.5).fillColor(MUTED).font('Helvetica')
         .text(log.ip_address ?? '—', x + 4, cellY,
               { width: COLS[6].w - 8, lineBreak: false });
      x += COLS[6].w;

      /* Fecha */
      doc.fontSize(6.5).fillColor(MUTED).font('Helvetica')
         .text(fmtDate(log.fecha), x + 4, cellY,
               { width: COLS[7].w - 8, lineBreak: false });

      y += ROW_H;
    });

    doc.end();
  } catch (error) {
    console.error('[Error en auditController - exportAuditPDF]:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el PDF de auditoría.' });
    }
  }
};

module.exports = { getLogs, exportAuditPDF };