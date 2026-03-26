/**
 * horarioWorker.js
 * Worker thread dedicado a la generación asíncrona del PDF de horario oficial.
 * Corre en un hilo separado para no bloquear el event loop principal.
 *
 * Recibe vía workerData: { horarios, periodo, docente }
 * Emite de vuelta: Buffer con el PDF completo.
 */
'use strict';

const { workerData, parentPort } = require('worker_threads');
const PDFDocument = require('pdfkit');

// ─── Constantes de diseño (A3 Landscape) ────────────────────────────────────
const PAGE_W  = 1190.55;   // puntos (420 mm)
const PAGE_H  = 841.89;    // puntos (297 mm)

const ML = 22;             // margen izquierdo
const MR = 22;             // margen derecho
const MT = 78;             // alto del bloque de título
const MB = 18;             // margen inferior

const TIME_COL_W = 58;     // ancho de la columna de horas
const HEADER_H   = 26;     // alto de la fila de encabezado (días)
const SLOT_COUNT = 48;     // bloques de 30 min en 24 h

const GRID_X = ML + TIME_COL_W;
const GRID_Y = MT + HEADER_H;
const GRID_W = PAGE_W - ML - MR - TIME_COL_W;
const GRID_H = PAGE_H - GRID_Y - MB;
const DAY_COL_W = GRID_W / 7;
const SLOT_H    = GRID_H / SLOT_COUNT;   // ≈ 14.7 pt por bloque de 30 min

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// ─── Paleta de colores para bloques de asignación ───────────────────────────
const PALETTE = [
  { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
  { bg: '#EDE9FE', border: '#7C3AED', text: '#5B21B6' },
  { bg: '#D1FAE5', border: '#059669', text: '#065F46' },
  { bg: '#FEF3C7', border: '#D97706', text: '#92400E' },
  { bg: '#FEE2E2', border: '#DC2626', text: '#991B1B' },
  { bg: '#CFFAFE', border: '#0891B2', text: '#164E63' },
  { bg: '#DCFCE7', border: '#16A34A', text: '#14532D' },
  { bg: '#FFEDD5', border: '#EA580C', text: '#7C2D12' },
  { bg: '#FCE7F3', border: '#DB2777', text: '#831843' },
  { bg: '#E0E7FF', border: '#4F46E5', text: '#312E81' },
];

const getColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

// ─── Utilidades de tiempo ────────────────────────────────────────────────────
const timeToMinutes = (timeStr) => {
  const parts = String(timeStr).split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

const formatHour = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const slotToY  = (slot)   => GRID_Y + slot * SLOT_H;
const dayToX   = (dayIdx) => GRID_X + dayIdx * DAY_COL_W;

// ─── Generación del PDF ──────────────────────────────────────────────────────
const { horarios, periodo, docente } = workerData;

const doc = new PDFDocument({
  size: 'A3',
  layout: 'landscape',
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  autoFirstPage: true,
  bufferPages: true,
  info: {
    Title: 'Horario Oficial de Clases',
    Author: 'SIGAD',
    Subject: `Horario ${periodo.codigo} ${periodo.anio}`,
  },
});

const chunks = [];
doc.on('data', (chunk) => chunks.push(chunk));
doc.on('end',  ()      => parentPort.postMessage(Buffer.concat(chunks)));

// ════════════════════════════════════════════════════════════════════════════
// 1. BLOQUE DE TÍTULO
// ════════════════════════════════════════════════════════════════════════════
doc.rect(0, 0, PAGE_W, MT)
   .fill('#1E3A5F');

doc.font('Helvetica-Bold').fontSize(13).fillColor('#FFFFFF')
   .text(
     'SISTEMA INTEGRAL DE GESTIÓN ACADÉMICA DOCENTE — SIGAD',
     ML, 12,
     { width: PAGE_W - ML - MR, align: 'center' }
   );

const nombreCompleto =
  `${docente.nombres} ${docente.apellido_paterno} ${docente.apellido_materno || ''}`.trim();

doc.font('Helvetica-Bold').fontSize(10).fillColor('#BFD7FF')
   .text(
     `Docente: ${nombreCompleto}`,
     ML, 31,
     { width: PAGE_W - ML - MR, align: 'center' }
   );

const periodoLabel    = `Periodo: ${periodo.codigo}  •  ${periodo.anio}`;
const fechaGeneracion = new Date().toLocaleDateString('es-MX', {
  day: '2-digit', month: 'long', year: 'numeric',
});

doc.font('Helvetica').fontSize(8).fillColor('#93C5FD')
   .text(
     `${periodoLabel}    |    Generado el: ${fechaGeneracion}`,
     ML, 52,
     { width: PAGE_W - ML - MR, align: 'center' }
   );

// Línea divisoria del título
doc.rect(0, MT - 1, PAGE_W, 1).fill('#3B82F6');

// ════════════════════════════════════════════════════════════════════════════
// 2. ENCABEZADO DE DÍAS
// ════════════════════════════════════════════════════════════════════════════

// Celda "Hora"
doc.rect(ML, MT, TIME_COL_W, HEADER_H).fill('#1E293B');
doc.font('Helvetica-Bold').fontSize(8).fillColor('#94A3B8')
   .text('HORA', ML, MT + (HEADER_H - 8) / 2, {
     width: TIME_COL_W, align: 'center',
   });

// Celdas de días
DAYS.forEach((day, i) => {
  const x       = dayToX(i);
  const isWeekend = i >= 5;
  doc.rect(x, MT, DAY_COL_W, HEADER_H).fill(isWeekend ? '#334155' : '#1E293B');
  doc.font('Helvetica-Bold').fontSize(9).fillColor(isWeekend ? '#94A3B8' : '#F1F5F9')
     .text(day, x, MT + (HEADER_H - 9) / 2, {
       width: DAY_COL_W, align: 'center',
     });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. FONDO DE LA CUADRÍCULA (celdas alternadas)
// ════════════════════════════════════════════════════════════════════════════
for (let slot = 0; slot < SLOT_COUNT; slot++) {
  const y      = slotToY(slot);
  const isHour = slot % 2 === 0;

  // Columna de tiempo
  doc.rect(ML, y, TIME_COL_W, SLOT_H)
     .fill(isHour ? '#F8FAFC' : '#F1F5F9');

  // Etiqueta de hora (solo en el inicio de cada hora)
  if (isHour) {
    doc.font('Helvetica').fontSize(7).fillColor('#64748B')
       .text(formatHour(slot * 30), ML, y + (SLOT_H - 7) / 2, {
         width: TIME_COL_W, align: 'center',
       });
  }

  // Celdas de cada día
  for (let d = 0; d < 7; d++) {
    const x       = dayToX(d);
    const isWeekend = d >= 5;
    const cellBg  = isWeekend
      ? (isHour ? '#EFF6FF' : '#EDF2F7')
      : (isHour ? '#FFFFFF' : '#F8FAFC');
    doc.rect(x, y, DAY_COL_W, SLOT_H).fill(cellBg);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 4. LÍNEAS DE LA CUADRÍCULA
// ════════════════════════════════════════════════════════════════════════════

// Horizontales: línea gruesa en hora, delgada en media hora
for (let slot = 0; slot <= SLOT_COUNT; slot++) {
  const y       = slotToY(slot);
  const isHour  = slot % 2 === 0;
  doc.moveTo(ML, y)
     .lineTo(PAGE_W - MR, y)
     .lineWidth(isHour ? 0.5 : 0.25)
     .stroke(isHour ? '#CBD5E1' : '#E2E8F0');
}

// Verticales entre días
for (let d = 0; d < 7; d++) {
  const x = dayToX(d);
  doc.moveTo(x, MT)
     .lineTo(x, PAGE_H - MB)
     .lineWidth(0.4)
     .stroke('#CBD5E1');
}

// Línea vertical separadora de columna tiempo
doc.moveTo(GRID_X, MT)
   .lineTo(GRID_X, PAGE_H - MB)
   .lineWidth(0.8)
   .stroke('#94A3B8');

// ════════════════════════════════════════════════════════════════════════════
// 5. BLOQUES DE ASIGNACIÓN
// ════════════════════════════════════════════════════════════════════════════
horarios.forEach((h) => {
  const dayIdx = Number(h.dia_semana) - 1; // 1-indexed → 0-indexed
  if (dayIdx < 0 || dayIdx > 6) return;

  const startMin = timeToMinutes(h.hora_inicio);
  const endMin   = timeToMinutes(h.hora_fin);
  if (endMin <= startMin) return;

  const startSlot    = startMin / 30;
  const durationSlots = (endMin - startMin) / 30;

  const bx = dayToX(dayIdx) + 2;
  const by = slotToY(startSlot) + 1;
  const bw = DAY_COL_W - 4;
  const bh = durationSlots * SLOT_H - 2;

  const color = getColor(h.nombre_materia);

  // Fondo del bloque
  doc.rect(bx, by, bw, bh).fill(color.bg);

  // Borde de acento izquierdo
  doc.rect(bx, by, 3.5, bh).fill(color.border);

  // Borde sutil alrededor del bloque
  doc.rect(bx, by, bw, bh)
     .lineWidth(0.5)
     .stroke(color.border);

  // ── Texto dentro del bloque ──────────────────────────────────────────────
  const tx = bx + 6;
  const tw = bw - 9;
  const pad = 2.5;

  if (bh >= 12) {
    // Nombre de la materia
    doc.font('Helvetica-Bold').fontSize(6.5).fillColor(color.text)
       .text(h.nombre_materia, tx, by + pad, {
         width: tw,
         ellipsis: true,
         lineBreak: false,
       });
  }

  if (bh >= 24) {
    // Grupo y aula
    doc.font('Helvetica').fontSize(6).fillColor(color.text)
       .text(
         `Grp: ${h.nombre_grupo}  ·  ${h.nombre_aula}`,
         tx, by + pad + 10,
         { width: tw, ellipsis: true, lineBreak: false }
       );
  }

  if (bh >= 38) {
    // Horario
    const hi = String(h.hora_inicio).substring(0, 5);
    const hf = String(h.hora_fin).substring(0, 5);
    doc.font('Helvetica').fontSize(5.5).fillColor(color.text)
       .text(`${hi} – ${hf}`, tx, by + pad + 19, {
         width: tw, ellipsis: true, lineBreak: false,
       });
  }
});

// ════════════════════════════════════════════════════════════════════════════
// 6. BORDE EXTERIOR DE LA CUADRÍCULA
// ════════════════════════════════════════════════════════════════════════════
doc.rect(ML, MT, PAGE_W - ML - MR, HEADER_H + GRID_H)
   .lineWidth(1)
   .stroke('#64748B');

// Línea que cierra el encabezado de días por abajo
doc.moveTo(ML, GRID_Y)
   .lineTo(PAGE_W - MR, GRID_Y)
   .lineWidth(1)
   .stroke('#64748B');

// ════════════════════════════════════════════════════════════════════════════
// 7. PIE DE PÁGINA
// ════════════════════════════════════════════════════════════════════════════
const footerY = PAGE_H - MB + 3;
doc.font('Helvetica').fontSize(6.5).fillColor('#94A3B8')
   .text(
     'Documento generado automáticamente por SIGAD — Uso oficial únicamente. ' +
     'La información corresponde únicamente al periodo escolar activo.',
     ML, footerY,
     { width: PAGE_W - ML - MR, align: 'center' }
   );

// ════════════════════════════════════════════════════════════════════════════
// 8. NOTA SI NO HAY ASIGNACIONES
// ════════════════════════════════════════════════════════════════════════════
if (!horarios || horarios.length === 0) {
  const cx = PAGE_W / 2;
  const cy = GRID_Y + GRID_H / 2;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#94A3B8')
     .text(
       'Sin asignaciones registradas para el periodo activo.',
       ML, cy - 8,
       { width: PAGE_W - ML - MR, align: 'center' }
     );
}

doc.end();
