const materiaModel = require("../models/materiaModel");
const carreraModel = require("../models/carreraModel");

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

const generarCodigoMateria = async (nombreMateria, carreraId) => {

  const prefijoMateria = obtenerTresLetras(nombreMateria);

  const carrera = await carreraModel.getCarreraById(carreraId);

  if (!carrera) {
    throw new Error(`La carrera con id ${carreraId} no existe`);
  }

  const nombreCarrera = carrera.nombre_carrera || carrera.nombre || "";

  const prefijoCarrera = obtenerTresLetras(nombreCarrera);

  let codigo;
  let existe = true;

  while (existe) {

    const numeroRandom = Math.floor(100 + Math.random() * 900);

    codigo = `${prefijoMateria}-${prefijoCarrera}-${numeroRandom}`;

    existe = await materiaModel.verificarCodigoExistente(codigo);

  }

  return codigo;
};

/*
=========================
API SINCRONIZACION
=========================
*/

const getMateriasParaSincronizacion = async (req, res) => {

  try {

    const { carrera_id, cuatrimestre_id } = req.query;

    if (!carrera_id || !cuatrimestre_id) {
      return res.status(400).json({
        message: "Se requiere carrera_id y cuatrimestre_id"
      });
    }

    const materias = await materiaModel.getMateriasParaSincronizacion(
      carrera_id,
      cuatrimestre_id
    );

    res.status(200).json(materias);

  } catch (error) {

    console.error("Error sincronización materias:", error);

    res.status(500).json({
      message: "Error interno"
    });

  }

};

/*
=========================
CONSULTA GENERAL
=========================
*/

const getMaterias = async (req, res) => {

  try {

    const materias = await materiaModel.getAllMaterias();

    res.status(200).json(materias);

  } catch (error) {

    console.error("Error obteniendo materias:", error);

    res.status(500).json({
      error: "Error consultando materias"
    });

  }

};

/*
=========================
CREAR MATERIA
=========================
*/

const createMateria = async (req, res) => {

  try {

    const {
      nombre,
      creditos,
      cupo_maximo,
      tipo_asignatura,
      periodo_id,
      cuatrimestre_id,
      carrera_id
    } = req.body;

    if (!nombre || !carrera_id) {
      return res.status(400).json({
        error: "Nombre y carrera son obligatorios"
      });
    }

    const codigo_unico = await generarCodigoMateria(nombre, carrera_id);

    const nuevaMateria = {

      codigo_unico,
      nombre: nombre.toUpperCase().trim(),
      creditos,
      cupo_maximo,
      tipo_asignatura,
      periodo_id,
      cuatrimestre_id,
      carrera_id,
      creado_por: req.user?.id_usuario || null

    };
const resultado = await materiaModel.createMateria(nuevaMateria);

const insertId = resultado.insertId || resultado[0]?.insertId;

res.status(201).json({
  message: "Materia creada correctamente",
  id_materia: insertId,
  codigo_unico
});

  } catch (error) {

    console.error("Error creando materia:", error);

    res.status(500).json({
      error: error.message || "Error creando materia"
    });

  }

};

/*
=========================
ACTUALIZAR MATERIA
=========================
*/

const updateMateria = async (req, res) => {

  try {

    const usuario = req.user;

    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { id } = req.params;

    const {
      nombre,
      creditos,
      cupo_maximo,
      tipo_asignatura,
      periodo_id,
      cuatrimestre_id,
      carrera_id
    } = req.body;

    const modificado_por = usuario.id_usuario;

    // Obtener materia actual
    const materiaActual = await materiaModel.getMateriaById(id);

    if (!materiaActual) {
      return res.status(404).json({
        error: "Materia no encontrada"
      });
    }

    /*
    =========================
    VALIDAR CUATRIMESTRE ACTIVO
    =========================
    */

    const cuatrimestreActivo = await materiaModel.getCuatrimestreActivo(
      materiaActual.cuatrimestre_id
    );

    if (cuatrimestreActivo) {

      return res.status(409).json({
        error: "No se puede modificar la materia porque el cuatrimestre está activo"
      });

    }

    /*
    =========================
    VALIDAR PERMISOS
    =========================
    */

    if (usuario.id_rol !== 1 && usuario.id_rol !== 2) {

      if (usuario.id_rol !== 3) {
        return res.status(403).json({
          error: "No tienes permisos para modificar materias"
        });
      }

      const academia = await materiaModel.getAcademiaDeMateria(id);

      if (!academia || academia.usuario_id !== usuario.id_usuario) {

        return res.status(403).json({
          error: "No eres el coordinador de la academia de esta materia"
        });

      }

    }

    /*
    =========================
    VALIDAR DUPLICADOS
    =========================
    */

    const existeDuplicado = await materiaModel.verificarMateriaDuplicada(
      nombre.toUpperCase().trim(),
      tipo_asignatura,
      carrera_id,
      id
    );

    if (existeDuplicado) {

      return res.status(409).json({
        error: "Ya existe una materia con el mismo nombre y tipo en esta carrera"
      });

    }

    /*
    =========================
    REGENERAR CODIGO
    =========================
    */

    let codigo_unico = materiaActual.codigo_unico;

    if (
      nombre !== materiaActual.nombre ||
      carrera_id !== materiaActual.carrera_id
    ) {

      codigo_unico = await generarCodigoMateria(nombre, carrera_id);

    }

    /*
    =========================
    ACTUALIZAR
    =========================
    */

    await materiaModel.updateMateria(id, {

      codigo_unico,
      nombre: nombre.toUpperCase().trim(),
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

    console.error("Error actualizando materia:", error);

    res.status(500).json({
      error: "Error actualizando materia"
    });

  }

};

/*
=========================
BORRADO FISICO
=========================
*/

const deleteMateria = async (req, res) => {

  try {

    const { id } = req.params;

    const materia = await materiaModel.getMateriaById(id);

    if (!materia) {
      return res.status(404).json({
        error: "Materia no encontrada"
      });
    }

    const cuatrimestreActivo = await materiaModel.getCuatrimestreActivo(
      materia.cuatrimestre_id
    );

    if (cuatrimestreActivo) {

      return res.status(409).json({
        error: "No se puede eliminar la materia porque el cuatrimestre está activo"
      });

    }

    const usado = await materiaModel.checkMateriaUsage(id);

    if (usado > 0) {

      return res.status(409).json({
        error:
          "No se puede eliminar la materia porque tiene registros históricos vinculados; se recomienda la baja lógica"
      });

    }

    await materiaModel.deleteMateriaFisica(id);

    res.status(200).json({
      message: "Materia eliminada"
    });

  } catch (error) {

    console.error("Error eliminando materia:", error);

    res.status(500).json({
      error: "Error eliminando materia"
    });

  }

};

/*
=========================
BAJA LOGICA
=========================
*/

const toggleMateria = async (req, res) => {

  try {

    const { id } = req.params;

    const usuario = req.user?.id_usuario;

    await materiaModel.toggleMateriaStatus(id, usuario);

    res.status(200).json({
      message: "Estatus actualizado"
    });

  } catch (error) {

    console.error("Error cambiando estatus:", error);

    res.status(500).json({
      error: "Error cambiando estatus"
    });

  }

};

module.exports = {

  getMateriasParaSincronizacion,
  getMaterias,
  createMateria,
  updateMateria,
  deleteMateria,
  toggleMateria

};