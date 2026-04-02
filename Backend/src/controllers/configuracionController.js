const configuracionModel = require('../models/configuracionModel');

const getConfig = async (req, res) => {
  try {
    const config = await configuracionModel.getConfiguracion();
    res.status(200).json({ data: config });
  } catch (error) {
    console.error('[Error en configuracionController - getConfig]:', error);
    res.status(500).json({ error: 'Error al obtener la configuración del sistema.' });
  }
};

const updateConfig = async (req, res) => {
  try {
    const usuario_id = req.user?.id_usuario;
    // Acepta un solo objeto { clave, valor } o un array [{ clave, valor }, ...]
    const updates = Array.isArray(req.body) ? req.body : [req.body];

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

    res.status(200).json({ message: 'Configuración actualizada correctamente.' });
  } catch (error) {
    console.error('[Error en configuracionController - updateConfig]:', error);
    res.status(500).json({ error: 'Error al actualizar la configuración.' });
  }
};

module.exports = { getConfig, updateConfig };
