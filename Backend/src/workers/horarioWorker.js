/**
 * horarioWorker.js
 * Worker thread dedicado a la generación asíncrona del PDF de horario oficial.
 * Corre en un hilo separado para no bloquear el event loop principal.
 *
 * Recibe vía workerData : { horarios, periodo, docente }
 * Emite de vuelta       : Buffer con el PDF completo.
 *
 * Diseño alineado con:
 *   · HorariosManagement.jsx  — paleta de bloques, rango horario (07–22h), badges de nivel/tipo
 *   · auditController.js      — tokens de color (NAVY/GRAY/TEXT/MUTED/SLATE), arquitectura PDF
 */
'use strict';

const { workerData, parentPort } = require('worker_threads');
const PDFDocument = require('pdfkit');

// ════════════════════════════════════════════════════════════════════════════
// TOKENS DE DISEÑO  (espejo de HorariosManagement + auditController)
// ════════════════════════════════════════════════════════════════════════════

// — Colores base  (espejo exacto de auditController) —
const NAVY    = '#0B1828';   // fondo primario — header y footer
const NAVY2   = '#1E3A5F';   // encabezado de días / sub-secciones
const WHITE   = '#FFFFFF';
const GRAY1   = '#F8FAFC';   // fila par / celda hora clara
const GRAY2   = '#E2E8F0';   // divisores y celdas media-hora
const GRAY3   = '#F1F5F9';   // alternado intermedio (columna horas impar / Sábado par)
const TEXT    = '#1E293B';   // texto principal en celdas
const MUTED   = '#64748B';   // texto secundario / horas
const SLATE   = '#94A3B8';   // bordes internos / separador de horas

// — Badge "Horario Oficial"  (= BADGE.CREACION de auditController: tono suave) —
const BADGE_OFICIAL = { bg: '#0B1828', text: '#FFFFFF' };

// — Badges de nivel académico (= getNivelStyles en React) —
const NIVEL_BADGE = {
  LICENCIATURA: { bg: '#DBEAFE', text: '#1E40AF', label: 'LIC'  },
  MAESTRIA:     { bg: '#FEF3C7', text: '#92400E', label: 'MAE'  },
  DOCTORADO:    { bg: '#EDE9FE', text: '#5B21B6', label: 'DOC'  },
};

// — Badges de tipo de asignatura (= getTipoStyles en React) —
const TIPO_BADGE = {
  TRONCO_COMUN: { bg: '#F1F5F9', text: '#475569', label: 'T.COM' },
  OBLIGATORIA:  { bg: '#D1FAE5', text: '#065F46', label: 'OBL'   },
  OPTATIVA:     { bg: '#EDE9FE', text: '#5B21B6', label: 'OPT'   },
};

// — Paleta de bloques (= PALETTE en HorariosManagement + getColor) —
const BLOCK_PALETTE = [
  { bg: '#DBEAFE', border: '#60A5FA', accent: '#3B82F6', text: '#1E40AF' }, // blue
  { bg: '#EDE9FE', border: '#A78BFA', accent: '#7C3AED', text: '#5B21B6' }, // violet
  { bg: '#D1FAE5', border: '#34D399', accent: '#059669', text: '#065F46' }, // emerald
  { bg: '#FEF3C7', border: '#FCD34D', accent: '#D97706', text: '#92400E' }, // amber
  { bg: '#FEE2E2', border: '#FCA5A5', accent: '#DC2626', text: '#991B1B' }, // red
  { bg: '#CFFAFE', border: '#67E8F9', accent: '#0891B2', text: '#164E63' }, // cyan
  { bg: '#DCFCE7', border: '#86EFAC', accent: '#16A34A', text: '#14532D' }, // green
  { bg: '#FFEDD5', border: '#FDBA74', accent: '#EA580C', text: '#7C2D12' }, // orange
  { bg: '#FCE7F3', border: '#F9A8D4', accent: '#DB2777', text: '#831843' }, // pink
  { bg: '#E0E7FF', border: '#A5B4FC', accent: '#4F46E5', text: '#312E81' }, // indigo
];

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTES DE LAYOUT  (A3 Landscape)
// ════════════════════════════════════════════════════════════════════════════
const PAGE_W = 1190.55;   // puntos (420 mm)
const PAGE_H  =  841.89;  // puntos (297 mm)

