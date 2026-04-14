const materiaModel = require("../models/materiaModel");
const carreraModel = require("../models/carreraModel");
const assignmentModel = require('../models/assignmentModel');

/*
=========================
UTILIDADES PARA CODIGO
=========================
*/

const limpiarTexto = (texto) =>
  texto
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z\s]/g, "");

const obtenerTresLetras = (texto) => {
  const palabrasIgnoradas = ["DE", "LA", "DEL", "Y", "EN", "EL", "LOS", "LAS"];
  const palabras = limpiarTexto(texto)
    .split(/\s+/)
    .filter((p) => p && !palabrasIgnoradas.includes(p));
  if (palabras.length === 0) return "GEN";
  if (palabras.length === 1) return palabras[0].substring(0, 3);
  return palabras.map((p) => p[0]).join("").substring(0, 3);
};

const generarCodigoMateria = async (nombreMateria, carreraId, nivelAcademico = 'LICENCIATURA') => {
  const prefijoMateria = obtenerTresLetras(nombreMateria);
  let prefijoCarrera = "GEN";
  if (carreraId) {
    const carrera = await carreraModel.obtenerCarreraPorId(carreraId);
    if (carrera) {
      const nombreCarrera = carrera.nombre_carrera || carrera.nombre || "";
      prefijoCarrera = obtenerTresLetras(nombreCarrera);
    }
  }
  const sufijoNivel = nivelAcademico.toUpperCase() === 'MAESTRIA' ? 'M' : 'L';
  let codigo;
  let existe = true;
  while (existe) {
    const numeroRandom = Math.floor(100 + Math.random() * 900);
    codigo = `${prefijoMateria}-${prefijoCarrera}-${sufijoNivel}${numeroRandom}`;
    existe = await materiaModel.verificarCodigoExistente(codigo);
  }
  return codigo;
};

/*
=========================
API SINCRONIZACION
=========================
*/

