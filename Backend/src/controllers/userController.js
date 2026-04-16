const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const userModel = require('../models/userModel');
const { enviarPasswordTemporal, enviarActualizacionCredenciales } = require('../services/emailService');
const { logAudit, getClientIp } = require('../services/auditService');

/* ── Mapa de roles ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const nameRegex  = /^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s[a-zA-ZÀ-ÿ\u00f1\u00d1]+)*$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/* ─────────────────────────────────────────────────── */

const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Debe proporcionar un correo para validar.' });

    const cleanEmail   = email.trim().toLowerCase();
    const existingUser = await userModel.findExistingEmails(cleanEmail, cleanEmail);

    if (existingUser) {
      const fieldMatch = existingUser.personal_email === cleanEmail ? 'personal_email' : 'institutional_email';
      return res.status(200).json({ exists: true, field: fieldMatch });
    }

    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error('[Error en userController - checkEmailExists]:', error);
    res.status(500).json({ error: 'Error al validar la disponibilidad del correo.' });
  }
};

/* ─────────────────────────────────────────────────── */

const getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('[Error en userController - getUsers]:', error);
    res.status(500).json({ error: 'Error al consultar el listado de usuarios.' });
  }
};

/* ─────────────────────────────────────────────────── */

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId   = req.user?.id_usuario;
    const currentUserRole = req.user?.rol_id;

    if (!currentUserId || !currentUserRole) {
      return res.status(401).json({ error: 'No se pudo identificar al usuario que realiza la petición.' });
    }

    const isSelf = Number(currentUserId) === Number(id);
    if (!isSelf && currentUserRole === 3) {
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para consultar este perfil.' });
    }

    const user = await userModel.findUserById(id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });

    const { password_hash, ...safeUser } = user;
    res.status(200).json({ data: safeUser });
  } catch (error) {
    console.error('[Error en userController - getUserById]:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar el usuario.' });
  }
};

/* ─────────────────────────────────────────────────── */