const MARGIN      = 28;   // margen lateral uniforme
const TIME_COL_W  = 54;   // columna de horas
const HEADER_H    = 80;   // bloque de título navy
const DAY_HDR_H   = 24;   // fila de nombres de días
const FOOTER_H    = 22;   // pie de página navy

// Cuadrícula 07:00–22:00 (= START_MIN / END_MIN en HorariosManagement)
const GRID_START_MIN  = 7  * 60;         // 420 min
const GRID_END_MIN    = 22 * 60;         // 1 320 min
const SLOT_DURATION   = 30;              // minutos por slot
const SLOT_COUNT      = (GRID_END_MIN - GRID_START_MIN) / SLOT_DURATION; // 30 slots

// Días Lun–Sáb (= DAYS en HorariosManagement, sin Domingo)
const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const GRID_X    = MARGIN + TIME_COL_W;
const GRID_Y    = HEADER_H + DAY_HDR_H;
const GRID_W    = PAGE_W - MARGIN * 2 - TIME_COL_W;
const GRID_H    = PAGE_H - GRID_Y - FOOTER_H - 4;
const DAY_COL_W = GRID_W / DAYS.length;
const SLOT_H    = GRID_H / SLOT_COUNT;

// ════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ════════════════════════════════════════════════════════════════════════════

