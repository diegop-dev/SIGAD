const pool = require('../config/database');

/**
 * Registra una operación en audit_logs.
 * No-bloqueante: si falla, solo loguea en consola sin interrumpir el flujo principal.
 *
 * @param {Object} opts
 * @param {string}  opts.modulo            - Módulo del sistema (ej. 'Asignaciones')
 * @param {string}  opts.accion            - 'CREACION' | 'MODIFICACION' | 'BAJA' | 'LOGIN' | 'CAMBIO_CONTRASENA'
 * @param {string}  [opts.registro_afectado] - Identificador del registro (ej. 'Docente #5 / Materia #12')
 * @param {string}  [opts.detalle]         - Descripción técnica del cambio
 * @param {number}  [opts.usuario_id]      - ID del usuario que realizó la acción
 * @param {string}  [opts.ip_address]      - IP del cliente
 */
const logAudit = async ({ modulo, accion, registro_afectado, detalle, usuario_id, ip_address }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (modulo, accion, registro_afectado, detalle, usuario_id, ip_address, fecha)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        modulo,
        accion,
        registro_afectado ?? null,
        detalle ?? null,
        usuario_id ?? null,
        ip_address ?? null
      ]
    );
  } catch (err) {
    console.error('[AuditService] Error al registrar en audit_logs:', err.message);
  }
};

/**
 * Extrae la IP real del cliente desde el request de Express.
 */
const getClientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress ||
  'Desconocida';

module.exports = { logAudit, getClientIp };
