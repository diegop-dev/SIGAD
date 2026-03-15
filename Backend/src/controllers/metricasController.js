const metricasModel = require('../models/metricasModel');

const guardarMetricas = async (req, res) => {
  try {
    const { periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general } = req.body;
    const usuario_id = req.user?.id_usuario;

    // 1. Validación estricta de datos requeridos
    if (!periodo_id || !carrera_id || total_inscritos === undefined || total_egresados === undefined || promedio_general === undefined) {
      return res.status(400).json({ error: "Faltan parámetros para procesar la métrica." });
    }

    // 2. Sanitización y validación de tipos
    const inscritos = parseInt(total_inscritos, 10);
    const egresados = parseInt(total_egresados, 10);
    const promedio = parseFloat(promedio_general);

    if (isNaN(inscritos) || isNaN(egresados) || isNaN(promedio)) {
      return res.status(400).json({ error: "Los valores de métricas deben ser números válidos." });
    }

    if (egresados > inscritos) {
      return res.status(422).json({ error: "El total de egresados no puede ser mayor al de inscritos." });
    }

    // ==========================================================
    // 3. NUEVO: Validación de Congruencia BD (Carrera - Periodo)
    // ==========================================================
    const esCarreraValidaParaPeriodo = await metricasModel.validarCarreraEnPeriodo(carrera_id, periodo_id);
    
    if (!esCarreraValidaParaPeriodo) {
      return res.status(422).json({ 
        error: "Incongruencia de datos: La carrera seleccionada no operó o no tiene materias registradas en el periodo indicado." 
      });
    }
    // ==========================================================

    // 4. Inserción o Actualización si superó todas las pruebas
    await metricasModel.upsertMetrica(periodo_id, carrera_id, inscritos, egresados, promedio, usuario_id);

    res.status(200).json({ message: "Métricas guardadas exitosamente." });
  } catch (error) {
    console.error("[Error en metricasController - guardarMetricas]:", error);
    res.status(500).json({ error: "Error interno al guardar las métricas." });
  }
};

const consultarMetricas = async (req, res) => {
  try {
    const metricas = await metricasModel.getMetricasParaDashboard();
    res.status(200).json({ data: metricas });
  } catch (error) {
    console.error("[Error en metricasController - consultarMetricas]:", error);
    res.status(500).json({ error: "Error al cargar las métricas para el dashboard." });
  }
};

module.exports = {
  guardarMetricas,
  consultarMetricas
};