const docenteModel = require("../models/docenteModel");

const getUsuariosDisponibles = async (req, res) => {
  try {
    const usuarios = await docenteModel.getUsuariosDisponibles();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener usuarios disponibles." });
  }
};

const getDocentes = async (req, res) => {
  try {
    const docentes = await docenteModel.getAllDocentes();
    res.status(200).json(docentes);
  } catch (error) {
    res.status(500).json({ error: "Error al consultar el listado." });
  }
};

const registerDocente = async (req, res) => {
  try {
    const {
      usuario_id, rfc, curp, celular, calle, numero, colonia, cp,
      clave_ine, fecha_ingreso, nivel_academico, creado_por, academia_id 
    } = req.body;

    if (!usuario_id || !rfc || !curp || !celular || !calle || !numero || !colonia || !cp ||
        !clave_ine || !fecha_ingreso || !nivel_academico || !creado_por || !academia_id) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    const existingDocente = await docenteModel.verifyDuplicates(rfc, curp);
    if (existingDocente) {
      return res.status(409).json({ error: "El RFC o CURP ya están registrados." });
    }

    const documentos = [];
    if (req.files?.titulo) documentos.push({ tipo: 'TITULO', url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula) documentos.push({ tipo: 'CEDULA', url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat) documentos.push({ tipo: 'CONSTANCIA_FISCAL', url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine) documentos.push({ tipo: 'INE', url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv) documentos.push({ tipo: 'CV', url: `/uploads/docentes/${req.files.cv[0].filename}` });

    if (documentos.length < 6) return res.status(400).json({ error: "Se requieren los 6 archivos PDF." });

    const ultimaMatricula = await docenteModel.getLastMatricula();
    let matricula = "00000001"; 
    
    if (ultimaMatricula) {
      const numeroActual = parseInt(ultimaMatricula, 10);
      matricula = String(numeroActual + 1).padStart(8, "0");
    }

    const domicilio_completo = `${calle} Num. ${numero}, Col. ${colonia}, C.P. ${cp}`;

    await docenteModel.createDocente({
      usuario_id, creado_por, matricula, rfc, curp, clave_ine,
      domicilio: domicilio_completo, celular, nivel_academico, 
      antiguedad_fecha: fecha_ingreso, documentos,
      academia_id
    });

    res.status(201).json({ message: "Éxito", matricula_generada: matricula });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

// NUEVA FUNCIÓN PARA ACTUALIZAR
const updateDocente = async (req, res) => {
  try {
    const { id } = req.params; // Obtenemos el ID del docente desde la URL
    const {
      rfc, curp, celular, calle, numero, colonia, cp,
      clave_ine, nivel_academico, academia_id, modificado_por 
    } = req.body;

    // Opcional: Validar que no falten datos clave
    if (!rfc || !curp || !celular || !clave_ine || !nivel_academico || !academia_id) {
      return res.status(400).json({ error: "Faltan datos obligatorios para actualizar." });
    }

    // Reconstruimos el domicilio solo si nos enviaron los campos (por si cambiaron de dirección)
    let domicilio_completo = null;
    if (calle && numero && colonia && cp) {
      domicilio_completo = `${calle} Num. ${numero}, Col. ${colonia}, C.P. ${cp}`;
    }

    // Procesamos solo los documentos que el usuario haya decidido reemplazar
    const documentosNuevos = [];
    if (req.files?.titulo) documentosNuevos.push({ tipo: 'TITULO', url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula) documentosNuevos.push({ tipo: 'CEDULA', url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat) documentosNuevos.push({ tipo: 'CONSTANCIA_FISCAL', url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine) documentosNuevos.push({ tipo: 'INE', url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentosNuevos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv) documentosNuevos.push({ tipo: 'CV', url: `/uploads/docentes/${req.files.cv[0].filename}` });

    // Mandamos todo al modelo
    await docenteModel.updateDocente(id, {
      rfc, 
      curp, 
      clave_ine, 
      celular, 
      nivel_academico, 
      academia_id, 
      modificado_por,
      domicilio: domicilio_completo,
      documentos: documentosNuevos
    });

    res.status(200).json({ message: "Docente actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar docente:", error);
    res.status(500).json({ error: "Error interno al actualizar el docente." });
  }
};

// No olvides exportar la nueva función
module.exports = { registerDocente, getDocentes, getUsuariosDisponibles, updateDocente };