const pool = require('../config/database');
const registrarAula = async (req, res) => {
  const { nombre, tipo, capacidad, ubicacion, creado_por } = req.body;

  try {
    // SIN CORCHETES: guardamos el arreglo completo
    const existente = await pool.query(
      'SELECT id_aula FROM Aulas WHERE nombre_codigo = ?', 
      [nombre]
    );

    if (existente.length > 0) {
      return res.status(409).json({ message: "Ya existe un aula o laboratorio con ese nombre." });
    }

    const query = `
      INSERT INTO Aulas (nombre_codigo, tipo, capacidad, ubicacion, estatus, creado_por, fecha_creacion) 
      VALUES (?, ?, ?, ?, 'ACTIVO', ?, NOW())
    `;

    // SIN CORCHETES
    const resultado = await pool.query(query, [nombre, tipo, capacidad, ubicacion, creado_por]);

    res.status(201).json({ 
      message: "Espacio académico registrado con éxito.",
      id_aula: resultado.insertId 
    });

  } catch (error) {
    console.error("Error al registrar aula:", error);
    res.status(500).json({ message: "Error interno del servidor al crear el espacio." });
  }
};
const consultarAulas = async (req, res) => {
  try {
    const query = `
      SELECT 
        id_aula, 
        nombre_codigo, 
        tipo, 
        capacidad, 
        ubicacion, 
        estatus 
      FROM Aulas
      ORDER BY nombre_codigo ASC
    `;

    // SIN CORCHETES
    const resultados = await pool.query(query);

    res.status(200).json(resultados);
    
  } catch (error) {
    console.error("Error al consultar el catálogo de aulas:", error);
    res.status(500).json({ message: "Error interno al obtener las aulas." });
  }
};
const actualizarAula = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, capacidad, ubicacion, estatus, modificado_por } = req.body;

  try {
    const existente = await pool.query(
      'SELECT id_aula FROM Aulas WHERE nombre_codigo = ? AND id_aula != ?', 
      [nombre, id]
    );

    if (existente.length > 0) {
      return res.status(409).json({ message: "Ya existe otra aula/laboratorio con ese nombre." });
    }

    const query = `
      UPDATE Aulas 
      SET 
        nombre_codigo = ?, 
        tipo = ?, 
        capacidad = ?, 
        ubicacion = ?, 
        estatus = ?,
        modificado_por = ?,
        fecha_modificacion = NOW()
      WHERE id_aula = ?
    `;

    const resultado = await pool.query(query, [nombre, tipo, capacidad, ubicacion, estatus, modificado_por, id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: "Aula no encontrada." });
    }

    res.json({ message: "Actualizado con éxito." });
  } catch (error) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const desactivarAula = async (req, res) => {
  const { id } = req.params;
  const { eliminado_por } = req.body; 

  try {
    const query = `
      UPDATE Aulas 
      SET 
        estatus = 'INACTIVO', 
        eliminado_por = ?, 
        fecha_eliminacion = NOW() 
      WHERE id_aula = ?
    `;

    const resultado = await pool.query(query, [eliminado_por, id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: "Aula o laboratorio no encontrado." });
    }

    res.json({ message: "Espacio académico desactivado con éxito." });
  } catch (error) {
    console.error("Error al desactivar aula:", error);
    res.status(500).json({ message: "Error interno al procesar la baja del espacio." });
  }
};

module.exports = { registrarAula, consultarAulas, actualizarAula, desactivarAula};