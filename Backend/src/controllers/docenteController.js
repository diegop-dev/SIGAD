const bcrypt = require('bcrypt');
const fs = require('fs');           // ← NUEVO
const path = require('path');       // ← NUEVO
const crypto = require('crypto');
const docenteModel = require('../models/docenteModel');
const userModel = require('../models/userModel');
const assignmentModel = require('../models/assignmentModel');
const { enviarPasswordTemporal } = require('../services/emailService');
const pool = require('../config/database');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const getDocenteParaSincronizacion = async (req, res) => {
  try {
    const { id_docente } = req.query;
    if (!id_docente) {
      return res.status(400).json({ message: 'Parámetro incompleto. Se requiere id_docente.' });
    }
    const docente = await docenteModel.getDocenteParaSincronizacion(id_docente);
    return res.status(200).json(docente);
  } catch (error) {
    console.error('[Error getDocenteParaSincronizacion]:', error);
    return res.status(500).json({ message: 'Error interno al procesar el catálogo de docentes.' });
  }
};

/* ─────────────────────────────────────────────────── */

const getUsuariosDisponibles = async (req, res) => {
  try {
    const usuarios = await docenteModel.getUsuariosDisponibles();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios disponibles.' });
  }
};

/* ─────────────────────────────────────────────────── */

const getDocentes = async (req, res) => {
  try {
    const docentes = await docenteModel.getAllDocentes();
    res.status(200).json(docentes);
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar el listado.' });
  }
};

/* ─────────────────────────────────────────────────── */

