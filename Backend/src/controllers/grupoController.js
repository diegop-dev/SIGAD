const grupoModel = require('../models/grupoModel');
const carreraModel = require('../models/carreraModel');

const grupoController = {
  getGrupos: async (req, res) => {
    try {
      const grupos = await grupoModel.getAllGrupos();
      return res.status(200).json(grupos);
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener grupos' });
    }
  },

  crearGrupo: async (req, res) => {
    try {
      const { carrera_id } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : null;

      const datosNuevoGrupo = {
        identificador: 'TEMP',
        carrera_id,
        cuatrimestre_id: 1, 
        creado_por
      };

      const resultado = await grupoModel.crearGrupo(datosNuevoGrupo);
      const nuevoId = resultado.insertId;

      const carreraInfo = await carreraModel.getCarreraById(carrera_id);
      const codigo_unico = carreraInfo ? carreraInfo.codigo_unico : 'XXXX';
      const anio = new Date().getFullYear();

      const idFormateado = String(nuevoId).padStart(3, '0');
      const identificadorFinal = `${anio}${codigo_unico}${idFormateado}`;

      await grupoModel.actualizarIdentificador(nuevoId, identificadorFinal);

      return res.status(201).json({
        success: true,
        message: 'Grupo registrado y autogenerado correctamente.',
        data: { id_grupo: nuevoId, identificador: identificadorFinal, carrera_id, cuatrimestre_id: 1 }
      });

    } catch (error) {
      console.error('Error al crear grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al guardar grupo' });
    }
  },

  actualizarGrupo: async (req, res) => {
    const { id } = req.params;
    try {
      const { carrera_id } = req.body;
      const modificado_por = req.usuario ? req.usuario.id_usuario : null;

      const grupoExistente = await grupoModel.getGrupoById(id);
      if (!grupoExistente) return res.status(404).json({ message: 'Grupo no encontrado' });

      const datosActualizar = {
        identificador: grupoExistente.identificador,
        carrera_id,
        cuatrimestre_id: grupoExistente.cuatrimestre_id,
        modificado_por
      };

      await grupoModel.actualizarGrupo(id, datosActualizar);

      return res.status(200).json({ success: true, message: 'Grupo actualizado correctamente.' });
    } catch (error) {
      console.error('Error al actualizar grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al actualizar grupo' });
    }
  },

  cambiarEstatusGrupo: async (req, res) => {
    const { id } = req.params;
    const { estatus } = req.body; 
    try {
      const modificado_por = req.usuario ? req.usuario.id_usuario : null;
      await grupoModel.cambiarEstatus(id, estatus, modificado_por);
      return res.status(200).json({ success: true, message: `Estatus del grupo actualizado a ${estatus}.` });
    } catch (error) {
      console.error('Error al cambiar estatus del grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al cambiar estatus' });
    }
  }
};

module.exports = grupoController;