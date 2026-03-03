const { Periodo } = require("../models/periodoModel");

exports.createPeriodo = async (req, res) => {
  try {
    const {
      periodo,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif,
    } = req.body;

    if (new Date(fecha_fin) <= new Date(fecha_inicio)) {
      return res.status(400).json({
        message: "La fecha_fin debe ser mayor a fecha_inicio",
      });
    }

    const nuevoPeriodo = await Periodo.create({
      periodo,
      fecha_inicio,
      fecha_fin,
      fecha_limite_calif,
      estatus: "ACTIVO",
      creado_por: req.user?.id || 1, // fallback temporal
      fecha_creacion: new Date(),
    });

    res.status(201).json(nuevoPeriodo);
  } catch (error) {
    res.status(500).json({ message: "Error al crear periodo" });
  }
};

exports.getPeriodos = async (req, res) => {
  try {
    const { estatus } = req.query;

    const where = {};
    if (estatus) where.estatus = estatus;

    const periodos = await Periodo.findAll({
      where,
      order: [["fecha_inicio", "DESC"]],
    });

    res.json(periodos);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener periodos" });
  }
};

exports.updatePeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const periodo = await Periodo.findByPk(id);

    if (!periodo) return res.status(404).json({ message: "No encontrado" });

    if (["INACTIVO", "CERRADO"].includes(periodo.estatus)) {
      return res.status(400).json({
        message: "Periodo inactivo o cerrado requiere confirmación",
      });
    }

    await periodo.update({
      ...req.body,
      modificado_por: req.user?.id || 1,
      fecha_modificacion: new Date(),
    });

    res.json(periodo);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar" });
  }
};

exports.deletePeriodo = async (req, res) => {
  try {
    const { id } = req.params;
    const periodo = await Periodo.findByPk(id);

    if (!periodo) return res.status(404).json({ message: "No encontrado" });

    await periodo.update({
      estatus: "INACTIVO",
      eliminado_por: req.user?.id || 1,
      fecha_eliminacion: new Date(),
    });

    res.json({ message: "Periodo inactivado" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar" });
  }
};