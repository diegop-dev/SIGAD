const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');

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
        es_password_temporal: user.es_password_temporal
      }
    });

  } catch (error) {
    console.error('[Error en authController - login]:', error);
    res.status(500).json({ error: 'Error interno del servidor durante la autenticación.' });
  }
};

module.exports = {
  login
};
