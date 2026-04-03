const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto"); // Importamos crypto para generar la contraseña
const userModel = require("../models/userModel");
// Importamos ambas funciones del servicio de correos
const { enviarPasswordTemporal, enviarActualizacionCredenciales } = require("../services/emailService"); 

const getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("[Error en userController - getUsers]:", error);
    res.status(500).json({ error: "Error al consultar el listado de usuarios." });
  }
};

const registerUser = async (req, res) => {
  try {
    let {
      nombres,
      apellido_paterno,
      apellido_materno,
      personal_email,
      institutional_email,
      rol_id,
      creado_por,
    } = req.body;

    // ==========================================
    // NORMALIZACIÓN DE DATOS (PROTECCIÓN FINAL)
    // ==========================================
    nombres = nombres?.trim();
    apellido_paterno = apellido_paterno?.trim();
    apellido_materno = apellido_materno?.trim();
    personal_email = personal_email?.trim().toLowerCase();
    institutional_email = institutional_email?.trim().toLowerCase();

    const foto_perfil_url = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    // Ya no exigimos password_raw desde el cliente
    if (
      !nombres || !apellido_paterno || !apellido_materno ||
      !personal_email || !institutional_email ||
      !rol_id || !creado_por
    ) {
      return res.status(400).json({ error: "Faltan campos obligatorios para el registro." });
    }

    const existingUser = await userModel.findExistingEmails(
      personal_email,
      institutional_email
    );
    if (existingUser) {
      return res.status(409).json({
        error: "Uno de los correos proporcionados ya se encuentra registrado en el sistema.",
      });
    }

    // ==========================================
    // GENERACIÓN DE CONTRASEÑA TEMPORAL SEGURA
    // ==========================================
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let password_generada = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, charset.length);
      password_generada += charset[randomIndex];
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password_generada, saltRounds);

    const newUserId = await userModel.createUser({
      nombres,
      apellido_paterno,
      apellido_materno,
      personal_email,
      institutional_email,
      password_hash,
      foto_perfil_url,
      rol_id,
      creado_por,
    });

    // ========================================================
    // ENVÍO DE CORREO ELECTRÓNICO (No bloqueante)
    // ========================================================
    enviarPasswordTemporal(personal_email, nombres, password_generada)
      .then(enviado => {
        if (!enviado) {
          console.error(`[Aviso] El usuario ${nombres} se creó, pero falló el envío de correo a ${personal_email}.`);
        }
      });
    // ========================================================

    res.status(201).json({
      message: "Usuario registrado exitosamente y credenciales enviadas por correo.",
      usuarioId: newUserId,
      password_temporal: password_generada, 
      nota: "El usuario deberá cambiar su contraseña temporal en el primer inicio de sesión.",
    });
  } catch (error) {
    console.error("[Error en userController - registerUser]:", error);
    res.status(500).json({ error: "Error interno del servidor al procesar el registro." });
  }
};

// ==========================================
// HU-03 MODIFICAR USUARIO CON RBAC ESTRICTO
// ==========================================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params; 
    let {
      nombres,
      apellido_paterno,
      apellido_materno,
      personal_email,
      institutional_email,
      password_raw,
      rol_id,
      estatus,
      modificado_por
    } = req.body;

    const currentUserId = req.user?.id_usuario;
    const currentUserRole = req.user?.rol_id;

    if (!currentUserId || !currentUserRole) {
       return res.status(401).json({ error: "No se pudo identificar al usuario que realiza la petición." });
    }

    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // VALIDACIONES FUERTES DE RBAC (JERARQUÍA)
    const isSelf = Number(currentUserId) === Number(existingUser.id_usuario);

    if (isSelf && (currentUserRole === 1 || currentUserRole === 2)) {
      return res.status(403).json({ error: "Acceso denegado: Para modificar tus propios datos, utiliza la sección 'Mi Perfil'." });
    }

    if (!isSelf) {
      if (currentUserRole === 1 && existingUser.rol_id === 1) {
        return res.status(403).json({ error: "Acceso denegado para la edición de un superadministrador." });
      }
      if (currentUserRole === 2 && (existingUser.rol_id === 1 || existingUser.rol_id === 2)) {
        return res.status(403).json({ error: "Acceso denegado para la edición de directivos." });
      }
    }

    if (currentUserRole === 2 && Number(rol_id) === 1) {
      return res.status(403).json({ error: "Acceso denegado: No tienes permisos para asignar el rol de Superadministrador." });
    }

    // NORMALIZACIÓN DE DATOS ANTES DE ACTUALIZAR
    const updateData = {
      nombres: nombres?.trim(),
      apellido_paterno: apellido_paterno?.trim(),
      apellido_materno: apellido_materno?.trim(),
      personal_email: personal_email?.trim().toLowerCase(),
      institutional_email: institutional_email?.trim().toLowerCase(),
      rol_id,
      modificado_por
    };

    const emailCollision = await userModel.findExistingEmailsExceptUser(
      updateData.personal_email,
      updateData.institutional_email,
      id
    );
    if (emailCollision) {
      return res.status(409).json({
        error: "Uno de los correos ya está en uso por otro usuario del sistema."
      });
    }

    if (estatus) {
      updateData.estatus = estatus;
    }

    // ========================================================
    // DETECTORES DE CAMBIOS PARA EL CORREO
    // ========================================================
    const passwordChanged = password_raw && password_raw.trim() !== "";
    const emailChanged = updateData.personal_email && updateData.personal_email !== existingUser.personal_email;

    if (passwordChanged) {
      const saltRounds = 10;
      updateData.password_hash = await bcrypt.hash(password_raw, saltRounds);
      updateData.es_password_temporal = 1; 
    }

    if (req.file) {
      updateData.foto_perfil_url = `/uploads/profiles/${req.file.filename}`;

      if (existingUser.foto_perfil_url) {
        const oldPhotoPath = path.join(__dirname, '..', existingUser.foto_perfil_url);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
    }

    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const affectedRows = await userModel.updateUser(id, updateData);
    
    if (affectedRows === 0) {
      return res.status(400).json({ error: "No se enviaron datos para actualizar o el usuario es idéntico." });
    }

    // ========================================================
    // INYECCIÓN: ENVÍO DE CORREO SI CAMBIÓ CORREO O CONTRASEÑA
    // ========================================================
    if (emailChanged || passwordChanged) {
      const emailAEnviar = updateData.personal_email || existingUser.personal_email;
      const nombreUsuario = updateData.nombres || existingUser.nombres;
      const passwordAEnviar = passwordChanged ? password_raw : null;

      enviarActualizacionCredenciales(emailAEnviar, nombreUsuario, passwordAEnviar)
        .then(enviado => {
          if (!enviado) console.error(`[Aviso] Falló el envío de correo de actualización a ${emailAEnviar}`);
        });
    }
    // ========================================================

    res.status(200).json({ message: "Expediente de usuario actualizado exitosamente." });

  } catch (error) {
    console.error("[Error en userController - updateUser]:", error);
    res.status(500).json({ error: "Error interno del servidor al actualizar el usuario." });
  }
};

