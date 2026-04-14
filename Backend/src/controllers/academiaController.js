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
    // Inyectamos el creador desde el token, con fallback a 1 si es necesario
    const data = {
      ...req.body,
      creado_por: req.user?.id_usuario || req.body.creado_por || 1
    };
    await Academia.registrar(data);
    res.status(201).json({ message: "Academia registrada con éxito" });
  } catch (error) {
    console.error("Error al registrar academia:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateAcademia = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, usuario_id } = req.body;
    const modificado_por = req.user?.id_usuario || 1; 

    // 1. Recuperar el estado actual de la academia
    const academiaActual = await Academia.getAcademiaById(id);
    if (!academiaActual) {
      return res.status(404).json({ error: "Academia no encontrada" });
    }

    // 2. Detectar intentos de mutación en atributos estructurales (nombre y coordinador)
    const intentoCambioEstructural = 
      (nombre !== undefined && nombre !== academiaActual.nombre) ||
      (usuario_id !== undefined && Number(usuario_id) !== Number(academiaActual.usuario_id));

    if (intentoCambioEstructural) {
      const tieneAsignaciones = await Academia.checkDependenciasActivas(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action: "BLOCK",
          error: "Conflicto de integridad relacional",
          detalles: "No es posible modificar el nombre o el coordinador de esta academia porque existen materias de sus programas vinculadas a clases activas. Debe liberar la carga horaria previamente."
        });
      }
    }

    // 3. Validar si el nombre ya existe (si es que cambió)
    if (nombre !== undefined && nombre !== academiaActual.nombre) {
        const existe = await Academia.validarNombre(nombre, id);
        if (existe) {
            return res.status(409).json({ error: "El nombre de la academia ya está en uso." });
        }
    }

    // 4. Ejecutar la actualización dinámica
    const data = { nombre, descripcion, usuario_id, modificado_por };
    await Academia.actualizar(id, data);
    logAudit({ modulo: 'ACADEMIAS', accion: 'MODIFICACION', registro_afectado: `Academia #${id}`, detalle: null, usuario_id: req.user?.id_usuario, ip_address: getClientIp(req) });
    res.json({ message: "Academia actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar academia:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.user?.id_usuario || 1;

    // Validación de integridad antes de la baja lógica
    const academiaActual = await Academia.getAcademiaById(id);
    if (!academiaActual) {
      return res.status(404).json({ error: "Academia no encontrada" });
    }

    if (academiaActual.estatus === 'ACTIVO') {
      const tieneAsignaciones = await Academia.checkDependenciasActivas(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action: "BLOCK",
          error: "Conflicto de integridad relacional",
          detalles: "No es posible desactivar esta academia porque existen materias de sus programas impartiéndose actualmente. Debe reasignar o cancelar estas clases antes de proceder."
        });
      }
    }

    // Utilizamos el nuevo método toggle que implementamos en el modelo
    await Academia.toggleAcademiaStatus(id, usuario);

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
