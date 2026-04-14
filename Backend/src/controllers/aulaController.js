const pool = require('../config/database');

// ─── VALIDACIÓN DE INTEGRIDAD PARA EDICIÓN Y BAJA LOGICA ──────────────────
// Regla de negocio: restringe mutaciones en tipo y ubicación o la desactivación
// física/lógica si el aula se encuentra vinculada a una asignación docente.
const verificarDependenciasAula = async (id_aula) => {
  const query = `
    SELECT COUNT(DISTINCT rep.min_id) AS dependencias_activas
    FROM Aulas au
    INNER JOIN Asignaciones a ON au.id_aula = a.aula_id
    INNER JOIN Periodos p ON a.periodo_id = p.id_periodo
    INNER JOIN (
      SELECT 
        MIN(id_asignacion) AS min_id,
        grupo_id, materia_id, docente_id, periodo_id, aula_id
      FROM Asignaciones
      GROUP BY grupo_id, materia_id, docente_id, periodo_id, aula_id
    ) rep ON a.grupo_id <=> rep.grupo_id 
         AND a.materia_id = rep.materia_id 
         AND a.docente_id = rep.docente_id 
         AND a.periodo_id = rep.periodo_id 
         AND a.aula_id = rep.aula_id
    WHERE au.id_aula = ? 
      AND au.estatus = 'ACTIVO'
      AND a.estatus_acta = 'ABIERTA'
      AND a.estatus_confirmacion = 'ACEPTADA'
      AND p.estatus = 'ACTIVO'
  `;
  const resultado = await pool.query(query, [id_aula]);
  return resultado[0].dependencias_activas > 0;
};

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
    // 1. recuperar el estado actual para validación referencial
    const aulaActual = await pool.query(
      'SELECT tipo, ubicacion FROM Aulas WHERE id_aula = ?',
      [id]
    );
    if (aulaActual.length === 0) return res.status(404).json({ message: "Aula no encontrada." });

    // 2. detectar intentos de mutación en atributos estructurales
    const intentoCambioEstructural = 
      (tipo !== undefined && tipo !== aulaActual[0].tipo) ||
      (ubicacion !== undefined && ubicacion !== aulaActual[0].ubicacion);

    if (intentoCambioEstructural) {
      const tieneAsignaciones = await verificarDependenciasAula(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          action: "BLOCK",
          error: "Conflicto de integridad relacional",
          detalles: "No es posible modificar el tipo ni la ubicación de este espacio porque ya cuenta con clases asignadas. Debe reubicar las clases previamente en el módulo de asignaciones."
        });
      }
    }

    // 3. validación normal de duplicidad
    const existente = await pool.query(
      'SELECT id_aula FROM Aulas WHERE nombre_codigo = ? AND id_aula != ?',
      [nombre, id]
    );
    if (existente.length > 0) {
      return res.status(409).json({ message: "Ya existe otra aula/laboratorio con ese nombre." });
    }

    // 4. ejecución de actualización
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
    // validación de integridad referencial antes del borrado lógico
    const tieneAsignaciones = await verificarDependenciasAula(id);
    if (tieneAsignaciones) {
      return res.status(409).json({
        action: "BLOCK",
        error: "Conflicto de integridad relacional",
        detalles: "No es posible desactivar esta aula porque cuenta con clases asignadas actualmente. Debe reubicar o cancelar estas clases antes de proceder."
      });
    }

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