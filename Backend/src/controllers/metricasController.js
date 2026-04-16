const metricasModel = require('../models/metricasModel');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const guardarMetricas = async (req, res) => {
  try {
    const { periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general } = req.body;
    const usuario_id = req.user?.id_usuario;

    if (!periodo_id || !carrera_id || total_inscritos === undefined || total_egresados === undefined || promedio_general === undefined) {
      return res.status(400).json({ error: 'Faltan parámetros obligatorios para procesar la métrica institucional.' });
    }

    const inscritos = parseInt(total_inscritos, 10);
    const egresados = parseInt(total_egresados, 10);
    const promedio  = parseFloat(promedio_general);

    if (isNaN(inscritos) || isNaN(egresados) || isNaN(promedio)) {
      return res.status(400).json({ error: 'Los valores ingresados para las métricas deben ser campos numéricos válidos.' });
    }

    if (inscritos < 0 || egresados < 0) {
      return res.status(400).json({ error: 'Los valores de alumnos inscritos y egresados no pueden ser cantidades negativas.' });
    }

    if (egresados > inscritos) {
      return res.status(422).json({ error: 'Incongruencia de datos: El total de alumnos egresados no puede ser mayor al total de inscritos en la generación.' });
    }

    if (promedio < 0 || promedio > 100) {
      return res.status(400).json({ error: 'El promedio general de la generación debe encontrarse en un rango válido (0 a 100).' });
    }

    const esCarreraValidaParaPeriodo = await metricasModel.validarCarreraEnPeriodo(carrera_id, periodo_id);
    if (!esCarreraValidaParaPeriodo) {
      return res.status(422).json({ error: 'Incongruencia operativa: El programa educativo seleccionado no operó o no cuenta con materias registradas en el periodo indicado.' });
    }

    await metricasModel.upsertMetrica(periodo_id, carrera_id, inscritos, egresados, promedio, usuario_id);

    logAudit({
      modulo:            'METRICAS',
      accion:            'MODIFICACION', // upsert = creación o actualización, MODIFICACION cubre ambos
      registro_afectado: `Carrera #${carrera_id} / Periodo #${periodo_id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Métricas institucionales guardadas exitosamente.' });
  } catch (error) {
    console.error('[Error en metricasController - guardarMetricas]:', error);
    res.status(500).json({ error: 'Ocurrió un error interno en el servidor al intentar procesar las métricas.' });
  }
};

/* ─────────────────────────────────────────────────── */

const consultarMetricas = async (req, res) => {
  try {
    const metricas = await metricasModel.getMetricasParaDashboard();
    res.status(200).json({ data: metricas });
  } catch (error) {
    console.error('[Error en metricasController - consultarMetricas]:', error);
    res.status(500).json({ error: 'Ocurrió un error al cargar las métricas históricas para el panel de control.' });
  }
};

/* ─────────────────────────────────────────────────── */

module.exports = { guardarMetricas, consultarMetricas };