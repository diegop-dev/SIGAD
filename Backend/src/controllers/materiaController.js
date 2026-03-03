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
      nombre,
      creditos,
      cuatrimestre,
      tipo_asignatura,
      carrera_id,
    } = req.body;

    const creado_por = req.user.id_usuario;

    const result = await materiaModel.createMateria({
      nombre,
      creditos,
      cuatrimestre,
      tipo_asignatura,
      carrera_id,
      creado_por,
    });

    res.status(201).json({
      message: "Materia creada correctamente",
      id_materia: result.id,
      codigo_unico: result.codigo_unico,
    });

  } catch (error) {
    console.error("[Error createMateria]:", error);
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
      cuatrimestre,
      tipo_asignatura,
      carrera_id,
    } = req.body;

    const existing = await materiaModel.findByCodigoExcludingId(
      codigo_unico,
      id
    );

    if (existing) {
      return res.status(409).json({
        error: "Ya existe otra materia con ese código único.",
      });
    }

    await materiaModel.updateMateria(id, {
      nombre,
      creditos,
      cuatrimestre,
      tipo_asignatura,
      carrera_id,
    });

    res.status(200).json({
      message: "Materia actualizada correctamente",
    });
  } catch (error) {
    console.error("[Error updateMateria]:", error);
    res.status(500).json({ error: "Error al actualizar la materia." });
  }
};

const deleteMateria = async (req, res) => {
  try {
    const { id } = req.params;

    await materiaModel.deleteMateria(id);

    res.status(200).json({
      message: "Materia dada de baja correctamente",
    });
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