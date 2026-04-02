const auditModel = require('../models/auditModel');

const getLogs = async (req, res) => {
  try {
    const { desde, hasta, modulo, texto, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(parseInt(page), 1) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      auditModel.getAuditLogs({ desde, hasta, modulo, texto, limit, offset }),
      auditModel.countAuditLogs({ desde, hasta, modulo, texto })
    ]);

    res.status(200).json({
      data: logs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('[Error en auditController - getLogs]:', error);
    res.status(500).json({ error: 'Error al obtener el registro de auditoría.' });
  }
};

module.exports = { getLogs };