// ==========================================
// HU-04 DESACTIVAR USUARIO (SOFT DELETE)
// ==========================================
const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { eliminado_por } = req.body;

    const currentUserId = req.user?.id_usuario;
    const currentUserRole = req.user?.rol_id;

    if (!currentUserId || !currentUserRole || !eliminado_por) {
      return res.status(400).json({ error: "Datos de auditoría incompletos para la desactivación." });
    }

    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (Number(currentUserId) === Number(existingUser.id_usuario)) {
      return res.status(403).json({ error: "Acceso denegado: No puedes desactivar tu propia cuenta." });
    }

    if (currentUserRole === 1 && existingUser.rol_id === 1) {
      return res.status(403).json({ error: "Acceso denegado: No puedes desactivar a otros Superadministradores." });
    }

    if (currentUserRole === 2 && (existingUser.rol_id === 1 || existingUser.rol_id === 2)) {
      return res.status(403).json({ error: "Acceso denegado: No tienes permisos para desactivar a personal directivo." });
    }

    if (existingUser.estatus === 'INACTIVO') {
      return res.status(400).json({ error: "Este usuario ya se encuentra inactivo." });
    }

    // =================================================================
    // INYECCIÓN: VALIDACIÓN DE INTEGRIDAD PARA DOCENTES EN ASIGNACIONES
    // =================================================================
    // Nota: Se asume que el ID 3 corresponde al rol "Docente" en el catálogo de Roles.
    if (existingUser.rol_id === 3) {
      const tieneAsignaciones = await userModel.checkDependenciasDocente(id);
      
      if (tieneAsignaciones) {
        return res.status(409).json({ 
          error: "Conflicto de integridad relacional",
          detalles: "No es posible desactivar este usuario. Cuenta con un expediente docente vinculado a una carga horaria activa. Debe liberar las asignaciones y eliminar el expediente previamente." 
        });
      }
    }
    // =================================================================

    const affectedRows = await userModel.deactivateUser(id, eliminado_por);
    
    if (affectedRows === 0) {
      return res.status(500).json({ error: "No se pudo procesar la desactivación del usuario." });
    }

    res.status(200).json({ message: "Usuario desactivado exitosamente. Se le ha revocado el acceso al sistema." });

  } catch (error) {
    console.error("[Error en userController - deactivateUser]:", error);
    res.status(500).json({ error: "Error interno del servidor al desactivar el usuario." });
  }
};

// ==========================================
// NUEVO: REACTIVAR USUARIO
// ==========================================
const activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { modificado_por } = req.body;

    const currentUserId = req.user?.id_usuario;
    const currentUserRole = req.user?.rol_id;

    if (!currentUserId || !currentUserRole || !modificado_por) {
      return res.status(400).json({ error: "Datos de auditoría incompletos para la reactivación." });
    }

    const existingUser = await userModel.findUserById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    if (currentUserRole === 1 && existingUser.rol_id === 1 && Number(currentUserId) !== Number(existingUser.id_usuario)) {
      return res.status(403).json({ error: "Acceso denegado: No puedes reactivar a otros Superadministradores." });
    }

    if (currentUserRole === 2 && (existingUser.rol_id === 1 || existingUser.rol_id === 2)) {
      return res.status(403).json({ error: "Acceso denegado: No tienes permisos para reactivar a personal directivo." });
    }

    if (existingUser.estatus === 'ACTIVO') {
      return res.status(400).json({ error: "Este usuario ya se encuentra activo." });
    }

    const affectedRows = await userModel.activateUser(id, modificado_por);
    
    if (affectedRows === 0) {
      return res.status(500).json({ error: "No se pudo procesar la reactivación del usuario." });
    }

    res.status(200).json({ message: "Usuario reactivado exitosamente. Ya puede acceder al sistema." });

  } catch (error) {
    console.error("[Error en userController - activateUser]:", error);
    res.status(500).json({ error: "Error interno del servidor al reactivar el usuario." });
  }
};

module.exports = {
  registerUser,
  getUsers,
  updateUser,
  deactivateUser,
  activateUser
};