/** "08:30:00" → 510 */
const timeToMinutes = (t) => {
  const [h, m] = String(t).split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

/** 480 → "08:00" */
const formatHour = (min) => {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

/** "08:30:00" → "08:30 AM"  (= formatAMPM en HorariosManagement) */
const formatAMPM = (timeStr) => {
  const [h, m] = String(timeStr).split(':');
  let hour     = parseInt(h, 10);
  const ampm   = hour >= 12 ? 'PM' : 'AM';
  hour         = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
};

/** Índice de slot → coordenada Y en el grid */
const slotToY = (slot) => GRID_Y + slot * SLOT_H;

/** Índice de día (0-based) → coordenada X en el grid */
const dayToX  = (i)    => GRID_X + i * DAY_COL_W;

/** Hash estable de string → color de la paleta (= getColor en HorariosManagement) */
const getColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return BLOCK_PALETTE[Math.abs(hash) % BLOCK_PALETTE.length];
};

/** Mini-pill de badge rectangular (nivel / tipo) dentro de un bloque */
const drawPill = (doc, label, bg, textColor, x, y, w = 28, h = 7) => {
  doc.rect(x, y, w, h).fill(bg);
  doc.font('Helvetica-Bold').fontSize(5).fillColor(textColor)
     .text(label, x, y + 1.5, { width: w, align: 'center', lineBreak: false });
};

// ════════════════════════════════════════════════════════════════════════════
// DATOS  (inyectados por el hilo principal)
// ════════════════════════════════════════════════════════════════════════════
const { horarios, periodo, docente } = workerData;

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENTO
// ════════════════════════════════════════════════════════════════════════════
const doc = new PDFDocument({
  size: 'A3',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: false,   // igual que auditController — el listener se registra primero
  bufferPages: true,
  info: {
    Title:   'Horario Oficial de Clases',
    Author:  'SIGAD',
    Subject: `Horario ${periodo.codigo} ${periodo.anio}`,
  },
});

const chunks = [];
doc.on('data', (chunk) => chunks.push(chunk));
doc.on('end',  ()      => parentPort.postMessage(Buffer.concat(chunks)));

// ════════════════════════════════════════════════════════════════════════════
// 1. BLOQUE DE TÍTULO  (= header navy de HorariosManagement)
// ════════════════════════════════════════════════════════════════════════════
const drawPageHeader = () => {
  // Fondo navy principal
  doc.rect(0, 0, PAGE_W, HEADER_H).fill(NAVY);

  // Título sistema
  doc.font('Helvetica-Bold').fontSize(13).fillColor(WHITE)
     .text(
       'SISTEMA INTEGRAL DE GESTIÓN ACADÉMICA DOCENTE — SIGAD',
       MARGIN, 14,
       { width: PAGE_W - MARGIN * 2, align: 'center', lineBreak: false }
     );

  // Nombre completo del docente
  const nombre = [
    docente.nombres,
    docente.apellido_paterno,
    docente.apellido_materno || '',
  ].join(' ').trim();

  doc.font('Helvetica-Bold').fontSize(10).fillColor('rgba(255,255,255,0.75)')
     .text(`Docente: ${nombre}`, MARGIN, 33,
           { width: PAGE_W - MARGIN * 2, align: 'center', lineBreak: false });

  // Periodo + fecha de generación
  const fechaGen = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  doc.font('Helvetica').fontSize(8).fillColor('rgba(255,255,255,0.45)')
     .text(
       `Periodo: ${periodo.codigo}  ·  ${periodo.anio}    |    Generado el: ${fechaGen}`,
       MARGIN, 51,
       { width: PAGE_W - MARGIN * 2, align: 'center', lineBreak: false }
     );

  // Badge "HORARIO OFICIAL"  (tono suave — = BADGE.CREACION de auditController)
  const badgeW = 116;
  const badgeX = PAGE_W - MARGIN - badgeW;
  doc.rect(badgeX, 13, badgeW, 17).fill(BADGE_OFICIAL.bg);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(BADGE_OFICIAL.text)
     .text('HORARIO OFICIAL', badgeX, 18,
           { width: badgeW, align: 'center', lineBreak: false });
};

// ════════════════════════════════════════════════════════════════════════════
// 2. PIE DE PÁGINA  (= drawPageFooter en auditController)
// ════════════════════════════════════════════════════════════════════════════
const drawPageFooter = () => {
  doc.rect(0, PAGE_H - FOOTER_H, PAGE_W, FOOTER_H).fill(NAVY);
  doc.font('Helvetica').fontSize(6.5).fillColor('rgba(255,255,255,0.45)')
     .text(
       'Documento generado automáticamente por SIGAD — Uso oficial únicamente. ' +
       'La información corresponde únicamente al periodo escolar seleccionado.',
       MARGIN, PAGE_H - FOOTER_H + 7,
       { width: PAGE_W - MARGIN * 2, align: 'center', lineBreak: false }
     );
};

// ════════════════════════════════════════════════════════════════════════════
// 3. ENCABEZADO DE DÍAS  (= drawTableHeader en auditController + header del grid React)
// ════════════════════════════════════════════════════════════════════════════
const drawDayHeader = () => {
  const y = HEADER_H;

  // Celda "HORA"
  doc.rect(MARGIN, y, TIME_COL_W, DAY_HDR_H).fill(NAVY2);
  doc.font('Helvetica-Bold').fontSize(7).fillColor(SLATE)
     .text('HORA', MARGIN, y + (DAY_HDR_H - 7) / 2,
           { width: TIME_COL_W, align: 'center', lineBreak: false });

  // Celda por día
  DAYS.forEach((day, i) => {
    const x     = dayToX(i);
    const isSat = i === 5;
    doc.rect(x, y, DAY_COL_W, DAY_HDR_H).fill(isSat ? '#334155' : NAVY2);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(isSat ? SLATE : '#F1F5F9')
       .text(day, x, y + (DAY_HDR_H - 9) / 2,
             { width: DAY_COL_W, align: 'center', lineBreak: false });
  });

  // Línea separadora inferior del encabezado de días (= strokeColor GRAY2 en auditController)
  doc.moveTo(MARGIN, GRID_Y).lineTo(PAGE_W - MARGIN, GRID_Y)
     .lineWidth(0.8).stroke(GRAY2);
};

// ════════════════════════════════════════════════════════════════════════════
// 4. CUADRÍCULA DE FONDO  (slots + líneas)
// ════════════════════════════════════════════════════════════════════════════
const drawGrid = () => {
  // ── Celdas de fondo alternadas ──────────────────────────────────────────
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const y      = slotToY(slot);
    const isHour = slot % 2 === 0;
    const min    = GRID_START_MIN + slot * SLOT_DURATION;

    // Columna de horas  (par = GRAY1, impar = GRAY3 — igual que filas par/impar de auditController)
    doc.rect(MARGIN, y, TIME_COL_W, SLOT_H).fill(isHour ? GRAY1 : GRAY3);

    if (isHour) {
      doc.font('Helvetica').fontSize(7).fillColor(MUTED)
         .text(formatHour(min), MARGIN, y + (SLOT_H - 7) / 2,
               { width: TIME_COL_W, align: 'center', lineBreak: false });
    }

    // Celdas de cada día  (Sábado = GRAY1/GRAY3 neutro, sin tinte azul)
    for (let d = 0; d < DAYS.length; d++) {
      const x      = dayToX(d);
      const isSat  = d === 5;
      const cellBg = isSat
        ? (isHour ? GRAY3 : GRAY2)   // Sábado: gris neutro, igual que auditController para filas
        : (isHour ? WHITE  : GRAY1);
      doc.rect(x, y, DAY_COL_W, SLOT_H).fill(cellBg);
    }
  }

  // ── Líneas horizontales ──────────────────────────────────────────────────
  for (let slot = 0; slot <= SLOT_COUNT; slot++) {
    const y      = slotToY(slot);
    const isHour = slot % 2 === 0;
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y)
       .lineWidth(isHour ? 0.5 : 0.2)
       .stroke(isHour ? SLATE : GRAY2);
  }

  // ── Líneas verticales entre días ─────────────────────────────────────────
  for (let d = 0; d < DAYS.length; d++) {
    doc.moveTo(dayToX(d), HEADER_H).lineTo(dayToX(d), PAGE_H - FOOTER_H - 4)
       .lineWidth(0.4).stroke(SLATE);
  }

  // Separador columna-hora / días
  doc.moveTo(GRID_X, HEADER_H).lineTo(GRID_X, PAGE_H - FOOTER_H - 4)
     .lineWidth(0.8).stroke(MUTED);

  // Borde exterior de la cuadrícula completa
  doc.rect(MARGIN, HEADER_H, PAGE_W - MARGIN * 2, DAY_HDR_H + GRID_H + 4)
     .lineWidth(1).stroke(MUTED);
};

