const grupoModel = require('../models/grupoModel');

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
      const { identificador, carrera_id, cuatrimestre_id } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : null; 

      const identificadorMayusculas = identificador.toUpperCase();

      const existe = await grupoModel.validarExistencia(identificadorMayusculas, carrera_id);
      if (existe) {
        return res.status(400).json({
          success: false,
          errores: [{ path: 'identificador', msg: 'Este identificador ya está registrado en la carrera seleccionada.' }]
        });
      }

      const datosNuevoGrupo = {
        identificador: identificadorMayusculas, 
        carrera_id,
        cuatrimestre_id,
        creado_por
      };

      const resultado = await grupoModel.crearGrupo(datosNuevoGrupo);

      return res.status(201).json({
        success: true,
        message: 'Grupo registrado correctamente.',
        data: { id_grupo: Number(resultado.insertId), ...datosNuevoGrupo }
      });

    } catch (error) {
      console.error('Error al crear grupo:', error);
      return res.status(500).json({ success: false, message: 'Error en el servidor al guardar grupo' });
    }
  },

  actualizarGrupo: async (req, res) => {
    const { id } = req.params;
    try {
      const { identificador, carrera_id, cuatrimestre_id } = req.body;
      const modificado_por = req.usuario ? req.usuario.id_usuario : null;
      const identificadorMayusculas = identificador.toUpperCase();

      const existe = await grupoModel.validarExistencia(identificadorMayusculas, carrera_id, id);
      if (existe) {
        return res.status(400).json({
          success: false,
          errores: [{ path: 'identificador', msg: 'Este identificador ya está registrado en la carrera seleccionada.' }]
        });
      }

      const datosActualizar = {
        identificador: identificadorMayusculas,
        carrera_id,
        cuatrimestre_id,
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