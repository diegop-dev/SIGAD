const periodoModel = require("../models/periodoModel");

const meses = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL",
  "MAYO", "JUNIO", "JULIO", "AGOSTO",
  "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

const generarCodigoPeriodo = (anio, fecha_inicio, fecha_fin) => {
  const inicio = new Date(fecha_inicio);
  const fin    = new Date(fecha_fin);
  const mesInicio = meses[inicio.getMonth()];
  const mesFin    = meses[fin.getMonth()];
  return `${anio}-${mesInicio}-${mesFin}`;
};

const getPeriodos = async (req, res) => {
  try {
    const periodos = await periodoModel.getAllPeriodos();
    res.status(200).json(periodos);
  } catch (error) {
    console.error("[Error getPeriodos]:", error);
    res.status(500).json({ error: "Error al consultar periodos" });
  }
};

// ─── EP-01 SESA: GET /periodos/activo ────────────────────────────────────────
const ObtenerPeriodoActivo = async (req, res) => {
  try {
    const periodo = await periodoModel.ObtenerPeriodoActivo();

    if (!periodo) {
      return res.status(404).json({
        error: "No existe un periodo activo en este momento",
      });
    }

    res.status(200).json(periodo);
  } catch (error) {
    console.error("[Error ObtenerPeriodoActivo]:", error);
    res.status(500).json({ error: "Error al consultar el periodo activo" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────

const createPeriodo = async (req, res) => {
  try {
    const { anio, fecha_inicio, fecha_fin, fecha_limite_calif } = req.body;
    const creado_por = req.user.id_usuario;

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        error: "La fecha_fin debe ser mayor que fecha_inicio",
      });
    }

    const codigo = generarCodigoPeriodo(anio, fecha_inicio, fecha_fin);
    const result = await periodoModel.createPeriodo({
      codigo,
      anio,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif,
      creado_por,
    });

    logAudit({ modulo: 'PERIODOS', accion: 'CREACION', registro_afectado: codigo, detalle: null, usuario_id: creado_por, ip_address: getClientIp(req) });
    res.status(201).json({
      message: "Periodo creado correctamente",
      id_periodo: result.id,
    });
  } catch (error) {
    console.error("[Error createPeriodo]:", error);
    res.status(500).json({ error: "Error al crear periodo" });
  }
};

const updatePeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const { anio, fecha_inicio, fecha_fin, fecha_limite_calif } = req.body;
    const modificado_por = req.user.id_usuario;

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        error: "La fecha_fin debe ser mayor que fecha_inicio",
      });
    }

    const codigo = generarCodigoPeriodo(anio, fecha_inicio, fecha_fin);
    await periodoModel.updatePeriodo(id, {
      codigo,
      anio,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif,
      modificado_por,
    });

    logAudit({ modulo: 'PERIODOS', accion: 'MODIFICACION', registro_afectado: `Periodo #${id} — ${codigo}`, detalle: null, usuario_id: modificado_por, ip_address: getClientIp(req) });
    res.status(200).json({ message: "Periodo actualizado correctamente" });
  } catch (error) {
    console.error("[Error updatePeriodo]:", error);
    res.status(500).json({ error: "Error al actualizar periodo" });
  }
};

/*
=========================
BORRADO FISICO
=========================
*/
const deletePeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const periodo = await periodoModel.getPeriodoById(id);

    if (!periodo) {
      return res.status(404).json({ error: "Periodo no encontrado" });
    }

    await periodoModel.deletePeriodoFisico(id);
    logAudit({ modulo: 'PERIODOS', accion: 'BAJA', registro_afectado: `Periodo #${id} — ${periodo.codigo}`, detalle: 'Borrado físico', usuario_id: req.user?.id_usuario, ip_address: getClientIp(req) });
    res.json({ message: "Periodo eliminado" });
  } catch (error) {
    console.error(error);
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        error: "El periodo tiene materias asociadas",
      });
    }
    res.status(500).json({ error: "Error eliminando periodo" });
  }
};

/*
=========================
BAJA LOGICA
=========================
*/
const togglePeriodo = async (req, res) => {
  try {
    const { id }    = req.params;
    const usuario   = req.user?.id_usuario;
    await periodoModel.togglePeriodoStatus(id, usuario);
    logAudit({ modulo: 'PERIODOS', accion: 'MODIFICACION', registro_afectado: `Periodo #${id}`, detalle: 'Cambio de estatus', usuario_id: usuario, ip_address: getClientIp(req) });
    res.status(200).json({ message: "Estatus actualizado" });
  } catch (error) {
    console.error("Error cambiando estatus:", error);
    res.status(500).json({ error: "Error cambiando estatus" });
  }
};

module.exports = {
  getPeriodos,
  ObtenerPeriodoActivo,   // ← nuevo export EP-01 SESA
  createPeriodo,
  updatePeriodo,
  deletePeriodo,
  togglePeriodo,
};