const registerUser = async (req, res) => {
  try {
    let {
      nombres, apellido_paterno, apellido_materno,
      personal_email, institutional_email, rol_id,
    } = req.body;

    // ← fix: creado_por del token, no del body
    const creado_por = req.user?.id_usuario;

    nombres             = nombres?.trim();
    apellido_paterno    = apellido_paterno?.trim();
    apellido_materno    = apellido_materno?.trim();
    personal_email      = personal_email?.trim().toLowerCase();
    institutional_email = institutional_email?.trim().toLowerCase();

    if (!nombres || !apellido_paterno || !apellido_materno ||
        !personal_email || !institutional_email || !rol_id || !creado_por) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el registro.' });
    }

    if (!nameRegex.test(nombres) || !nameRegex.test(apellido_paterno) || !nameRegex.test(apellido_materno)) {
      return res.status(400).json({ error: 'Los nombres y apellidos solo deben contener letras y un espacio simple entre palabras.' });
    }

    if (!emailRegex.test(personal_email) || (personal_email.match(/@/g) || []).length !== 1) {
      return res.status(400).json({ error: 'El correo personal no tiene un formato válido o contiene caracteres no permitidos.' });
    }

    if (!emailRegex.test(institutional_email) || (institutional_email.match(/@/g) || []).length !== 1) {
      return res.status(400).json({ error: 'El correo institucional no tiene un formato válido o contiene caracteres no permitidos.' });
    }

    const existingUser = await userModel.findExistingEmails(personal_email, institutional_email);
    if (existingUser) {
      return res.status(409).json({ error: 'Uno de los correos proporcionados ya se encuentra registrado en el sistema.' });
    }

    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*';
    let password_generada = '';
    do {
      password_generada = '';
      for (let i = 0; i < 12; i++) password_generada += charset[crypto.randomInt(0, charset.length)];
    } while (!passwordRegex.test(password_generada));

    const password_hash   = await bcrypt.hash(password_generada, 10);
    const foto_perfil_url = req.file ? `/uploads/profiles/${req.file.filename}` : null;

    const newUserId = await userModel.createUser({
      nombres, apellido_paterno, apellido_materno,
      personal_email, institutional_email,
      password_hash, foto_perfil_url, rol_id, creado_por,
    });

    enviarPasswordTemporal(personal_email, nombres, password_generada)
      .then(enviado => {
        if (!enviado) console.error(`[Aviso] El usuario ${nombres} se creó, pero falló el envío de correo a ${personal_email}.`);
      });

    logAudit({
      modulo:            'USUARIOS',
      accion:            'CREACION',
      registro_afectado: `Usuario "${nombres} ${apellido_paterno}" #${newUserId} — Rol: ${rolNombre(rol_id)}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(201).json({
      message:           'Usuario registrado exitosamente y credenciales enviadas por correo.',
      usuarioId:         newUserId,
      password_temporal: password_generada,
      nota:              'El usuario deberá cambiar su contraseña temporal en el primer inicio de sesión.',
    });
  } catch (error) {
    console.error('[Error en userController - registerUser]:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el registro.' });
  }
};

/* ─────────────────────────────────────────────────── */

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      nombres, apellido_paterno, apellido_materno,
      personal_email, institutional_email,
      password_raw, rol_id, estatus,
    } = req.body;

    const currentUserId   = req.user?.id_usuario;
    const currentUserRole = req.user?.rol_id;
    // ← fix: modificado_por del token, no del body
    const modificado_por  = req.user?.id_usuario;

    if (!currentUserId || !currentUserRole) {
      return res.status(401).json({ error: 'No se pudo identificar al usuario que realiza la petición.' });
    }

    const existingUser = await userModel.findUserById(id);
    if (!existingUser) return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });

    const isSelf = Number(currentUserId) === Number(existingUser.id_usuario);

    if (isSelf && (currentUserRole === 1 || currentUserRole === 2)) {
      return res.status(403).json({ error: "Acceso denegado: Para modificar tus propios datos, utiliza la sección 'Mi Perfil'." });
    }

    if (!isSelf) {
      if (currentUserRole === 1 && existingUser.rol_id === 1)
        return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para editar a otro Superadministrador.' });
      if (currentUserRole === 2 && (existingUser.rol_id === 1 || existingUser.rol_id === 2))
        return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para editar a personal directivo o superadministradores.' });
    }

    if (currentUserRole === 2 && Number(rol_id) === 1) {
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para asignar el rol de Superadministrador.' });
    }

    const updateData = {
      nombres:             nombres?.trim(),
      apellido_paterno:    apellido_paterno?.trim(),
      apellido_materno:    apellido_materno?.trim(),
      personal_email:      personal_email?.trim().toLowerCase(),
      institutional_email: institutional_email?.trim().toLowerCase(),
      rol_id,
      modificado_por,
    };

    if (updateData.nombres           && !nameRegex.test(updateData.nombres))
      return res.status(400).json({ error: "El campo 'Nombre' contiene caracteres inválidos." });
    if (updateData.apellido_paterno  && !nameRegex.test(updateData.apellido_paterno))
      return res.status(400).json({ error: "El campo 'Apellido Paterno' contiene caracteres inválidos." });
    if (updateData.apellido_materno  && !nameRegex.test(updateData.apellido_materno))
      return res.status(400).json({ error: "El campo 'Apellido Materno' contiene caracteres inválidos." });
    if (updateData.personal_email    && (!emailRegex.test(updateData.personal_email)    || (updateData.personal_email.match(/@/g)    || []).length !== 1))
      return res.status(400).json({ error: 'El correo personal no tiene un formato válido.' });
    if (updateData.institutional_email && (!emailRegex.test(updateData.institutional_email) || (updateData.institutional_email.match(/@/g) || []).length !== 1))
      return res.status(400).json({ error: 'El correo institucional no tiene un formato válido.' });

    const passwordChanged = password_raw && password_raw.trim() !== '';
    if (passwordChanged) {
      if (!passwordRegex.test(password_raw))
        return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres, incluir al menos una letra mayúscula y un número.' });
      updateData.password_hash        = await bcrypt.hash(password_raw, 10);
      updateData.es_password_temporal = 1;
    }

    if (updateData.personal_email || updateData.institutional_email) {
      const emailCollision = await userModel.findExistingEmailsExceptUser(
        updateData.personal_email      || existingUser.personal_email,
        updateData.institutional_email || existingUser.institutional_email,
        id
      );
      if (emailCollision) return res.status(409).json({ error: 'Uno de los correos ya está en uso por otro usuario del sistema.' });
    }

    if (estatus) updateData.estatus = estatus;

    const emailChanged = updateData.personal_email && updateData.personal_email !== existingUser.personal_email;

    if (req.file) {
      updateData.foto_perfil_url = `/uploads/profiles/${req.file.filename}`;
      if (existingUser.foto_perfil_url) {
        const oldPhotoPath = path.join(__dirname, '..', existingUser.foto_perfil_url);
        if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
      }
    }

    Object.keys(updateData).forEach(key => { if (updateData[key] === undefined) delete updateData[key]; });

    const affectedRows = await userModel.updateUser(id, updateData);
    if (affectedRows === 0) {
      return res.status(400).json({ error: 'No se enviaron datos para actualizar o la información es idéntica a la actual.' });
    }

    if (emailChanged || passwordChanged) {
      const emailAEnviar  = updateData.personal_email || existingUser.personal_email;
      const nombreUsuario = updateData.nombres        || existingUser.nombres;
      const passwordAEnviar = passwordChanged ? password_raw : null;
      enviarActualizacionCredenciales(emailAEnviar, nombreUsuario, passwordAEnviar)
        .then(enviado => { if (!enviado) console.error(`[Aviso] Falló el envío de correo de actualización a ${emailAEnviar}`); });
    }

    logAudit({
      modulo:            'USUARIOS',
      accion:            'MODIFICACION',
      registro_afectado: `Usuario "${existingUser.nombres} ${existingUser.apellido_paterno}" #${id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Expediente de usuario actualizado exitosamente.' });
  } catch (error) {
    console.error('[Error en userController - updateUser]:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar el usuario.' });
  }
};

