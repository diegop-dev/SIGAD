const aulaModel = require('../models/aulaModel');
const assignmentModel = require('../models/assignmentModel');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const registrarAula = async (req, res) => {
  const { nombre, tipo, capacidad, ubicacion } = req.body;
  const creado_por = req.user?.id_usuario;

  try {
    const existente = await aulaModel.findByNombreCodigo(nombre);
    if (existente.length > 0) {
      return res.status(409).json({ message: 'Ya existe un aula o laboratorio con ese nombre.' });
    }

    const insertId = await aulaModel.createAula(nombre, tipo, capacidad, ubicacion, creado_por);

    logAudit({
      modulo:            'AULAS',
      accion:            'CREACION',
      registro_afectado: `Aula "${nombre}" #${insertId}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(201).json({
      message: 'Espacio académico registrado con éxito.',
      id_aula: insertId,
    });
  } catch (error) {
    console.error('Error al registrar aula:', error);
    res.status(500).json({ message: 'Error interno del servidor al crear el espacio.' });
  }
};

/* ─────────────────────────────────────────────────── */

const consultarAulas = async (req, res) => {
  try {
    const resultados = await aulaModel.getTodasAulas();
    res.status(200).json(resultados);
  } catch (error) {
    console.error('Error al consultar el catálogo de aulas:', error);
    res.status(500).json({ message: 'Error interno al obtener las aulas.' });
  }
};

/* ─────────────────────────────────────────────────── */

const actualizarAula = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, capacidad, ubicacion, estatus } = req.body;
  const modificado_por = req.user?.id_usuario;

  try {
    const aulaActual = await aulaModel.getAulaById(id);
    if (!aulaActual) {
      return res.status(404).json({ message: 'Aula no encontrada.' });
    }

    const intentoCambioEstructural =
      (tipo      !== undefined && tipo      !== aulaActual.tipo)      ||
      (ubicacion !== undefined && ubicacion !== aulaActual.ubicacion);

    const confirmar_rechazo = req.body.confirmar_rechazo === true || req.body.confirmar_rechazo === 'true';

    if (intentoCambioEstructural) {
      const tieneAsignaciones = await aulaModel.verificarDependenciasAula(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action:  'BLOCK',
          error:   'Conflicto de integridad relacional',
          detalles: 'No es posible modificar el tipo ni la ubicación de este espacio porque ya cuenta con clases ACEPTADAS vigentes. Debe reubicar las clases previamente en el módulo de asignaciones.',
        });
      }

      const tieneEnviadas = await aulaModel.checkDependenciasEnviadas(id);
      if (tieneEnviadas && !confirmar_rechazo) {
        return res.status(409).json({
          action:  'WARN',
          error:   'Advertencia de asignaciones pendientes',
          detalles: 'Este espacio tiene asignaciones ENVIADAS pendientes de confirmación. Cambiar su estructura rechazará automáticamente estas clases. ¿Deseas continuar?'
        });
      }
      if (tieneEnviadas && confirmar_rechazo) {
        await assignmentModel.rechazarAsignacionesPorAula(id, modificado_por);
      }
    }

    const existente = await aulaModel.findByNombreCodigo(nombre, id);
    if (existente.length > 0) {
      return res.status(409).json({ message: 'Ya existe otra aula/laboratorio con ese nombre.' });
    }

    const actualizado = await aulaModel.updateAula(id, nombre, tipo, capacidad, ubicacion, estatus, modificado_por);

    if (!actualizado) {
      return res.status(404).json({ message: 'Aula no encontrada.' });
    }

    logAudit({
      modulo:            'AULAS',
      accion:            'MODIFICACION',
      registro_afectado: `Aula "${aulaActual.nombre_codigo}" #${id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.json({ message: 'Actualizado con éxito.' });
  } catch (error) {
    console.error('Error al actualizar:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

/* ─────────────────────────────────────────────────── */

const desactivarAula = async (req, res) => {
  const { id } = req.params;
  const eliminado_por = req.user?.id_usuario;
  const confirmar_rechazo = req.body.confirmar_rechazo === true || req.body.confirmar_rechazo === 'true';

  try {
    const tieneAsignaciones = await aulaModel.verificarDependenciasAula(id);
    if (tieneAsignaciones) {
      return res.status(409).json({
        action:  'BLOCK',
        error:   'Conflicto de integridad relacional',
        detalles: 'No es posible desactivar esta aula porque cuenta con clases ACEPTADAS actualmente. Debe reubicar o cancelar estas clases antes de proceder.',
      });
    }

    const tieneEnviadas = await aulaModel.checkDependenciasEnviadas(id);
    if (tieneEnviadas && !confirmar_rechazo) {
      return res.status(409).json({
        action:  'WARN',
        error:   'Advertencia de asignaciones pendientes',
        detalles: 'Este aula tiene asignaciones ENVIADAS pendientes de confirmación. Darla de baja rechazará automáticamente estas clases. ¿Deseas continuar?'
      });
    }
    if (tieneEnviadas && confirmar_rechazo) {
      await assignmentModel.rechazarAsignacionesPorAula(id, eliminado_por);
    }

    const nombreAnterior = await aulaModel.getNombreForAudit(id);

    const desactivado = await aulaModel.setEstatusInactivo(id, eliminado_por);

    if (!desactivado) {
      return res.status(404).json({ message: 'Aula o laboratorio no encontrado.' });
    }

    logAudit({
      modulo:            'AULAS',
      accion:            'BAJA',
      registro_afectado: `Aula "${nombreAnterior}" #${id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.json({ message: 'Espacio académico desactivado con éxito.' });
  } catch (error) {
    console.error('Error al desactivar aula:', error);
    res.status(500).json({ message: 'Error interno al procesar la baja del espacio.' });
  }
};

/* ─────────────────────────────────────────────────── */

// EP-09 SESA: endpoint público, sin auditoría
const ObtenerAulas = async (req, res) => {
  try {
    const aulas = await aulaModel.getAulasActivas();
    res.status(200).json(aulas);
  } catch (error) {
    console.error('[Error ObtenerAulas]:', error);
    res.status(500).json({ error: 'Error al consultar las aulas' });
  }
};

/* ─────────────────────────────────────────────────── */

const obtenerAsignacionesRelacionadas = async (req, res) => {
  try {
    const { id } = req.params;
    const asignaciones = await aulaModel.getAsignacionesByAulaId(id);
    
    // Group them or just return directly. Returning directly is nice since UI handles it well
    res.status(200).json({ data: asignaciones });
  } catch (error) {
    console.error('Error al obtener asignaciones de la aula:', error);
    res.status(500).json({ message: 'Error interno al consultar las ocupaciones del espacio.' });
  }
};

/* ─────────────────────────────────────────────────── */

module.exports = { registrarAula, consultarAulas, actualizarAula, desactivarAula, ObtenerAulas, obtenerAsignacionesRelacionadas };