const obtenerMateriasParaSincronizacion = async (req, res) => {
  try {
    const { carrera_id, cuatrimestre_id } = req.query;
    if (!carrera_id || !cuatrimestre_id) {
      return res.status(400).json({ message: "Se requiere carrera_id y cuatrimestre_id" });
    }
    const materias = await materiaModel.obtenerMateriasParaSincronizacion(carrera_id, cuatrimestre_id);
    res.status(200).json(materias);
  } catch (error) {
    console.error("Error sincronización materias:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

/*
=========================
CONSULTA GENERAL
=========================
*/

const obtenerMaterias = async (req, res) => {
  try {
    const materias = await materiaModel.obtenerTodasLasMaterias();
    res.status(200).json(materias);
  } catch (error) {
    console.error("Error obteniendo materias:", error);
    res.status(500).json({ error: "Error consultando materias" });
  }
};

/*
=========================
CREAR MATERIA
=========================
*/

const crearMateria = async (req, res) => {
  try {
    const {
      nombre, creditos, cupo_maximo, tipo_asignatura,
      nivel_academico, periodo_id, cuatrimestre_id, carrera_id
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: "El nombre de la materia es obligatorio" });
    }

    const nivelSeguro   = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';
    const nombreLimpio  = nombre.toUpperCase().trim();
    const carreraSegura = (tipo_asignatura === "TRONCO_COMUN") ? null : carrera_id;

    const existeDuplicado = await materiaModel.verificarMateriaDuplicada(
      nombreLimpio, carreraSegura, nivelSeguro
    );
    if (existeDuplicado) {
      return res.status(409).json({
        error: "Ya existe una materia con este nombre registrada en este nivel académico para esta carrera."
      });
    }

    const codigo_unico = await generarCodigoMateria(nombreLimpio, carreraSegura, nivelSeguro);
    const nuevaMateria = {
      codigo_unico, nombre: nombreLimpio, creditos, cupo_maximo,
      tipo_asignatura, nivel_academico: nivelSeguro,
      periodo_id, cuatrimestre_id, carrera_id: carreraSegura,
      creado_por: req.user?.id_usuario || null
    };

    const resultado = await materiaModel.crearMateria(nuevaMateria);
    const insertId  = resultado.insertId || resultado[0]?.insertId;

    res.status(201).json({ message: "Materia creada correctamente", id_materia: insertId, codigo_unico });
  } catch (error) {
    console.error("Error creando materia:", error);
    res.status(500).json({ error: error.message || "Error creando materia" });
  }
};

/*
=========================
ACTUALIZAR MATERIA
=========================
*/

const actualizarMateria = async (req, res) => {
  try {
    const usuario = req.user;
    if (!usuario) return res.status(401).json({ error: "Usuario no autenticado" });

    const { id } = req.params;
    const {
      nombre, creditos, cupo_maximo, tipo_asignatura,
      nivel_academico, periodo_id, cuatrimestre_id, carrera_id,
      confirmar_rechazo 
    } = req.body;

    const modificado_por = usuario.id_usuario;
    const materiaActual  = await materiaModel.obtenerMateriaPorId(id);
    if (!materiaActual) return res.status(404).json({ error: "Materia no encontrada" });

    const cuatrimestreActivo = await materiaModel.obtenerCuatrimestreActivo(materiaActual.cuatrimestre_id);
    if (cuatrimestreActivo) {
      return res.status(409).json({ error: "No se puede modificar la materia porque el cuatrimestre está activo" });
    }

    if (usuario.id_rol !== 1 && usuario.id_rol !== 2) {
      if (usuario.id_rol !== 3) {
        return res.status(403).json({ error: "No tienes permisos para modificar materias" });
      }
      const academia = await materiaModel.obtenerAcademiaDeMateria(id);
      if (!academia || academia.usuario_id !== usuario.id_usuario) {
        return res.status(403).json({ error: "No eres el coordinador de la academia de esta materia" });
      }
    }

    const nivelSeguro   = nivel_academico ? nivel_academico.toUpperCase() : 'LICENCIATURA';
    const nombreLimpio  = nombre.toUpperCase().trim();
    const carreraSegura = (tipo_asignatura === "TRONCO_COMUN") ? null : carrera_id;

    // Validación de integridad referencial
    const intentoCambioEstructural = 
      (nivelSeguro !== materiaActual.nivel_academico) ||
      (tipo_asignatura !== undefined && tipo_asignatura !== materiaActual.tipo_asignatura) ||
      (carreraSegura !== materiaActual.carrera_id) ||
      (periodo_id !== undefined && Number(periodo_id) !== Number(materiaActual.periodo_id)) ||
      (cuatrimestre_id !== undefined && Number(cuatrimestre_id) !== Number(materiaActual.cuatrimestre_id));

    if (intentoCambioEstructural) {
      const tieneAceptadas = await materiaModel.verificarDependenciasActivas(id);
      if (tieneAceptadas) {
        return res.status(409).json({
          action: "BLOCK",
          error: "Conflicto de integridad relacional",
          detalles: "No es posible modificar la estructura de esta materia porque ya cuenta con clases ACEPTADAS. Debe reasignar o cancelar estas clases previamente."
        });
      }

      // Lógica de Advertencia y Rechazo Automático
      const asignaciones = await assignmentModel.obtenerTodasLasAsignaciones({ materia_id: id });
      const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

      if (tieneEnviadas && !confirmar_rechazo) {
        return res.status(409).json({
          action: "WARN",
          error: "Advertencia de asignaciones pendientes",
          detalles: "Esta materia tiene asignaciones ENVIADAS a docentes. Modificarla rechazará automáticamente estas clases. ¿Deseas continuar?"
        });
      }
      if (tieneEnviadas && confirmar_rechazo) {
        await assignmentModel.rechazarAsignacionesPorMateria(id, modificado_por);
      }
    }

    const existeDuplicado = await materiaModel.verificarMateriaDuplicada(
      nombreLimpio, carreraSegura, nivelSeguro, id
    );
    if (existeDuplicado) {
      return res.status(409).json({
        error: "Ya existe una materia con este nombre registrada en este nivel académico para esta carrera."
      });
    }

    let codigo_unico = materiaActual.codigo_unico;
    if (
      nombreLimpio !== materiaActual.nombre ||
      carreraSegura !== materiaActual.carrera_id ||
      nivelSeguro !== materiaActual.nivel_academico
    ) {
      codigo_unico = await generarCodigoMateria(nombreLimpio, carreraSegura, nivelSeguro);
    }

    await materiaModel.actualizarMateria(id, {
      codigo_unico, nombre: nombreLimpio, creditos, cupo_maximo,
      tipo_asignatura, nivel_academico: nivelSeguro,
      periodo_id, cuatrimestre_id, carrera_id: carreraSegura, modificado_por
    });

    res.status(200).json({ message: "Materia actualizada correctamente" });
  } catch (error) {
    console.error("Error actualizando materia:", error);
    res.status(500).json({ error: "Error actualizando materia" });
  }
};

/*
=========================
BAJA LOGICA
=========================
*/

const desactivarMateria = async (req, res) => {
  try {
    const { id }    = req.params;
    const usuario   = req.user?.id_usuario;
    const { confirmar_rechazo } = req.body || {}; // Evitamos error si el body viene vacío

    const materiaActual = await materiaModel.obtenerMateriaPorId(id);
    if (!materiaActual) return res.status(404).json({ error: "Materia no encontrada" });

    if (materiaActual.estatus === 'ACTIVO') {
      const tieneAceptadas = await materiaModel.verificarDependenciasActivas(id);
      if (tieneAceptadas) {
        return res.status(409).json({
          action: "BLOCK",
          error: "Conflicto de integridad relacional",
          detalles: "No es posible desactivar esta materia porque cuenta con clases ACEPTADAS vigentes. Debe liberar la carga horaria primero."
        });
      }

      const asignaciones = await assignmentModel.obtenerTodasLasAsignaciones({ materia_id: id });
      const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

      if (tieneEnviadas && !confirmar_rechazo) {
        return res.status(409).json({
          action: "WARN",
          error: "Advertencia de asignaciones pendientes",
          detalles: "Darlo de baja rechazará automáticamente las asignaciones ENVIADAS vinculadas a esta materia. ¿Deseas continuar?"
        });
      }
      if (tieneEnviadas && confirmar_rechazo) {
        await assignmentModel.rechazarAsignacionesPorMateria(id, usuario);
      }
    }

    await materiaModel.desactivarMateria(id, usuario);
    res.status(200).json({ message: "Materia desactivada correctamente" });
  } catch (error) {
    console.error("Error desactivando materia:", error);
    res.status(500).json({ error: "Error interno desactivando materia" });
  }
};

const reactivarMateria = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = req.user?.id_usuario;

    const materiaActual = await materiaModel.obtenerMateriaPorId(id);
    if (!materiaActual) return res.status(404).json({ error: "Materia no encontrada" });

    await materiaModel.reactivarMateria(id, usuario);
    res.status(200).json({ message: "Materia reactivada correctamente" });
  } catch (error) {
    console.error("Error reactivando materia:", error);
    res.status(500).json({ error: "Error interno reactivando materia" });
  }
};

// ─── EP-04 SESA: GET /materias/catalogo ───────────────────────────────────────────────
// Acepta filtros opcionales: id_programa_academico, cuatrimestre_id, tipo_asignatura.
// El filtro de periodo activo y estatus = ACTIVO lo aplica el model implícitamente.
const ObtenerMaterias = async (req, res) => {
  try {
    const { id_programa_academico, cuatrimestre_id, tipo_asignatura } = req.query;

    const materias = await materiaModel.ObtenerMaterias({
      id_programa_academico: id_programa_academico || null,
      cuatrimestre_id:       cuatrimestre_id       || null,
      tipo_asignatura:       tipo_asignatura        || null,
    });

    res.status(200).json(materias);
  } catch (error) {
    console.error("[Error ObtenerMaterias]:", error);
    res.status(500).json({ error: "Error al consultar las materias" });
  }
};
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  obtenerMateriasParaSincronizacion,
  obtenerMaterias,
  crearMateria,
  actualizarMateria,
  desactivarMateria,
  reactivarMateria,
  ObtenerMaterias, 
};