const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');
const userModel = require('../models/userModel'); // Importamos el userModel para poder reutilizar el updateUser

const login = async (req, res) => {
  try {
    const { institutional_email, password_raw } = req.body;

    if (!institutional_email || !password_raw) {
      return res.status(400).json({ error: 'El correo institucional y la contraseña son obligatorios.' });
    }

    // Búsqueda del usuario en la base de datos
    const user = await authModel.findByInstitutionalEmail(institutional_email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Validación del estado del usuario (control de acceso)
    if (user.estatus !== 'ACTIVO') {
      return res.status(403).json({ error: 'La cuenta de usuario se encuentra inactiva o suspendida.' });
    }

    // Verificación criptográfica de la contraseña
    const isMatch = await bcrypt.compare(password_raw, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generación del payload para el token JWT
    const payload = {
      id_usuario: user.id_usuario,
      rol_id: user.rol_id
    };

    // Firma del token con la llave secreta del servidor
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    // Respuesta exitosa al cliente (excluyendo datos sensibles como el hash)
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombres: user.nombres,
        apellido_paterno: user.apellido_paterno,
        rol_id: user.rol_id,
        foto_perfil_url: user.foto_perfil_url,
        es_password_temporal: user.es_password_temporal // <--- El Frontend usará esto
      }
    });

  } catch (error) {
    console.error('[Error en authController - login]:', error);
    res.status(500).json({ error: 'Error interno del servidor durante la autenticación.' });
  }
};

// ==========================================
// NUEVO: CAMBIO DE CONTRASEÑA TEMPORAL
// ==========================================
const changeTemporaryPassword = async (req, res) => {
  try {
    // El usuario ya debe estar logueado (tener token) para llegar aquí
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

    // 1. Encriptamos la nueva contraseña de forma segura
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    // 2. Usamos el modelo de usuario para actualizar dinámicamente
    const updateData = {
      password_hash: password_hash,
      es_password_temporal: 0, // Apagamos la bandera para que no lo vuelva a molestar
      modificado_por: id_usuario // Dejamos rastro de que el mismo usuario lo cambió
    };

    const affectedRows = await userModel.updateUser(id_usuario, updateData);

    if (affectedRows === 0) {
      return res.status(400).json({ error: 'No se pudo procesar el cambio de contraseña.' });
    }

    // Respuesta exitosa. El usuario no necesita volver a loguearse.
    res.status(200).json({ 
      message: 'Contraseña actualizada con éxito. ¡Bienvenido al sistema!',
      es_password_temporal: 0 // Le avisamos al frontend que ya se apagó
    });

  } catch (error) {
    console.error('[Error en authController - changeTemporaryPassword]:', error);
    res.status(500).json({ error: 'Error interno al cambiar la contraseña temporal.' });
  }
};

module.exports = {
  login,
  changeTemporaryPassword // Exportamos la nueva función
};
