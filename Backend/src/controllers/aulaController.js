const pool = require('../config/database');

const registrarAula = async (req, res) => {
  const { nombre, tipo, capacidad, ubicacion, creado_por } = req.body;
  try {
    const existente = await pool.query(
      'SELECT id_aula FROM Aulas WHERE nombre_codigo = ?',
      [nombre]
    );
    if (existente.length > 0) {
      return res.status(409).json({ message: "Ya existe un aula o laboratorio con ese nombre." });
    }
    const resultado = await pool.query(
      `INSERT INTO Aulas (nombre_codigo, tipo, capacidad, ubicacion, estatus, creado_por, fecha_creacion) 
       VALUES (?, ?, ?, ?, 'ACTIVO', ?, NOW())`,
      [nombre, tipo, capacidad, ubicacion, creado_por]
    );
    logAudit({ modulo: 'AULAS', accion: 'CREACION', registro_afectado: nombre, detalle: `Tipo: ${tipo}`, usuario_id: creado_por, ip_address: getClientIp(req) });
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
    const resultados = await pool.query(`
      SELECT id_aula, nombre_codigo, tipo, capacidad, ubicacion, estatus 
      FROM Aulas
      ORDER BY nombre_codigo ASC
    `);
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
    const resultado = await pool.query(
      `UPDATE Aulas 
       SET nombre_codigo = ?, tipo = ?, capacidad = ?, ubicacion = ?, estatus = ?,
           modificado_por = ?, fecha_modificacion = NOW()
       WHERE id_aula = ?`,
      [nombre, tipo, capacidad, ubicacion, estatus, modificado_por, id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Aula no encontrada." });
    logAudit({ modulo: 'AULAS', accion: 'MODIFICACION', registro_afectado: `Aula #${id} — ${nombre}`, detalle: null, usuario_id: modificado_por, ip_address: getClientIp(req) });
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
    const resultado = await pool.query(
      `UPDATE Aulas SET estatus = 'INACTIVO', eliminado_por = ?, fecha_eliminacion = NOW() WHERE id_aula = ?`,
      [eliminado_por, id]
    );
    if (resultado.affectedRows === 0) return res.status(404).json({ message: "Aula o laboratorio no encontrado." });
    logAudit({ modulo: 'AULAS', accion: 'BAJA', registro_afectado: `Aula #${id}`, detalle: null, usuario_id: eliminado_por, ip_address: getClientIp(req) });
    res.json({ message: "Espacio académico desactivado con éxito." });
  } catch (error) {
    console.error("Error al desactivar aula:", error);
    res.status(500).json({ message: "Error interno al procesar la baja del espacio." });
  }
};

// ─── EP-09 SESA: GET /aulas/catalogo ───────────────────────────────────────────────────
// Devuelve aulas activas con los 4 campos que SESA necesita.
const ObtenerAulas = async (req, res) => {
  try {
    const aulas = await pool.query(`
      SELECT
        id_aula,
        nombre_codigo,
        capacidad,
        tipo
      FROM Aulas
      WHERE estatus = 'ACTIVO'
      ORDER BY nombre_codigo ASC
    `);
    res.status(200).json(aulas);
  } catch (error) {
    console.error("[Error ObtenerAulas]:", error);
    res.status(500).json({ error: "Error al consultar las aulas" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = { registrarAula, consultarAulas, actualizarAula, desactivarAula, ObtenerAulas };