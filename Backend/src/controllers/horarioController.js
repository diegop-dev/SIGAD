const { Worker } = require('worker_threads');
const path = require('path');
const horarioModel = require('../models/horarioModel');

const WORKER_PATH = path.join(__dirname, '../workers/horarioWorker.js');

// ─── Utilidad: genera el PDF en un worker thread separado ────────────────────
const generarPDFEnWorker = (workerData) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, { workerData });
    worker.on('message', resolve);
    worker.on('error',   reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`[HorarioWorker] El proceso finalizó con código ${code}`));
      }
    });
  });

// ─── Utilidad: resuelve qué periodo usar ─────────────────────────────────────
// Si el cliente envía ?periodo_id=X y el docente tiene asignaciones ahí → lo usa.
// Si no, usa el primer periodo disponible (el más reciente).
// Siempre valida que el periodo seleccionado pertenezca al docente autenticado.
const resolverPeriodo = (periodosDisponibles, periodoIdParam) => {
  if (!periodosDisponibles.length) return null;
  if (periodoIdParam) {
    const id = Number(periodoIdParam);
    const encontrado = periodosDisponibles.find(p => p.id_periodo === id);
    if (encontrado) return encontrado;
  }
  return periodosDisponibles[0];
};

// ==========================================
// GET /api/horarios[?periodo_id=X]
// Devuelve los datos del horario en JSON para la vista web.
// Extrae id_docente del JWT — un docente solo accede a su propio horario.
// Retorna además la lista de todos los periodos con asignaciones del docente.
// ==========================================
const getHorario = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario;

    const docente = await horarioModel.getDocenteByUsuario(id_usuario);
    if (!docente) {
      return res.status(404).json({
        error: 'Tu usuario no está vinculado a un perfil de docente activo.',
      });
    }

    // Periodos donde el docente realmente tiene asignaciones abiertas
    const periodosDisponibles = await horarioModel.getPeriodosConHorario(
      docente.id_docente
    );

    if (!periodosDisponibles.length) {
      return res.status(200).json({
        docente,
        periodo:              null,
        periodosDisponibles:  [],
        horarios:             [],
      });
    }

    const periodo = resolverPeriodo(periodosDisponibles, req.query.periodo_id);

    const horarios = await horarioModel.getHorarioDocente(
      docente.id_docente,
      periodo.id_periodo
    );

    res.status(200).json({
      docente,
      periodo,
      periodosDisponibles,
      horarios,
    });
  } catch (error) {
    console.error('[Error en horarioController - getHorario]:', error);
    res.status(500).json({ error: 'Error al consultar el horario.' });
  }
};

// ==========================================
// GET /api/horarios/pdf[?periodo_id=X]
// Genera el PDF de forma asíncrona en un worker thread y lo descarga.
// Control de acceso: el id_docente se extrae del token JWT, nunca del cliente.
// ==========================================
const descargarHorarioPDF = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario;

    const docente = await horarioModel.getDocenteByUsuario(id_usuario);
    if (!docente) {
      return res.status(404).json({
        error: 'Tu usuario no está vinculado a un perfil de docente activo.',
      });
    }

    const periodosDisponibles = await horarioModel.getPeriodosConHorario(
      docente.id_docente
    );

    if (!periodosDisponibles.length) {
      return res.status(404).json({
        error: 'No tienes asignaciones registradas en ningún periodo.',
      });
    }

    const periodo = resolverPeriodo(periodosDisponibles, req.query.periodo_id);

    // Cruce relacional estricto: docente × periodo seleccionado
    const horarios = await horarioModel.getHorarioDocente(
      docente.id_docente,
      periodo.id_periodo
    );

    // Delegar la generación del PDF al worker thread (no bloquea el event loop)
    const pdfBuffer = await generarPDFEnWorker({ horarios, periodo, docente });

    const filename = `horario_${periodo.codigo}_${periodo.anio}.pdf`
      .replace(/\s+/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error('[Error en horarioController - descargarHorarioPDF]:', error);
    res.status(500).json({ error: 'Error interno al generar el documento PDF.' });
  }
};

module.exports = {
  getHorario,
  descargarHorarioPDF,
};
