const Academia = require('../models/academiaModels');

exports.getCoordinadores = async (req, res) => {
  try {
    const results = await Academia.getCoordinadoresDisponibles();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.checkNombre = async (req, res) => {
  try {
    const { nombre } = req.params;
    const { id } = req.query;
    const existe = await Academia.validarNombre(nombre, id);
    res.json({ existe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAcademia = async (req, res) => {
  try {
    await Academia.registrar(req.body);
    logAudit({ modulo: 'ACADEMIAS', accion: 'CREACION', registro_afectado: req.body.nombre ?? 'Nueva academia', detalle: null, usuario_id: req.user?.id_usuario, ip_address: getClientIp(req) });
    res.status(201).json({ message: "Éxito" });
  } catch (error) {
    console.error("Error real al registrar:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateAcademia = async (req, res) => {
  try {
    const { id } = req.params;

    
    const modificado_por = 1; 

    const data = {
      ...req.body,
      modificado_por
    };

    await Academia.actualizar(id, data);
    logAudit({ modulo: 'ACADEMIAS', accion: 'MODIFICACION', registro_afectado: `Academia #${id}`, detalle: null, usuario_id: req.user?.id_usuario, ip_address: getClientIp(req) });
    res.json({ message: "Academia actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estatus } = req.body;
    const modificado_por = 1;

    await Academia.cambiarEstatus(id, estatus, modificado_por);
    logAudit({ modulo: 'ACADEMIAS', accion: estatus === 'INACTIVO' ? 'BAJA' : 'MODIFICACION', registro_afectado: `Academia #${id}`, detalle: `Estatus → ${estatus}`, usuario_id: req.user?.id_usuario, ip_address: getClientIp(req) });
    res.json({ message: "Estatus actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar estatus:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAcademiasCliente = async (req, res) => {
  try {
    const academias = await Academia.getAcademiasActivasCliente();
    res.json(academias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAcademias = async (req, res) => {
  try {
    const academias = await Academia.getAcademias();
    res.json(academias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};