const periodoModel = require('../models/periodoModel');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const meses = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL',
  'MAYO', 'JUNIO', 'JULIO', 'AGOSTO',
  'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

const generarCodigoPeriodo = (anio, fecha_inicio, fecha_fin) => {
  const inicio    = new Date(fecha_inicio);
  const fin       = new Date(fecha_fin);
  const mesInicio = meses[inicio.getMonth()];
  const mesFin    = meses[fin.getMonth()];
  return `${anio}-${mesInicio}-${mesFin}`;
};

/* ─────────────────────────────────────────────────── */

const getPeriodos = async (req, res) => {
  try {
    const periodos = await periodoModel.getAllPeriodos();
    res.status(200).json(periodos);
  } catch (error) {
    console.error('[Error getPeriodos]:', error);
    res.status(500).json({ error: 'Error al consultar periodos' });
  }
};

/* ─────────────────────────────────────────────────── */

// EP-01 SESA: público, sin auditoría
const ObtenerPeriodoActivo = async (req, res) => {
  try {
    const periodo = await periodoModel.ObtenerPeriodoActivo();
    if (!periodo) {
      return res.status(404).json({ error: 'No existe un periodo activo en este momento' });
    }
    res.status(200).json(periodo);
  } catch (error) {
    console.error('[Error ObtenerPeriodoActivo]:', error);
    res.status(500).json({ error: 'Error al consultar el periodo activo' });
  }
};

/* ─────────────────────────────────────────────────── */

const createPeriodo = async (req, res) => {
  try {
    const { anio, fecha_inicio, fecha_fin, fecha_limite_calif } = req.body;
    const creado_por = req.user.id_usuario;

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha_fin debe ser mayor que fecha_inicio' });
    }

    const codigo = generarCodigoPeriodo(anio, fecha_inicio, fecha_fin);
    const result = await periodoModel.createPeriodo({
      codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif, creado_por,
    });

    logAudit({
      modulo:            'PERIODOS',
      accion:            'CREACION',
      registro_afectado: `Periodo "${codigo}" #${result.id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(201).json({ message: 'Periodo creado correctamente', id_periodo: result.id });
  } catch (error) {
    console.error('[Error createPeriodo]:', error);
    res.status(500).json({ error: 'Error al crear periodo' });
  }
};

/* ─────────────────────────────────────────────────── */

const updatePeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { anio, fecha_inicio, fecha_fin, fecha_limite_calif } = req.body;
    const modificado_por = req.user.id_usuario;

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({ error: 'La fecha_fin debe ser mayor que fecha_inicio' });
    }

    const periodoActual = await periodoModel.getPeriodoById(id);
    if (!periodoActual) return res.status(404).json({ error: 'Periodo no encontrado' });

    const parseDate    = (d) => new Date(d).toISOString().split('T')[0];
    const inicioActual = periodoActual.fecha_inicio      ? parseDate(periodoActual.fecha_inicio)      : null;
    const finActual    = periodoActual.fecha_fin         ? parseDate(periodoActual.fecha_fin)         : null;
    const limiteActual = periodoActual.fecha_limite_calif ? parseDate(periodoActual.fecha_limite_calif) : null;

    const intentoCambioFechas =
      (fecha_inicio       && parseDate(fecha_inicio)       !== inicioActual) ||
      (fecha_fin          && parseDate(fecha_fin)          !== finActual)    ||
      (fecha_limite_calif && parseDate(fecha_limite_calif) !== limiteActual);

    if (intentoCambioFechas) {
      const tieneAsignaciones = await periodoModel.checkDependenciasActivas(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action:  'BLOCK',
          error:   'Conflicto de integridad relacional',
          detalles: 'No es posible modificar las fechas de este periodo porque ya cuenta con clases asignadas. Esto afectaría los procesos de emisión de actas y sincronización con SESA. Debe liberar la carga horaria previamente.',
        });
      }
    }

    const codigo = generarCodigoPeriodo(anio, fecha_inicio, fecha_fin);
    await periodoModel.updatePeriodo(id, {
      codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif, modificado_por,
    });

    logAudit({
      modulo:            'PERIODOS',
      accion:            'MODIFICACION',
      registro_afectado: `Periodo "${periodoActual.codigo}" #${id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Periodo actualizado correctamente' });
  } catch (error) {
    console.error('[Error updatePeriodo]:', error);
    res.status(500).json({ error: 'Error al actualizar periodo' });
  }
};

/* ─────────────────────────────────────────────────── */

const deletePeriodo = async (req, res) => {
  try {
    const { id } = req.params;

    const periodo = await periodoModel.getPeriodoById(id);
    if (!periodo) return res.status(404).json({ error: 'Periodo no encontrado' });

    await periodoModel.deletePeriodoFisico(id);

    logAudit({
      modulo:            'PERIODOS',
      accion:            'BAJA',
      registro_afectado: `Periodo "${periodo.codigo}" #${id} — borrado físico`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.json({ message: 'Periodo eliminado' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'El periodo tiene materias asociadas' });
    }
    res.status(500).json({ error: 'Error eliminando periodo' });
  }
};

/* ─────────────────────────────────────────────────── */

const togglePeriodo = async (req, res) => {
  try {
    const { id }  = req.params;
    const usuario = req.user?.id_usuario;

    const periodoActual = await periodoModel.getPeriodoById(id);
    if (!periodoActual) return res.status(404).json({ error: 'Periodo no encontrado' });

    if (periodoActual.estatus === 'ACTIVO') {
      const tieneAsignaciones = await periodoModel.checkDependenciasActivas(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action:  'BLOCK',
          error:   'Conflicto de integridad relacional',
          detalles: 'No es posible desactivar este periodo porque cuenta con clases asignadas. Debe reubicar o cancelar estas clases antes de proceder.',
        });
      }
    }

    await periodoModel.togglePeriodoStatus(id, usuario);

    // La acción depende del estado previo
    const accionRealizada = periodoActual.estatus === 'ACTIVO' ? 'BAJA' : 'MODIFICACION';

    logAudit({
      modulo:            'PERIODOS',
      accion:            accionRealizada,
      registro_afectado: `Periodo "${periodoActual.codigo}" #${id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Estatus actualizado' });
  } catch (error) {
    console.error('Error cambiando estatus:', error);
    res.status(500).json({ error: 'Error cambiando estatus' });
  }
};

/* ─────────────────────────────────────────────────── */

module.exports = {
  getPeriodos,
  ObtenerPeriodoActivo,
  createPeriodo,
  updatePeriodo,
  deletePeriodo,
  togglePeriodo,
};