// ════════════════════════════════════════════════════════════════════════════
// 5. BLOQUES DE ASIGNACIÓN
// ════════════════════════════════════════════════════════════════════════════
const drawBlocks = () => {
  horarios.forEach((h) => {
    const dayIdx = Number(h.dia_semana) - 1;   // 1-indexed → 0-indexed
    if (dayIdx < 0 || dayIdx > 5) return;       // sólo Lun(0)–Sáb(5)

    const startMin = timeToMinutes(h.hora_inicio);
    const endMin   = timeToMinutes(h.hora_fin);
    if (endMin <= startMin) return;

    // Recortar al rango visible 07:00–22:00 (= lógica de bloquesPorDia en React)
    if (endMin <= GRID_START_MIN || startMin >= GRID_END_MIN) return;
    const clampedStart = Math.max(startMin, GRID_START_MIN);
    const clampedEnd   = Math.min(endMin,   GRID_END_MIN);

    const startSlot     = (clampedStart - GRID_START_MIN) / SLOT_DURATION;
    const durationSlots = (clampedEnd   - clampedStart)   / SLOT_DURATION;

    const bx = dayToX(dayIdx) + 2;
    const by = slotToY(startSlot) + 1;
    const bw = DAY_COL_W - 4;
    const bh = durationSlots * SLOT_H - 2;

    const color = getColor(h.nombre_materia);

    // Fondo del bloque
    doc.rect(bx, by, bw, bh).fill(color.bg);

    // Barra de acento izquierda (= div absoluto left-0 de HorariosManagement)
    doc.rect(bx, by, 3.5, bh).fill(color.accent);

    // Borde sutil
    doc.rect(bx, by, bw, bh).lineWidth(0.5).stroke(color.border);

    // ── Contenido progresivo según altura disponible ─────────────────────
    //    (= umbrales showAula / showNivel / showTipo / showTime en React)
    const tx = bx + 6.5;
    const tw = bw - 9;
    let   ty = by + 3;

    // Nombre de la materia — siempre (≥ 10 px)
    if (bh >= 10) {
      doc.font('Helvetica-Bold').fontSize(6.5).fillColor(color.text)
         .text(h.nombre_materia, tx, ty,
               { width: tw, lineBreak: false, ellipsis: true });
      ty += 9;
    }

    // Aula · Grupo (≥ 24 px)
    if (bh >= 24) {
      doc.font('Helvetica').fontSize(5.5).fillColor(TEXT)
         .text(
           `${h.nombre_aula}  ·  ${h.nombre_grupo}`,
           tx, ty,
           { width: tw, lineBreak: false, ellipsis: true }
         );
      ty += 8;
    }

    // Horario en AM/PM (≥ 36 px)
    if (bh >= 36) {
      doc.font('Helvetica').fontSize(5.5).fillColor(MUTED)
         .text(
           `${formatAMPM(h.hora_inicio)} – ${formatAMPM(h.hora_fin)}`,
           tx, ty,
           { width: tw, lineBreak: false }
         );
      ty += 8;
    }

    // Badges nivel + tipo (≥ 52 px, = showNivel / showTipo en React)
    if (bh >= 52) {
      const nivelKey = (h.nivel_academico || 'LICENCIATURA').toUpperCase();
      const tipoKey  = (h.tipo_asignatura  || 'OBLIGATORIA').toUpperCase();
      const nBadge   = NIVEL_BADGE[nivelKey] || NIVEL_BADGE.LICENCIATURA;
      const tBadge   = TIPO_BADGE[tipoKey]   || TIPO_BADGE.OBLIGATORIA;

      drawPill(doc, nBadge.label, nBadge.bg, nBadge.text, tx,      ty, 26, 7);
      drawPill(doc, tBadge.label, tBadge.bg, tBadge.text, tx + 29, ty, 32, 7);
    }
  });
};

// ════════════════════════════════════════════════════════════════════════════
// 6. ESTADO VACÍO
// ════════════════════════════════════════════════════════════════════════════
const drawEmptyState = () => {
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#94A3B8')
     .text(
       'Sin asignaciones registradas para el periodo seleccionado.',
       MARGIN, GRID_Y + GRID_H / 2 - 8,
       { width: PAGE_W - MARGIN * 2, align: 'center', lineBreak: false }
     );
};

// ════════════════════════════════════════════════════════════════════════════
// LISTENER pageAdded  (= patrón de auditController — registrado ANTES de addPage)
// ════════════════════════════════════════════════════════════════════════════
doc.on('pageAdded', () => {
  drawPageHeader();
  drawPageFooter();
  drawDayHeader();
  drawGrid();
});

// ── Primera (y única) página — dispara pageAdded ────────────────────────────
doc.addPage();

// Bloques sobre el grid ya dibujado por el listener
drawBlocks();

// Estado vacío si no hay asignaciones
if (!horarios || horarios.length === 0) {
  drawEmptyState();
}

doc.end();