/* ─────────────────────────────────────────────────── */

const updateMyPhoto = async (req, res) => {
  try {
    const currentUserId = req.user?.id_usuario;
    if (!currentUserId) return res.status(401).json({ error: 'No se pudo identificar al usuario autenticado.' });
    if (!req.file)       return res.status(400).json({ error: 'No se recibió ninguna imagen. Selecciona un archivo válido.' });

    const existingUser = await userModel.findUserById(currentUserId);
    if (!existingUser) return res.status(404).json({ error: 'Usuario no encontrado en el sistema.' });

    if (existingUser.foto_perfil_url) {
      const oldPhotoPath = path.join(__dirname, '..', existingUser.foto_perfil_url);
      if (fs.existsSync(oldPhotoPath)) fs.unlinkSync(oldPhotoPath);
    }

    const foto_perfil_url = `/uploads/profiles/${req.file.filename}`;
    const affectedRows    = await userModel.updateUser(currentUserId, { foto_perfil_url, modificado_por: currentUserId });

    if (affectedRows === 0) return res.status(500).json({ error: 'No se pudo actualizar la fotografía. Intenta de nuevo.' });

    logAudit({
      modulo:            'USUARIOS',
      accion:            'MODIFICACION',
      registro_afectado: `Usuario #${currentUserId} — actualización de foto de perfil`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Fotografía de perfil actualizada correctamente.', foto_perfil_url });
  } catch (error) {
    console.error('[Error en userController - updateMyPhoto]:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar la fotografía.' });
  }
};

/* ─────────────────────────────────────────────────── */

const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId   = req.user?.id_usuario;
    const currentUserRole = req.user?.rol_id;
    // ← fix: eliminado_por del token, no del body
    const eliminado_por   = req.user?.id_usuario;

    if (!currentUserId || !currentUserRole) {
      return res.status(401).json({ error: 'No autorizado. Se requiere sesión activa.' });
    }

    const existingUser = await userModel.findUserById(id);
    if (!existingUser) return res.status(404).json({ error: 'El usuario que intenta desactivar no existe.' });

    if (Number(currentUserId) === Number(existingUser.id_usuario))
      return res.status(403).json({ error: 'Acceso denegado: No puedes desactivar tu propia cuenta.' });
    if (currentUserRole === 1 && existingUser.rol_id === 1)
      return res.status(403).json({ error: 'Acceso denegado: No puedes desactivar a otros Superadministradores.' });
    if (currentUserRole === 2 && (existingUser.rol_id === 1 || existingUser.rol_id === 2))
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para desactivar a personal directivo o superadministradores.' });
    if (existingUser.estatus === 'INACTIVO')
      return res.status(400).json({ error: 'Este usuario ya se encuentra inactivo.' });

    if (existingUser.rol_id === 3) {
      const tieneAsignaciones = await userModel.checkDependenciasDocente(id);
      if (tieneAsignaciones) {
        return res.status(409).json({
          error:    'Conflicto de integridad relacional.',
          detalles: 'No es posible desactivar este usuario. Cuenta con un expediente docente vinculado a una carga horaria activa. Debe liberar las asignaciones y eliminar el expediente previamente.',
        });
      }
    }

    const affectedRows = await userModel.deactivateUser(id, eliminado_por);
    if (affectedRows === 0) return res.status(500).json({ error: 'Ocurrió un problema inesperado y no se pudo procesar la desactivación del usuario.' });

    logAudit({
      modulo:            'USUARIOS',
      accion:            'BAJA',
      registro_afectado: `Usuario "${existingUser.nombres} ${existingUser.apellido_paterno}" #${id}`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Usuario desactivado exitosamente. Se le ha revocado el acceso al sistema.' });
  } catch (error) {
    console.error('[Error en userController - deactivateUser]:', error);
    res.status(500).json({ error: 'Error interno del servidor al intentar desactivar el usuario.' });
  }
};

/* ─────────────────────────────────────────────────── */

const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId   = req.user?.id_usuario;
    const currentUserRole = req.user?.rol_id;
    // ← fix: modificado_por del token, no del body
    const modificado_por  = req.user?.id_usuario;

    if (!currentUserId || !currentUserRole) {
      return res.status(401).json({ error: 'No autorizado. Se requiere sesión activa.' });
    }

    const existingUser = await userModel.findUserById(id);
    if (!existingUser) return res.status(404).json({ error: 'El usuario que intenta reactivar no existe.' });

    if (currentUserRole === 1 && existingUser.rol_id === 1 && Number(currentUserId) !== Number(existingUser.id_usuario))
      return res.status(403).json({ error: 'Acceso denegado: No puedes reactivar a otros Superadministradores.' });
    if (currentUserRole === 2 && (existingUser.rol_id === 1 || existingUser.rol_id === 2))
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para reactivar a personal directivo o superadministradores.' });
    if (existingUser.estatus === 'ACTIVO')
      return res.status(400).json({ error: 'Este usuario ya se encuentra activo en el sistema.' });

    const affectedRows = await userModel.activateUser(id, modificado_por);
    if (affectedRows === 0) return res.status(500).json({ error: 'Ocurrió un problema inesperado y no se pudo procesar la reactivación del usuario.' });

    logAudit({
      modulo:            'USUARIOS',
      accion:            'MODIFICACION',
      registro_afectado: `Usuario "${existingUser.nombres} ${existingUser.apellido_paterno}" #${id} — reactivado`,
      detalle:           null,
      usuario_id:        req.user?.id_usuario,
      usuario_rol:       rolNombre(req.user?.rol_id),
      ip_address:        getClientIp(req),
    });

    res.status(200).json({ message: 'Usuario reactivado exitosamente. Ya puede acceder al sistema.' });
  } catch (error) {
    console.error('[Error en userController - activateUser]:', error);
    res.status(500).json({ error: 'Error interno del servidor al intentar reactivar el usuario.' });
  }
};

/* ─────────────────────────────────────────────────── */

module.exports = {
  checkEmailExists,
  registerUser,
  getUsers,
  getUserById,
  updateUser,
  updateMyPhoto,
  deactivateUser,
  activateUser,
};