const registerDocente = async (req, res) => {
  try {
    let {
      nombres, apellido_paterno, apellido_materno,
      personal_email, institutional_email,
      rfc, curp, celular, calle, numero, colonia, cp,
      clave_ine, fecha_ingreso, antiguedad_fecha, nivel_academico, academia_id,
    } = req.body;

    const creado_por = req.user?.id_usuario;

    nombres             = nombres?.trim();
    apellido_paterno    = apellido_paterno?.trim();
    apellido_materno    = apellido_materno?.trim();
    personal_email      = personal_email?.trim().toLowerCase();
    institutional_email = institutional_email?.trim().toLowerCase();

    let fecha_real = fecha_ingreso || antiguedad_fecha;
    if (fecha_real === 'null' || fecha_real === 'undefined') fecha_real = null;

    if (!nombres || !apellido_paterno || !apellido_materno ||
        !personal_email || !institutional_email ||
        !rfc || !curp || !celular || !calle || !numero || !colonia || !cp ||
        !clave_ine || !fecha_real || !nivel_academico || !creado_por || !academia_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para el registro unificado.' });
    }

    const emailExiste = await userModel.findExistingEmails(personal_email, institutional_email);
    if (emailExiste) return res.status(409).json({ error: 'Uno de los correos proporcionados ya se encuentra registrado.' });

    const docExiste = await docenteModel.verifyDuplicates(rfc, curp);
    if (docExiste) return res.status(409).json({ error: 'El RFC o CURP ya están registrados en otro expediente.' });

    const documentos = [];
    if (req.files?.titulo)    documentos.push({ tipo: 'TITULO',                url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula)    documentos.push({ tipo: 'CEDULA',                url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat)       documentos.push({ tipo: 'CONSTANCIA_FISCAL',     url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine)       documentos.push({ tipo: 'INE',                   url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv)        documentos.push({ tipo: 'CV',                    url: `/uploads/docentes/${req.files.cv[0].filename}` });

    if (documentos.length < 6) return res.status(400).json({ error: 'Se requieren los 6 archivos PDF obligatorios para el expediente.' });

    const foto_perfil_url = req.files?.foto_perfil_url
      ? `/uploads/profiles/${req.files.foto_perfil_url[0].filename}`
      : null;

    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password_generada = '';
    for (let i = 0; i < 12; i++) password_generada += charset[crypto.randomInt(0, charset.length)];
    const password_hash = await bcrypt.hash(password_generada, 10);

    const ultimaMatricula = await docenteModel.getLastMatricula();
    let matricula = '00000001';
    if (ultimaMatricula) matricula = String(parseInt(ultimaMatricula, 10) + 1).padStart(8, '0');

    const domicilio_completo = `${calle} Num. ${numero}, Col. ${colonia}, C.P. ${cp}`;

    const resultado = await docenteModel.createUsuarioYDocente({
      nombres, apellido_paterno, apellido_materno,
      personal_email, institutional_email, password_hash, foto_perfil_url,
      creado_por, matricula, rfc, curp, clave_ine,
      domicilio: domicilio_completo, celular, nivel_academico,
      antiguedad_fecha: fecha_real, fecha_ingreso: fecha_real,
      documentos, academia_id,
    });

    enviarPasswordTemporal(personal_email, nombres, password_generada)
      .then(enviado => {
        if (!enviado) console.error(`[Aviso] El docente ${nombres} se creó, pero falló el envío de correo a ${personal_email}.`);
      });

    logAudit({
      modulo:            'DOCENTES',
      accion:            'CREACION',
      registro_afectado: `Docente "${nombres} ${apellido_paterno}" / Matrícula ${matricula}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(201).json({
      message:            'Expediente de docente y credenciales de usuario creados con éxito.',
      matricula_generada: matricula,
      password_temporal:  password_generada,
      ids_generados:      resultado,
    });
  } catch (error) {
    console.error('[Error en registerDocente]:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el alta.' });
  }
};

/* ─────────────────────────────────────────────────── */

const updateDocente = async (req, res) => {
  try {
    const { id } = req.params;
    const { rfc, curp, celular, calle, numero, colonia, cp, clave_ine, nivel_academico, academia_id } = req.body;
    const modificado_por = req.user?.id_usuario;

    if (!rfc || !curp || !celular || !clave_ine || !nivel_academico || !academia_id) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para actualizar.' });
    }

    const docenteActual = await docenteModel.getDocenteById(id);
    if (!docenteActual) {
      return res.status(404).json({ error: 'El expediente del docente no fue encontrado.' });
    }

    const intentoCambiarNivel    = nivel_academico && nivel_academico !== docenteActual.nivel_academico;
    const intentoCambiarAcademia = academia_id && Number(academia_id) !== Number(docenteActual.academia_id);

    if (intentoCambiarNivel || intentoCambiarAcademia) {
      const tieneAsignaciones = await docenteModel.checkDependenciasActivas(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          error:    'Conflicto de integridad relacional',
          detalles: 'No es posible modificar el nivel académico ni la academia de este docente porque ya cuenta con clases asignadas. Debe liberar su carga horaria previamente para evitar inconsistencias.',
        });
      }
    }

    let domicilio_completo = null;
    if (calle && numero && colonia && cp) {
      domicilio_completo = `${calle} Num. ${numero}, Col. Col. ${colonia}, C.P. ${cp}`;
    }

    const documentosNuevos = [];
    if (req.files?.titulo)    documentosNuevos.push({ tipo: 'TITULO',                url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula)    documentosNuevos.push({ tipo: 'CEDULA',                url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat)       documentosNuevos.push({ tipo: 'CONSTANCIA_FISCAL',     url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine)       documentosNuevos.push({ tipo: 'INE',                   url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentosNuevos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv)        documentosNuevos.push({ tipo: 'CV',                    url: `/uploads/docentes/${req.files.cv[0].filename}` });

    await docenteModel.updateDocente(id, {
      rfc, curp, clave_ine, celular, nivel_academico, academia_id, modificado_por,
      domicilio: domicilio_completo, documentos: documentosNuevos,
    });

    logAudit({
      modulo:            'DOCENTES',
      accion:            'MODIFICACION',
      registro_afectado: `Docente #${id} "${docenteActual.nombres} ${docenteActual.apellido_paterno}"`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Docente actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar docente:', error);
    res.status(500).json({ error: 'Error interno al actualizar el docente.' });
  }
};

/* ─────────────────────────────────────────────────── */

const deactivateDocente = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo_baja, confirmar_rechazo } = req.body;
    const eliminado_por = req.user?.id_usuario;

    if (!eliminado_por) return res.status(401).json({ error: 'No autorizado. Se requiere sesión activa.' });
    if (!motivo_baja || motivo_baja.trim() === '') return res.status(400).json({ error: 'Debe especificar un motivo para la baja.' });

    const tieneAceptadas = await docenteModel.checkDependenciasActivas(id);
    if (tieneAceptadas) {
      return res.status(409).json({
        action:  'BLOCK',
        error:   'Conflicto de integridad relacional',
        detalles: 'Este docente tiene clases ACEPTADAS. No puedes darlo de baja hasta que le reasignes o canceles sus clases en la gestión de asignaciones.',
      });
    }

    const asignaciones  = await assignmentModel.obtenerTodasLasAsignaciones({ docente_id: id });
    const tieneEnviadas = asignaciones.some(a => a.estatus_acta === 'ABIERTA' && a.estatus_confirmacion === 'ENVIADA');

    if (tieneEnviadas && !confirmar_rechazo) {
      return res.status(409).json({
        action:  'WARN',
        error:   'Advertencia de asignaciones pendientes',
        detalles: 'Este docente tiene asignaciones ENVIADAS pendientes de confirmación. Darlo de baja rechazará automáticamente estas clases. ¿Deseas continuar?',
      });
    }

    if (tieneEnviadas && confirmar_rechazo) {
      await assignmentModel.rechazarAsignacionesPorDocente(id, eliminado_por);
    }

    const docenteActual = await docenteModel.getDocenteById(id);
    const affectedRows  = await docenteModel.deactivateDocente(id, eliminado_por, motivo_baja);

    if (affectedRows === 0) return res.status(404).json({ error: 'Docente no encontrado. No se pudo realizar la baja.' });

    await userModel.deactivateUser(docenteActual.usuario_id, eliminado_por);

    logAudit({
      modulo:            'DOCENTES',
      accion:            'BAJA',
      registro_afectado: `Docente #${id} "${docenteActual?.nombres} ${docenteActual?.apellido_paterno}"`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Docente dado de baja exitosamente del sistema.' });
  } catch (error) {
    console.error('Error crítico al dar de baja al docente:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la baja del docente.' });
  }
};

/* ─────────────────────────────────────────────────── */

const getMiPerfil = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const docentes   = await docenteModel.getAllDocentes();
    const miPerfil   = docentes.find(d => d.usuario_id === id_usuario);
    if (!miPerfil) return res.status(404).json({ error: 'No se encontró tu expediente.' });
    res.status(200).json(miPerfil);
  } catch (error) {
    console.error('Error en getMiPerfil:', error);
    res.status(500).json({ error: 'Error al cargar tu perfil.' });
  }
};

/* ─────────────────────────────────────────────────── */

// ─── CAMBIO 1: updateMiPerfil ahora solo permite celular + domicilio + documentos ───
// nivel_academico, rfc, curp, clave_ine y academia_id se leen siempre del
// expediente actual para que el docente no pueda alterarlos desde esta ruta.
const updateMiPerfil = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const docentes   = await docenteModel.getAllDocentes();
    const miPerfil   = docentes.find(d => d.usuario_id === id_usuario);
    if (!miPerfil) return res.status(404).json({ error: 'No se encontró tu expediente.' });

    // Solo campos que el docente puede editar
    const { celular, calle, numero, colonia, cp } = req.body;

    let domicilio_completo = miPerfil.domicilio;
    if (calle && numero && colonia && cp) {
      domicilio_completo = `${calle} Num. ${numero}, Col. ${colonia}, C.P. ${cp}`;
    }

    const documentosNuevos = [];
    if (req.files?.titulo)    documentosNuevos.push({ tipo: 'TITULO',                url: `/uploads/docentes/${req.files.titulo[0].filename}` });
    if (req.files?.cedula)    documentosNuevos.push({ tipo: 'CEDULA',                url: `/uploads/docentes/${req.files.cedula[0].filename}` });
    if (req.files?.sat)       documentosNuevos.push({ tipo: 'CONSTANCIA_FISCAL',     url: `/uploads/docentes/${req.files.sat[0].filename}` });
    if (req.files?.ine)       documentosNuevos.push({ tipo: 'INE',                   url: `/uploads/docentes/${req.files.ine[0].filename}` });
    if (req.files?.domicilio) documentosNuevos.push({ tipo: 'COMPROBANTE_DOMICILIO', url: `/uploads/docentes/${req.files.domicilio[0].filename}` });
    if (req.files?.cv)        documentosNuevos.push({ tipo: 'CV',                    url: `/uploads/docentes/${req.files.cv[0].filename}` });

    await docenteModel.updateDocente(miPerfil.id_docente, {
      // Campos inmutables para el docente: siempre vienen del expediente actual
      rfc:             miPerfil.rfc,
      curp:            miPerfil.curp,
      clave_ine:       miPerfil.clave_ine,
      academia_id:     miPerfil.academia_id,
      nivel_academico: miPerfil.nivel_academico,
      // Campos editables
      celular:         celular || miPerfil.celular,
      modificado_por:  id_usuario,
      domicilio:       domicilio_completo,
      documentos:      documentosNuevos,
    });

    logAudit({
      modulo:            'DOCENTES',
      accion:            'MODIFICACION',
      registro_afectado: `Docente #${miPerfil.id_docente} (autoedición de perfil)`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Tu perfil se actualizó correctamente.' });
  } catch (error) {
    console.error('Error al actualizar mi perfil:', error);
    res.status(500).json({ error: 'Error interno al actualizar tu perfil.' });
  }
};

/* ─────────────────────────────────────────────────── */

// ─── CAMBIO 2: updateMiFoto — el docente actualiza su propia foto de perfil ───
// Actualiza foto_perfil_url en la tabla usuarios (igual que userController.updateMyPhoto)
// pero registrando la auditoría en el módulo DOCENTES.
const updateMiFoto = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario;
    if (!id_usuario) return res.status(401).json({ error: 'No se pudo identificar al usuario autenticado.' });
    if (!req.file)   return res.status(400).json({ error: 'No se recibió ninguna imagen. Selecciona un archivo válido.' });

    const existingUser = await userModel.findUserById(id_usuario);
    if (!existingUser) return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });

    // Eliminar foto anterior del disco si existe
    if (existingUser.foto_perfil_url) {
      const oldPhotoPath = path.join(__dirname, '..', existingUser.foto_perfil_url);
      if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
    }

    const foto_perfil_url = `/uploads/profiles/${req.file.filename}`;
    const affectedRows    = await userModel.updateUser(id_usuario, {
      foto_perfil_url,
      modificado_por: id_usuario,
    });

    if (affectedRows === 0) {
      return res.status(500).json({ error: 'No se pudo actualizar la fotografía. Intenta de nuevo.' });
    }

    logAudit({
      modulo:            'DOCENTES',
      accion:            'MODIFICACION',
      registro_afectado: `Docente (usuario #${id_usuario}) — actualización de foto de perfil`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Fotografía de perfil actualizada correctamente.', foto_perfil_url });
  } catch (error) {
    console.error('[Error en docenteController - updateMiFoto]:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la fotografía.' });
  }
};

