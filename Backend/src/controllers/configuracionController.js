const configuracionModel = require('../models/configuracionModel');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const getConfig = async (req, res) => {
  try {
    const config = await configuracionModel.getConfiguracion();
    res.status(200).json({ data: config });
  } catch (error) {
    console.error('[Error en configuracionController - getConfig]:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del sistema.' });
  }
};

/* ─────────────────────────────────────────────────── */

const updateConfig = async (req, res) => {
  try {
    const usuario_id = req.user?.id_usuario;
    const updates    = Array.isArray(req.body) ? req.body : [req.body];

    for (const { clave, valor } of updates) {
      if (!clave || valor === undefined || valor === null || valor === '') {
        return res.status(400).json({ error: `Se requiere clave y valor para cada entrada. Falta: ${clave || '(sin clave)'}` });
      }
      const valorNum = parseFloat(valor);
      if (isNaN(valorNum) || valorNum <= 0) {
        return res.status(400).json({ error: `El valor para "${clave}" debe ser un número mayor a 0.` });
      }
      await configuracionModel.updateValor(clave, valor, usuario_id);
    }

    // Registrar las claves modificadas como un resumen legible
    const clavesModificadas = updates.map(({ clave, valor }) => `${clave}=${valor}`).join(', ');

    logAudit({
      modulo:            'CONFIGURACION',
      accion:            'MODIFICACION',
      registro_afectado: clavesModificadas,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Configuración actualizada correctamente.' });
  } catch (error) {
    console.error('[Error en configuracionController - updateConfig]:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración.' });
  }
};

/* ─────────────────────────────────────────────────── */

module.exports = { getConfig, updateConfig };