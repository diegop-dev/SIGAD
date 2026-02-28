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
      clave_ine, fecha_ingreso, nivel_academico, creado_por 
    } = req.body;

    if (!usuario_id || !rfc || !curp || !celular || !calle || !numero || !colonia || !cp ||
        !clave_ine || !fecha_ingreso || !nivel_academico || !creado_por) {
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
    let matricula = "00000001"; // Formato inicial si la tabla está vacía
    
    if (ultimaMatricula) {
      // Como ahora son solo números, lo leemos directamente
      const numeroActual = parseInt(ultimaMatricula, 10);
      // Le sumamos 1 y garantizamos que siempre tenga 8 dígitos
      matricula = String(numeroActual + 1).padStart(8, "0");
    }

    const domicilio_completo = `${calle} Num. ${numero}, Col. ${colonia}, C.P. ${cp}`;

    await docenteModel.createDocente({
      usuario_id, creado_por, matricula, rfc, curp, clave_ine,
      domicilio: domicilio_completo, celular, nivel_academico, 
      antiguedad_fecha: fecha_ingreso, documentos
    });

    res.status(201).json({ message: "Éxito", matricula_generada: matricula });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
};

module.exports = { registerDocente, getDocentes, getUsuariosDisponibles };
