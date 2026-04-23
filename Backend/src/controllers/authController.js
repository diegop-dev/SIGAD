const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');
const userModel = require('../models/userModel');
const { logAudit, getClientIp } = require('../services/auditService');

// Configuración de seguridad para el Login
const MAX_INTENTOS_FALLIDOS = 5;
const TIEMPO_BLOQUEO_MINUTOS = 15;

/* ── Mapa de roles (único punto de mantenimiento) ── */
const ROL_NOMBRES = {
  1: 'Superadministrador',
  2: 'Administrador',
  3: 'Docente',
};
const rolNombre = (rol_id) => ROL_NOMBRES[rol_id] ?? 'Desconocido';

/* ─────────────────────────────────────────────────── */

const inicioDeSesion = async (req, res) => {
  try {
    let { institutional_email, password_raw } = req.body;

    if (typeof institutional_email !== 'string' || typeof password_raw !== 'string') {
      return res.status(400).json({ error: 'Formato de datos inválido. Se esperaban cadenas de texto.' });
    }

    if (password_raw.trim().length === 0) {
      return res.status(400).json({ error: 'Ingrese una contraseña' });
    }

    institutional_email = institutional_email.trim();
    password_raw = password_raw.trim();

    if (/\s/.test(institutional_email)) {
      return res.status(400).json({ error: 'El correo electrónico no debe contener espacios.' });
    }

    if ((institutional_email.match(/@/g) || []).length > 1) {
      return res.status(400).json({ error: 'El correo electrónico contiene un formato inválido (múltiples "@").' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(institutional_email)) {
      return res.status(400).json({ error: 'Ingrese un formato de correo electrónico válido.' });
    }

    const user = await authModel.encontrarPorCorreoInstitucional(institutional_email);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas. Verifique su correo y contraseña.' });
    }

    if (user.bloqueado_hasta) {
      const ahora = new Date();
      const tiempoDesbloqueo = new Date(user.bloqueado_hasta);

      if (ahora < tiempoDesbloqueo) {
        return res.status(403).json({
          error: `Cuenta bloqueada temporalmente por seguridad. Intente de nuevo más tarde.`
        });
      } else {
        await authModel.resetearIntento(institutional_email);
        user.intentos_fallidos = 0;
      }
    }

    if (user.estatus !== 'ACTIVO') {
      return res.status(403).json({ error: 'La cuenta de usuario se encuentra inactiva o suspendida. Contacte a soporte.' });
    }

    const isMatch = await bcrypt.compare(password_raw, user.password_hash);

    if (!isMatch) {
      const nuevosFallos = (user.intentos_fallidos || 0) + 1;

      if (nuevosFallos >= MAX_INTENTOS_FALLIDOS) {
        const lockUntil = new Date(Date.now() + TIEMPO_BLOQUEO_MINUTOS * 60 * 1000);
        await authModel.bloquearCuenta(institutional_email, lockUntil);

        logAudit({
          modulo: 'AUTH',
          accion: 'CUENTA_BLOQUEADA',
          registro_afectado: `Usuario #${user.id_usuario}`,
          detalle: `Bloqueo por ${MAX_INTENTOS_FALLIDOS} intentos fallidos`,
          usuario_id:  user.id_usuario,
          usuario_rol: rolNombre(user.rol_id), // ← fix
          ip_address:  getClientIp(req),
        });

        return res.status(401).json({
          error: `Demasiados intentos fallidos. Su cuenta ha sido bloqueada por ${TIEMPO_BLOQUEO_MINUTOS} minutos.`
        });
      } else {
        await authModel.registrarIntentoFallido(institutional_email);
        return res.status(401).json({
          error: `Credenciales inválidas. Le quedan ${MAX_INTENTOS_FALLIDOS - nuevosFallos} intento(s) antes de bloquear la cuenta.`
        });
      }
    }

    await authModel.resetearIntento(institutional_email);

    const payload = {
      id_usuario: user.id_usuario,
      rol_id: user.rol_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    logAudit({
      modulo: 'AUTH',
      accion: 'LOGIN',
      registro_afectado: `Usuario #${user.id_usuario} (${institutional_email})`,
      detalle: null,
      usuario_id:  user.id_usuario,
      usuario_rol: rolNombre(user.rol_id), // ← fix
      ip_address:  getClientIp(req),
    });

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id_usuario:           user.id_usuario,
        nombres:              user.nombres,
        apellido_paterno:     user.apellido_paterno,
        rol_id:               user.rol_id,
        foto_perfil_url:      user.foto_perfil_url,
        es_password_temporal: user.es_password_temporal,
      },
    });

  } catch (error) {
    console.error('[Error en authController - login]:', error);
    res.status(500).json({ error: 'Error interno del servidor durante la autenticación. Por favor, intente más tarde.' });
  }
};

/* ─────────────────────────────────────────────────── */

const cambiarContraseñaTemporal = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario;
    const { new_password } = req.body;

    if (!id_usuario) {
      return res.status(401).json({ error: 'No autorizado. Se requiere sesión activa.' });
    }

    if (!new_password || new_password.trim() === '') {
      return res.status(400).json({ error: 'La nueva contraseña es obligatoria.' });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }

    if (/\s/.test(new_password)) {
      return res.status(400).json({ error: 'La contraseña no puede contener espacios.' });
    }

    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    const updateData = {
      password_hash,
      es_password_temporal: 0,
      modificado_por: id_usuario,
    };

    const affectedRows = await userModel.updateUser(id_usuario, updateData);

    if (affectedRows === 0) {
      return res.status(400).json({ error: 'No se pudo procesar el cambio de contraseña.' });
    }

    logAudit({
      modulo: 'AUTH',
      accion: 'CAMBIO_CONTRASENA',
      registro_afectado: `Usuario #${id_usuario}`,
      detalle: null,
      usuario_id:  id_usuario,
      usuario_rol: rolNombre(req.user?.rol_id), // ← fix — rol_id viene del JWT decodificado
      ip_address:  getClientIp(req),
    });

    res.status(200).json({
      message: 'Contraseña actualizada con éxito. ¡Bienvenido al sistema!',
      es_password_temporal: 0,
    });

  } catch (error) {
    console.error('[Error en authController - changeTemporaryPassword]:', error);
    res.status(500).json({ error: 'Error interno al cambiar la contraseña temporal.' });
  }
};

module.exports = {
  inicioDeSesion,
  cambiarContraseñaTemporal,
};