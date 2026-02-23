const bcrypt = require("bcrypt");
const userModel = require("../models/userModel");

const getUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("[Error en userController - getUsers]:", error);
    res
      .status(500)
      .json({ error: "Error al consultar el listado de usuarios." });
  }
};
// Recuerda exportarlo al final: module.exports = { registerUser, getUsers };

const registerUser = async (req, res) => {
  try {
    const {
      nombres,
      apellido_paterno,
      apellido_materno,
      personal_email,
      institutional_email,
      password_raw,
      rol_id,
      creado_por,
    } = req.body;

    // Dentro de tu función registerUser, justo después de extraer req.body:
    const foto_perfil_url = req.file
      ? `/uploads/profiles/${req.file.filename}`
      : null;

    // Validación de campos obligatorios según el esquema SQL (NOT NULL)
    if (
      !nombres ||
      !apellido_paterno ||
      !apellido_materno ||
      !personal_email ||
      !institutional_email ||
      !password_raw ||
      !rol_id ||
      !creado_por
    ) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios para el registro." });
    }

    // Validación de duplicidad de correos
    const existingUser = await userModel.findExistingEmails(
      personal_email,
      institutional_email,
    );
    if (existingUser) {
      return res.status(409).json({
        error:
          "Uno de los correos proporcionados (personal o institucional) ya se encuentra registrado en el sistema.",
      });
    }

    // Encriptación de la contraseña temporal proporcionada por el administrador
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password_raw, saltRounds);

    // Ejecución de la inserción en base de datos
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

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      usuarioId: newUserId,
      nota: "El usuario deberá cambiar su contraseña temporal en el primer inicio de sesión.",
    });
  } catch (error) {
    console.error("[Error en userController - registerUser]:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor al procesar el registro." });
  }
};

module.exports = {
  registerUser,
  getUsers,
};
