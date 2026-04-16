const Academia = require('../models/academiaModels');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles (consistente con authController) ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

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
    const data = {
      ...req.body,
      creado_por: req.user?.id_usuario || req.body.creado_por || 1,
    };

    await Academia.registrar(data);

    logAudit({
      modulo:            'ACADEMIAS',
      accion:            'CREACION',
      registro_afectado: `Academia "${data.nombre}"`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(201).json({ message: 'Academia registrada con éxito' });
  } catch (error) {
    console.error('Error al registrar academia:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateAcademia = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, usuario_id } = req.body;
    const modificado_por = req.user?.id_usuario || 1;

    const academiaActual = await Academia.getAcademiaById(id);
    if (!academiaActual) {
      return res.status(404).json({ error: 'Academia no encontrada' });
    }

    const intentoCambioEstructural =
      (nombre    !== undefined && nombre              !== academiaActual.nombre)    ||
      (usuario_id !== undefined && Number(usuario_id) !== Number(academiaActual.usuario_id));

    if (intentoCambioEstructural) {
      const tieneAsignaciones = await Academia.checkDependenciasActivas(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action: 'BLOCK',
          error: 'Conflicto de integridad relacional',
          detalles: 'No es posible modificar el nombre o el coordinador de esta academia porque existen materias de sus programas vinculadas a clases activas. Debe liberar la carga horaria previamente.',
        });
      }
    }

    if (nombre !== undefined && nombre !== academiaActual.nombre) {
      const existe = await Academia.validarNombre(nombre, id);
      if (existe) {
        return res.status(409).json({ error: 'El nombre de la academia ya está en uso.' });
      }
    }

    const data = { nombre, descripcion, usuario_id, modificado_por };
    await Academia.actualizar(id, data);

    logAudit({
      modulo:            'ACADEMIAS',
      accion:            'MODIFICACION',
      registro_afectado: `Academia #${id} "${academiaActual.nombre}"`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.json({ message: 'Academia actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar academia:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateEstatus = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.user?.id_usuario || 1;

    const academiaActual = await Academia.getAcademiaById(id);
    if (!academiaActual) {
      return res.status(404).json({ error: 'Academia no encontrada' });
    }

    if (academiaActual.estatus === 'ACTIVO') {
      const tieneAsignaciones = await Academia.checkDependenciasActivas(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action: 'BLOCK',
          error: 'Conflicto de integridad relacional',
          detalles: 'No es posible desactivar esta academia porque existen materias de sus programas impartiéndose actualmente. Debe reasignar o cancelar estas clases antes de proceder.',
        });
      }
    }

    await Academia.toggleAcademiaStatus(id, usuario);

    // La acción depende del estado previo: si estaba ACTIVO se da de baja, si no se reactiva
    const accionRealizada = academiaActual.estatus === 'ACTIVO' ? 'BAJA' : 'MODIFICACION';

    logAudit({
      modulo:            'ACADEMIAS',
      accion:            accionRealizada,
      registro_afectado: `Academia #${id} "${academiaActual.nombre}"`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.json({ message: 'Estatus actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
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