const bcrypt = require("bcrypt");
const crypto = require("crypto");
const docenteModel = require("../models/docenteModel");
const userModel = require("../models/userModel");
const assignmentModel = require("../models/assignmentModel");
const { enviarPasswordTemporal } = require("../services/emailService");

/** Genera una contraseña aleatoria segura */
const generateSecurePassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((x) => charset[x % charset.length])
    .join('');
};

/** Mapea los archivos de Multer a la estructura requerida por el modelo */
const mapFilesToDocuments = (files) => {
  if (!files) return [];
  const mappings = {
    titulo: 'TITULO',
    cedula: 'CEDULA',
    sat: 'CONSTANCIA_FISCAL',
    ine: 'INE',
    domicilio: 'COMPROBANTE_DOMICILIO',
    cv: 'CV'
  };
  
  return Object.keys(mappings)
    .filter(key => files[key])
    .map(key => ({
      tipo: mappings[key],
      url: `/uploads/docentes/${files[key][0].filename}`
    }));
};

/** Formatea el domicilio */
const formatAddress = (c, n, col, cp) => (c && n && col && cp) ? `${c} Num. ${n}, Col. ${col}, C.P. ${cp}` : null;

// --- CONTROLADORES ---

const docenteController = {
  
  // API DE SINCRONIZACIÓN EXTERNA
  getDocenteParaSincronizacion: async (req, res) => {
    try {
      const { id_docente } = req.query;
      if (!id_docente) return res.status(400).json({ message: "Se requiere id_docente." });

      const docente = await docenteModel.getDocenteParaSincronizacion(id_docente);
      res.status(200).json(docente);
    } catch (error) {
      console.error("[Error Sincronización]:", error);
      res.status(500).json({ message: "Error al procesar catálogo." });
    }
  },

  // CONSULTAS ADMINISTRATIVAS
  getUsuariosDisponibles: async (req, res) => {
    try {
      const usuarios = await docenteModel.getUsuariosDisponibles();
      res.status(200).json(usuarios);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener usuarios disponibles." });
    }
  },

  getDocentes: async (req, res) => {
    try {
      const docentes = await docenteModel.getAllDocentes();
      res.status(200).json(docentes);
    } catch (error) {
      res.status(500).json({ error: "Error al consultar listado." });
    }
  },

  // ALTA UNIFICADA
  registerDocente: async (req, res) => {
    try {
      let { nombres, apellido_paterno, apellido_materno, personal_email, institutional_email,
            rfc, curp, celular, calle, numero, colonia, cp, clave_ine, 
            fecha_ingreso, antiguedad_fecha, nivel_academico, creado_por, academia_id } = req.body;

      // Normalización
      const cleanNombres = nombres?.trim();
      const pEmail = personal_email?.trim().toLowerCase();
      const iEmail = institutional_email?.trim().toLowerCase();
      let fechaReal = fecha_ingreso || antiguedad_fecha;
      if (fechaReal === "null" || fechaReal === "undefined") fechaReal = null;

      // Validación de unicidad
      const [emailExiste, docExiste] = await Promise.all([
        userModel.findExistingEmails(pEmail, iEmail),
        docenteModel.verifyDuplicates(rfc, curp)
      ]);

      if (emailExiste) return res.status(409).json({ error: "Correos ya registrados." });
      if (docExiste) return res.status(409).json({ error: "RFC o CURP ya registrados." });

      // Documentos y Foto
      const documentos = mapFilesToDocuments(req.files);
      if (documentos.length < 6) return res.status(400).json({ error: "Expediente incompleto (6 PDFs requeridos)." });

      const foto_perfil_url = req.files?.foto_perfil_url ? `/uploads/profiles/${req.files.foto_perfil_url[0].filename}` : null;

      // Seguridad y Matrícula
      const password_generada = generateSecurePassword();
      const password_hash = await bcrypt.hash(password_generada, 10);
      const ultimaMat = await docenteModel.getLastMatricula();
      const matricula = String((parseInt(ultimaMat, 10) || 0) + 1).padStart(8, "0");

      const resultado = await docenteModel.createUsuarioYDocente({
        nombres: cleanNombres, apellido_paterno, apellido_materno,
        personal_email: pEmail, institutional_email: iEmail, password_hash,
        foto_perfil_url, creado_por, matricula, rfc, curp, clave_ine,
        domicilio: formatAddress(calle, numero, colonia, cp),
        celular, nivel_academico, antiguedad_fecha: fechaReal, academia_id, documentos
      });

      // Email (No bloqueante)
      enviarPasswordTemporal(pEmail, cleanNombres, password_generada).catch(console.error);

      res.status(201).json({ message: "Registro exitoso", matricula, password_temporal: password_generada, ids: resultado });
    } catch (error) {
      console.error("[Error Registro]:", error);
      res.status(500).json({ error: "Error interno en el alta." });
    }
  },

  // ACTUALIZACIÓN
  updateDocente: async (req, res) => {
    try {
      const { id } = req.params;
      const { rfc, curp, celular, calle, numero, colonia, cp, clave_ine, nivel_academico, academia_id, modificado_por } = req.body;

      await docenteModel.updateDocente(id, {
        rfc, curp, clave_ine, celular, nivel_academico, academia_id, modificado_por,
        domicilio: formatAddress(calle, numero, colonia, cp),
        documentos: mapFilesToDocuments(req.files)
      });

      res.status(200).json({ message: "Actualizado correctamente" });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar." });
    }
  },

  // BAJA (SOFT DELETE CON SEMÁFORO)
  deactivateDocente: async (req, res) => {
    try {
      const { id } = req.params;
      const { eliminado_por, motivo_baja, confirmar_rechazo } = req.body;

      if (!motivo_baja?.trim()) return res.status(400).json({ error: "Motivo requerido." });

      const asignaciones = await assignmentModel.getAllAsignaciones({ docente_id: id });
      
      const tieneAceptadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ACEPTADA');
      if (tieneAceptadas) return res.status(409).json({ action: "BLOCK", error: "Tiene clases ACEPTADAS activas." });

      const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');
      if (tieneEnviadas && !confirmar_rechazo) return res.status(409).json({ action: "WARN", error: "Tiene clases pendientes. ¿Continuar?" });

      if (tieneEnviadas && confirmar_rechazo) await assignmentModel.rechazarAsignacionesPorDocente(id, eliminado_por);

      await docenteModel.deactivateDocente(id, eliminado_por, motivo_baja);
      res.status(200).json({ message: "Baja procesada." });
    } catch (error) {
      res.status(500).json({ error: "Error en la baja." });
    }
  },

  // MI PERFIL
  getMiPerfil: async (req, res) => {
    try {
      const docentes = await docenteModel.getAllDocentes();
      const perfil = docentes.find(d => d.usuario_id === req.user.id_usuario);
      perfil ? res.json(perfil) : res.status(404).json({ error: "No encontrado" });
    } catch (error) {
      res.status(500).json({ error: "Error al cargar perfil" });
    }
  },

  updateMiPerfil: async (req, res) => {
    try {
      const docentes = await docenteModel.getAllDocentes();
      const mi = docentes.find(d => d.usuario_id === req.user.id_usuario);
      if (!mi) return res.status(404).json({ error: "No encontrado" });

      const { celular, calle, numero, colonia, cp, nivel_academico } = req.body;

      await docenteModel.updateDocente(mi.id_docente, {
        ...mi, // Mantiene datos legales (RFC, CURP, etc)
        celular: celular || mi.celular,
        nivel_academico: nivel_academico || mi.nivel_academico,
        domicilio: formatAddress(calle, numero, colonia, cp) || mi.domicilio,
        documentos: mapFilesToDocuments(req.files),
        modificado_por: req.user.id_usuario
      });

      res.status(200).json({ message: "Perfil actualizado." });
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar perfil." });
    }
  },

  // HISTORIAL Y REACTIVACIÓN
  reactivateDocente: async (req, res) => {
    try {
      await docenteModel.reactivateDocente(req.params.id, req.user.id_usuario);
      res.status(200).json({ message: "Reactivado." });
    } catch (error) {
      res.status(500).json({ error: "Error al reactivar." });
    }
  },

  obtenerHistorialDocente: async (req, res) => {
    try {
      const { id_docente } = req.params;
      const [perfilRows, historial] = await Promise.all([
        docenteModel.getPerfilConAntiguedad(id_docente), // Asumiendo que moviste la lógica SQL al modelo
        docenteModel.getHistorialMaterias(id_docente)
      ]);

      if (!perfilRows.length) return res.status(404).json({ message: "No encontrado" });
      
      res.status(200).json({ perfil: perfilRows[0], historial });
    } catch (error) {
      res.status(500).json({ message: "Error en historial" });
    }
  }
};

module.exports = docenteController;