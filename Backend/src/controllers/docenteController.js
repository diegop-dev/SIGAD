const bcrypt = require("bcrypt");
const crypto = require("crypto");
const docenteModel = require("../models/docenteModel");
const userModel = require("../models/userModel");
// Importamos el servicio de correos
const { enviarPasswordTemporal } = require("../services/emailService"); 

// API DE SINCRONIZACIÓN EXTERNA (HU-37 / API-06)
const getDocenteParaSincronizacion = async (req, res) => {
  try {
    const { id_docente } = req.query;

    if (!id_docente) {
      return res.status(400).json({
        message: "Parámetro incompleto. Se requiere id_docente."
      });
    }

    const docente = await docenteModel.getDocenteParaSincronizacion(id_docente);
    return res.status(200).json(docente);
  } catch (error) {
    console.error("[Error getDocenteParaSincronizacion]:", error);
    return res.status(500).json({ 
      message: "Error interno al procesar el catálogo de docentes." 
    });
  }
};

// MÉTODOS INTERNOS DE SIGAD
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

// ✨ NUEVA FUNCIÓN REFACTORIZADA PARA ALTA UNIFICADA BLINDADA ✨
const registerDocente = async (req, res) => {
  try {
    let {
      // datos del usuario
      nombres, apellido_paterno, apellido_materno,
      personal_email, institutional_email,
      // datos del expediente docente
      rfc, curp, celular, calle, numero, colonia, cp,
      clave_ine, fecha_ingreso, antiguedad_fecha, nivel_academico, creado_por, academia_id 
    } = req.body;

    // normalización de datos para evitar espacios en blanco e inconsistencias
    nombres = nombres?.trim();
    apellido_paterno = apellido_paterno?.trim();
    apellido_materno = apellido_materno?.trim();
    personal_email = personal_email?.trim().toLowerCase();
    institutional_email = institutional_email?.trim().toLowerCase();

    // =======================================================
    // BLINDAJE CONTRA ERRORES DE FECHA NULA
    // =======================================================
    let fecha_real = fecha_ingreso || antiguedad_fecha;
    if (fecha_real === "null" || fecha_real === "undefined") fecha_real = null;

    // validación estricta de campos obligatorios unificados
    if (!nombres || !apellido_paterno || !apellido_materno ||
        !personal_email || !institutional_email ||
        !rfc || !curp || !celular || !calle || !numero || !colonia || !cp ||
        !clave_ine || !fecha_real || !nivel_academico || !creado_por || !academia_id) {
      return res.status(400).json({ error: "Faltan datos obligatorios para el registro unificado." });
    }

    // prevención de colisiones y validaciones de unicidad (correos, RFC, CURP)
    const emailExiste = await userModel.findExistingEmails(personal_email, institutional_email);
    if (emailExiste) {
      return res.status(409).json({ error: "Uno de los correos proporcionados ya se encuentra registrado." });
    }

    const docExiste = await docenteModel.verifyDuplicates(rfc, curp);
    if (docExiste) {
      return res.status(409).json({ error: "El RFC o CURP ya están registrados en otro expediente." });
    }

    // validación del expediente digital (archivos PDF)
    const documentos = [];
    if (req.files?.titulo) documentos.push({ tipo: 'TITULO', url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula) documentos.push({ tipo: 'CEDULA', url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat) documentos.push({ tipo: 'CONSTANCIA_FISCAL', url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine) documentos.push({ tipo: 'INE', url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv) documentos.push({ tipo: 'CV', url: `/uploads/docentes/${req.files.cv[0].filename}` });

    if (documentos.length < 6) return res.status(400).json({ error: "Se requieren los 6 archivos PDF obligatorios para el expediente." });

    // ✨ extracción de la ruta de la fotografía de perfil
    const foto_perfil_url = req.files?.foto_perfil_url 
      ? `/uploads/profiles/${req.files.foto_perfil_url[0].filename}` 
      : null;

    // generación de contraseña temporal segura (criptografía)
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let password_generada = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password_generada += charset[randomIndex];
    }
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password_generada, saltRounds);

    // generación secuencial de matrícula
    const ultimaMatricula = await docenteModel.getLastMatricula();
    let matricula = "00000001"; 
    
    if (ultimaMatricula) {
      const numeroActual = parseInt(ultimaMatricula, 10);
      matricula = String(numeroActual + 1).padStart(8, "0");
    }

    const domicilio_completo = `${calle} Num. ${numero}, Col. ${colonia}, C.P. ${cp}`;

    // invocación de la transacción ACID en el modelo incluyendo la foto de perfil
    const resultado = await docenteModel.createUsuarioYDocente({
      nombres, apellido_paterno, apellido_materno,
      personal_email, institutional_email, password_hash,
      foto_perfil_url,
      creado_por, matricula, rfc, curp, clave_ine,
      domicilio: domicilio_completo, celular, nivel_academico, 
      antiguedad_fecha: fecha_real, 
      fecha_ingreso: fecha_real,
      documentos,
      academia_id
    });

    // ========================================================
    // ENVÍO DE CORREO ELECTRÓNICO AL NUEVO DOCENTE (No bloqueante)
    // ========================================================
    enviarPasswordTemporal(personal_email, nombres, password_generada)
      .then(enviado => {
        if (!enviado) {
          console.error(`[Aviso] El docente ${nombres} se creó, pero falló el envío de correo a ${personal_email}.`);
        }
      });
    // ========================================================

    res.status(201).json({ 
      message: "Expediente de docente y credenciales de usuario creados con éxito.", 
      matricula_generada: matricula,
      password_temporal: password_generada,
      ids_generados: resultado
    });
  } catch (error) {
    console.error("[Error en registerDocente]:", error);
    res.status(500).json({ error: "Error interno del servidor al procesar el alta." });
  }
};

const updateDocente = async (req, res) => {
  try {
    const { id } = req.params; 
    const {
      rfc, curp, celular, calle, numero, colonia, cp,
      clave_ine, nivel_academico, academia_id, modificado_por 
    } = req.body;

    if (!rfc || !curp || !celular || !clave_ine || !nivel_academico || !academia_id) {
      return res.status(400).json({ error: "Faltan datos obligatorios para actualizar." });
    }

    let domicilio_completo = null;
    if (calle && numero && colonia && cp) {
      domicilio_completo = `${calle} Num. ${numero}, Col. Col. ${colonia}, C.P. ${cp}`;
    }

    const documentosNuevos = [];
    if (req.files?.titulo) documentosNuevos.push({ tipo: 'TITULO', url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula) documentosNuevos.push({ tipo: 'CEDULA', url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat) documentosNuevos.push({ tipo: 'CONSTANCIA_FISCAL', url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine) documentosNuevos.push({ tipo: 'INE', url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentosNuevos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv) documentosNuevos.push({ tipo: 'CV', url: `/uploads/docentes/${req.files.cv[0].filename}` });

    await docenteModel.updateDocente(id, {
      rfc, curp, clave_ine, celular, nivel_academico, academia_id, modificado_por,
      domicilio: domicilio_completo, documentos: documentosNuevos
    });

    res.status(200).json({ message: "Docente actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar docente:", error);
    res.status(500).json({ error: "Error interno al actualizar el docente." });
  }
};

const deactivateDocente = async (req, res) => {
  try {
    const { id } = req.params;
    const { eliminado_por, motivo_baja } = req.body;

    if (!eliminado_por) {
      return res.status(400).json({ error: "Falta especificar el usuario que realiza la baja (eliminado_por)." });
    }
    
    if (!motivo_baja || motivo_baja.trim() === '') {
      return res.status(400).json({ error: "Debe especificar un motivo para la baja." });
    }

    const affectedRows = await docenteModel.deactivateDocente(id, eliminado_por, motivo_baja);

    if (affectedRows === 0) {
      return res.status(404).json({ error: "Docente no encontrado. No se pudo realizar la baja." });
    }

    res.status(200).json({ message: "Docente dado de baja exitosamente del sistema." });

  } catch (error) {
    console.error("Error crítico al dar de baja al docente (ID:", req.params.id, "):", error);
    res.status(500).json({ error: "Error interno del servidor al procesar la baja del docente." });
  }
};

// ✨ FUNCIONES EXCLUSIVAS PARA "MI PERFIL" DOCENTE ✨
const getMiPerfil = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario; // Esto viene de tu token de login
    
    // Buscamos a todos y filtramos (funciona perfecto para el tamaño del sistema sin alterar el modelo)
    const docentes = await docenteModel.getAllDocentes();
    const miPerfil = docentes.find(d => d.usuario_id === id_usuario);

    if (!miPerfil) return res.status(404).json({ error: "No se encontró tu expediente." });

    res.status(200).json(miPerfil);
  } catch (error) {
    console.error("Error en getMiPerfil:", error);
    res.status(500).json({ error: "Error al cargar tu perfil." });
  }
};

const updateMiPerfil = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const docentes = await docenteModel.getAllDocentes();
    const miPerfil = docentes.find(d => d.usuario_id === id_usuario);

    if (!miPerfil) return res.status(404).json({ error: "No se encontró tu expediente." });

    // Extraemos SOLO lo que el docente SÍ tiene permiso de cambiar
    const { celular, calle, numero, colonia, cp, nivel_academico } = req.body;

    let domicilio_completo = miPerfil.domicilio;
    if (calle && numero && colonia && cp) {
      domicilio_completo = `${calle} Num. ${numero}, Col. ${colonia}, C.P. ${cp}`;
    }

    const documentosNuevos = [];
    if (req.files?.titulo) documentosNuevos.push({ tipo: 'TITULO', url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula) documentosNuevos.push({ tipo: 'CEDULA', url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat) documentosNuevos.push({ tipo: 'CONSTANCIA_FISCAL', url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine) documentosNuevos.push({ tipo: 'INE', url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentosNuevos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv) documentosNuevos.push({ tipo: 'CV', url: `/uploads/docentes/${req.files.cv[0].filename}` });

    // 🛡️ REGLA DE SEGURIDAD (RBAC): Inyectamos los datos legales originales para que no se modifiquen
    await docenteModel.updateDocente(miPerfil.id_docente, {
      rfc: miPerfil.rfc,             
      curp: miPerfil.curp,           
      clave_ine: miPerfil.clave_ine, 
      academia_id: miPerfil.academia_id, 
      celular: celular || miPerfil.celular,
      nivel_academico: nivel_academico || miPerfil.nivel_academico,
      modificado_por: id_usuario,
      domicilio: domicilio_completo,
      documentos: documentosNuevos
    });

    res.status(200).json({ message: "Tu perfil se actualizó correctamente." });
  } catch (error) {
    console.error("Error al actualizar mi perfil:", error);
    res.status(500).json({ error: "Error interno al actualizar tu perfil." });
  }
};

module.exports = { 
  getDocenteParaSincronizacion,
  registerDocente, 
  getDocentes, 
  getUsuariosDisponibles, 
  updateDocente, 
  deactivateDocente,
  getMiPerfil,      
  updateMiPerfil    
};