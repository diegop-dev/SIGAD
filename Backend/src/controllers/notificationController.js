const notificationModel = require('../models/notificationModel');

const getMisNotificaciones = async (req, res) => {
  try {
    const usuario_id = req.user?.id_usuario;
    const notificaciones = await notificationModel.getNotificacionesByUser(usuario_id);
    res.status(200).json({ data: notificaciones });
  } catch (error) {
    console.error("[Error en notificationController - getMisNotificaciones]:", error);
    res.status(500).json({ error: "Error al cargar las notificaciones." });
  }
};

const marcarNotificacionLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user?.id_usuario;

    const affectedRows = await notificationModel.marcarComoLeida(id, usuario_id);
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: "Notificación no encontrada o ya leída." });
    }

    res.status(200).json({ message: "Notificación marcada como leída." });
  } catch (error) {
    console.error("[Error en notificationController - marcarNotificacionLeida]:", error);
    res.status(500).json({ error: "Error al actualizar la notificación." });
  }
};

module.exports = {
  getMisNotificaciones,
  marcarNotificacionLeida
};