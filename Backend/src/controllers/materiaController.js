const materiaModel = require("../models/materiaModel");

const getMaterias = async (req, res) => {
  try {
    const materias = await materiaModel.getAllMaterias();
    res.status(200).json(materias);
  } catch (error) {
    console.error("[Error getMaterias]:", error);
    res.status(500).json({ error: "Error al consultar materias." });
  }
};

const createMateria = async (req, res) => {
  try {
    // extraemos el codigo_unico que ahora viene desde el frontend
    const {
      codigo_unico,
      nombre,
      creditos,
      cupo_maximo,
      tipo_asignatura,
      periodo_id,
      cuatrimestre_id,
      carrera_id
    } = req.body;

    const creado_por = req.user.id_usuario;

    const result = await materiaModel.createMateria({
      codigo_unico,
      nombre,
      creditos,
      cupo_maximo,
      tipo_asignatura,
      periodo_id,
      cuatrimestre_id,
      carrera_id,
      creado_por
    });

    res.status(201).json({
      message: "Materia creada correctamente",
      id_materia: result.id,
      codigo_unico: result.codigo_unico
    });

  } catch (error) {
    console.error("[Error createMateria]:", error);
    
    // intercepción de violación de restricción UNIQUE en MariaDB
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: "El código único ingresado ya existe y está asignado a otra materia." 
      });
    }
    
    res.status(500).json({ error: "Error al crear la materia." });
  }
};

const updateMateria = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      codigo_unico,
      nombre,
      creditos,
      cupo_maximo,
      tipo_asignatura,
      periodo_id,
      cuatrimestre_id,
      carrera_id
    } = req.body;

    const modificado_por = req.user.id_usuario;

    await materiaModel.updateMateria(id, {
      codigo_unico,
      nombre,
      creditos,
      cupo_maximo,
      tipo_asignatura,
      periodo_id,
      cuatrimestre_id,
      carrera_id,
      modificado_por
    });

    res.status(200).json({
      message: "Materia actualizada correctamente"
    });

  } catch (error) {
    console.error("[Error updateMateria]:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: "El código único ingresado ya existe y está asignado a otra materia." 
      });
    }

    res.status(500).json({ error: "Error al actualizar la materia." });
  }
};

const deleteMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const usado = await materiaModel.checkMateriaUsage(id);

    // validación de integridad referencial antes del borrado físico
    if (usado > 0) {
      return res.status(409).json({
        error: "No se puede eliminar la materia porque tiene registros históricos vinculados; se recomienda la baja lógica."
      });
    }

    await materiaModel.deleteMateriaFisica(id);

    res.status(200).json({
      message: "Materia eliminada físicamente"
    });

  } catch (error) {
    console.error("[Error deleteMateria]:", error);
    res.status(500).json({ error: "Error eliminando materia." });
  }
};

const toggleMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.user.id_usuario;

    await materiaModel.toggleMateriaStatus(id, usuario);

    res.status(200).json({
      message: "Estatus de materia actualizado"
    });

  } catch (error) {
    console.error("[Error toggleMateria]:", error);
    res.status(500).json({ error: "Error cambiando estatus." });
  }
};

module.exports = {
  getMaterias,
  createMateria,
  updateMateria,
  deleteMateria,
  toggleMateria
};