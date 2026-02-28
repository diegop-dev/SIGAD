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
    const {
      codigo_unico,
      nombre,
      creditos,
      cuatrimestre,
      tipo_asignatura,
      carrera_id,
    } = req.body;

    const creado_por = req.user.id_usuario; // 🔥 viene del token

    const existing = await materiaModel.findByCodigo(codigo_unico);
    if (existing) {
      return res.status(409).json({
        error: "Ya existe una materia con ese código único.",
      });
    }

    const newId = await materiaModel.createMateria({
      codigo_unico,
      nombre,
      creditos,
      cuatrimestre,
      tipo_asignatura,
      carrera_id,
      creado_por
    });

    res.status(201).json({
      message: "Materia creada correctamente",
      id_materia: newId,
    });
  } catch (error) {
    console.error("[Error createMateria]:", error);
    res.status(500).json({ error: "Error al crear la materia." });
  }
};

const updateMateria = async (req, res) => {
  try {
    const { id } = req.params;
    await materiaModel.updateMateria(id, req.body);
    res.status(200).json({ message: "Materia actualizada correctamente" });
  } catch (error) {
    console.error("[Error updateMateria]:", error);
    res.status(500).json({ error: "Error al actualizar la materia." });
  }
};

const deleteMateria = async (req, res) => {
  try {
    const { id } = req.params;
    await materiaModel.deleteMateria(id);
    res.status(200).json({ message: "Materia dada de baja correctamente" });
  } catch (error) {
    console.error("[Error deleteMateria]:", error);
    res.status(500).json({ error: "Error al eliminar la materia." });
  }
};

module.exports = {
  getMaterias,
  createMateria,
  updateMateria,
  deleteMateria,
};