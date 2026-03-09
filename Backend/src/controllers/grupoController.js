const grupoModel = require('../models/grupoModel');

const grupoController = {
  // 1. Obtener todos los grupos para la tabla
  getGrupos: async (req, res) => {
    try {
      const grupos = await grupoModel.getAllGrupos();
      return res.status(200).json(grupos);
    } catch (error) {
      console.error('Error al obtener grupos:', error);
      return res.status(500).json({ success: false, message: 'Error al obtener grupos' });
    }
  },

  // 2. Crear grupo y autogenerar identificador
  crearGrupo: async (req, res) => {
    try {
      const { carrera_id } = req.body;
      const creado_por = req.usuario ? req.usuario.id_usuario : null;

      // Insertar con cuatrimestre 1 y un identificador temporal
      const datosNuevoGrupo = {
        identificador: 'TEMP',
        carrera_id,
        cuatrimestre_id: 1, 
        creado_por
      };

      const resultado = await grupoModel.crearGrupo(datosNuevoGrupo);
      const nuevoId = resultado.insertId;

      // Obtener las siglas de la carrera y el año actual
      const siglas = await grupoModel.getCarreraSiglas(carrera_id);
      const anio = new Date().getFullYear();

      // Construir el identificador final (Ej. 2026123SIS)
      const identificadorFinal = `${anio}${nuevoId}${siglas}`;

      // Actualizar el registro con el identificador final
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

  // 3. Actualizar grupo existente (solo se cambia la carrera)
  actualizarGrupo: async (req, res) => {
    const { id } = req.params;
    try {
      const { carrera_id } = req.body;
      const modificado_por = req.usuario ? req.usuario.id_usuario : null;

      // Recuperamos los datos actuales para no borrar el identificador ni el cuatrimestre
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

  // 4. Cambiar el estatus (Activo/Inactivo)
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