/* ─────────────────────────────────────────────────── */

const reactivateDocente = async (req, res) => {
  try {
    const { id }       = req.params;
    const usuario_id   = req.user?.id_usuario;
    const affectedRows = await docenteModel.reactivateDocente(id, usuario_id);

    if (affectedRows === 0) return res.status(404).json({ error: 'Docente no encontrado o no se pudo reactivar.' });

    const docenteActual = await docenteModel.getDocenteById(id);
    await userModel.activateUser(docenteActual.usuario_id, usuario_id);

    logAudit({
      modulo:            'DOCENTES',
      accion:            'MODIFICACION',
      registro_afectado: `Docente #${id} "${docenteActual?.nombres} ${docenteActual?.apellido_paterno}" — reactivado`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Docente reactivado exitosamente.' });
  } catch (error) {
    console.error('Error al reactivar docente:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la reactivación.' });
  }
};

/* ─────────────────────────────────────────────────── */

const obtenerHistorialDocente = async (req, res) => {
  const { id_docente } = req.params;
  try {
    const data = await docenteModel.getHistorialCompleto(id_docente);
    if (!data) return res.status(404).json({ message: 'Docente no encontrado.' });
    res.status(200).json(data);
  } catch (error) {
    console.error('Error al obtener historial docente:', error);
    res.status(500).json({ message: 'Error interno del servidor al consultar el historial.' });
  }
};

/* ─────────────────────────────────────────────────── */

const ObtenerDocentes = async (req, res) => {
  try {
    const docentes = await docenteModel.ObtenerDocentes();
    res.status(200).json(docentes);
  } catch (error) {
    console.error('[Error ObtenerDocentes]:', error);
    res.status(500).json({ error: 'Error al consultar los docentes' });
  }
};

const ObtenerUsuarioPorId = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const usuario = await docenteModel.ObtenerUsuarioPorId(id_usuario);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.status(200).json(usuario);
  } catch (error) {
    console.error('[Error ObtenerUsuarioPorId]:', error);
    res.status(500).json({ error: 'Error al consultar el usuario' });
  }
};

/* ─────────────────────────────────────────────────── */

module.exports = {
  getDocenteParaSincronizacion,
  registerDocente,
  getDocentes,
  getUsuariosDisponibles,
  updateDocente,
  deactivateDocente,
  getMiPerfil,
  updateMiPerfil,
  updateMiFoto,          // ← NUEVO
  reactivateDocente,
  obtenerHistorialDocente,
  ObtenerDocentes,
  ObtenerUsuarioPorId,
};