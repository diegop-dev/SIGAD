const nodemailer = require('nodemailer');

// Configuramos el "transporter" con Gmail y nuestras credenciales del .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ==========================================
// FUNCIÓN 1: Correo de Bienvenida (Registro)
// ==========================================
const enviarPasswordTemporal = async (emailDestino, nombreUsuario, passwordTemporal) => {
  try {
    const mailOptions = {
      from: `"Sistema SIGAD" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: 'Bienvenido a SIGAD - Tus Credenciales de Acceso',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="background-color: #0B1828; padding: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; letter-spacing: 2px; font-weight: 900; font-size: 24px;">SIGAD</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h3 style="color: #0B1828; margin-top: 0; font-size: 20px; font-weight: 900;">¡Hola, ${nombreUsuario}!</h3>
            <p style="color: #475569; line-height: 1.6; font-weight: 500;">
              Tu cuenta ha sido creada exitosamente en el <strong>Sistema de Gestión Académica y Docente (SIGAD)</strong>.
            </p>
            <p style="color: #475569; line-height: 1.6; font-weight: 500;">
              Tu contraseña de acceso temporal es la siguiente:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-left: 4px solid #0B1828; border-radius: 12px; padding: 20px; margin: 24px 0; box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);">
              <p style="margin: 5px 0; color: #0B1828; font-size: 14px;"><strong>Correo personal vinculado:</strong> ${emailDestino}</p>
              <p style="margin: 5px 0; color: #0B1828; font-size: 14px;"><strong>Contraseña temporal:</strong> <code style="font-family: monospace; font-size: 18px; font-weight: 900; color: #0B1828; letter-spacing: 1px;">${passwordTemporal}</code></p>
            </div>
            <p style="color: #ef4444; font-size: 14px; font-weight: bold;">
              ⚠️ Por tu seguridad, el sistema te pedirá que cambies esta contraseña la primera vez que inicies sesión.
            </p>
            <p style="color: #475569; font-size: 14px; margin-top: 30px; font-weight: 500;">
              Saludos cordiales,<br>
              <strong style="color: #0B1828; font-weight: 900;">El Equipo de Administración</strong>
            </p>
          </div>
        </div>
      `
    };

    // Enviamos el correo
    await transporter.sendMail(mailOptions);
    console.log(`Correo de bienvenida enviado exitosamente a: ${emailDestino}`);
    return true;

  } catch (error) {
    console.error('[Error de Nodemailer]: No se pudo enviar el correo a', emailDestino, error);
    return false;
  }
};

// ==========================================
// FUNCIÓN 2: Correo de Actualización (Edición)
// ==========================================
const enviarActualizacionCredenciales = async (emailDestino, nombreUsuario, nuevaPassword = null) => {
  try {
    // Si se cambió la contraseña, adjuntamos el bloque de contraseña
    const mensajePassword = nuevaPassword 
      ? `<p style="margin: 5px 0; color: #0B1828; font-size: 14px;"><strong>Nueva contraseña temporal:</strong> <code style="font-family: monospace; font-size: 18px; font-weight: 900; color: #0B1828; letter-spacing: 1px;">${nuevaPassword}</code></p>
         <p style="color: #ef4444; font-size: 14px; font-weight: bold;">⚠️ El sistema te pedirá que cambies esta contraseña en tu próximo inicio de sesión.</p>`
      : `<p style="margin: 5px 0; color: #16a34a; font-weight: bold;">Tu correo personal ha sido actualizado correctamente.</p>`;

    const mailOptions = {
      from: `"Sistema SIGAD" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: 'SIGAD - Actualización de Credenciales',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f1f5f9; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <div style="background-color: #0B1828; padding: 30px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; letter-spacing: 2px; font-weight: 900; font-size: 24px;">SIGAD</h2>
          </div>
          <div style="padding: 40px 30px; background-color: #ffffff;">
            <h3 style="color: #0B1828; margin-top: 0; font-size: 20px; font-weight: 900;">¡Hola, ${nombreUsuario}!</h3>
            <p style="color: #475569; line-height: 1.6; font-weight: 500;">
              Te informamos que ha habido una actualización en tu expediente y credenciales de acceso dentro del <strong>Sistema de Gestión Académica y Docente (SIGAD)</strong>.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-left: 4px solid #0B1828; border-radius: 12px; padding: 20px; margin: 24px 0; box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05);">
              <p style="margin: 5px 0; color: #0B1828; font-size: 14px;"><strong>Correo personal vinculado:</strong> ${emailDestino}</p>
              ${mensajePassword}
            </div>
            <p style="color: #475569; font-size: 14px; margin-top: 30px; font-weight: 500;">
              Si no solicitaste este cambio o desconoces esta acción, por favor contacta a la coordinación inmediatamente.<br><br>
              Saludos cordiales,<br>
              <strong style="color: #0B1828; font-weight: 900;">El Equipo de Administración</strong>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Correo de actualización enviado exitosamente a: ${emailDestino}`);
    return true;

  } catch (error) {
    console.error('[Error de Nodemailer]: No se pudo enviar el correo de actualización a', emailDestino, error);
    return false;
  }
};

module.exports = {
  enviarPasswordTemporal,
  enviarActualizacionCredenciales
};