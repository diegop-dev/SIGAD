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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #1e293b; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; letter-spacing: 2px;">SIGAD</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h3 style="color: #334155; margin-top: 0;">¡Hola, ${nombreUsuario}!</h3>
            <p style="color: #64748b; line-height: 1.6;">
              Tu cuenta ha sido creada exitosamente en el <strong>Sistema de Gestión Académica y Docente (SIGAD)</strong>.
            </p>
            <p style="color: #64748b; line-height: 1.6;">
              Tu contraseña de acceso temporal es la siguiente:
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #334155;"><strong>Correo personal vinculado:</strong> ${emailDestino}</p>
              <p style="margin: 5px 0; color: #334155;"><strong>Contraseña temporal:</strong> <span style="font-family: monospace; font-size: 16px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${passwordTemporal}</span></p>
            </div>
            <p style="color: #ef4444; font-size: 14px; font-weight: bold;">
              ⚠️ Por tu seguridad, el sistema te pedirá que cambies esta contraseña la primera vez que inicies sesión.
            </p>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Saludos cordiales,<br>
              <strong>El Equipo de Administración</strong>
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
      ? `<p style="margin: 5px 0; color: #334155;"><strong>Nueva contraseña temporal:</strong> <span style="font-family: monospace; font-size: 16px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${nuevaPassword}</span></p>
         <p style="color: #ef4444; font-size: 14px; font-weight: bold;">⚠️ El sistema te pedirá que cambies esta contraseña en tu próximo inicio de sesión.</p>`
      : `<p style="margin: 5px 0; color: #10b981; font-weight: bold;">Tu correo personal ha sido actualizado correctamente.</p>`;

    const mailOptions = {
      from: `"Sistema SIGAD" <${process.env.EMAIL_USER}>`,
      to: emailDestino,
      subject: 'SIGAD - Actualización de Credenciales',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
          <div style="background-color: #1e293b; padding: 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; letter-spacing: 2px;">SIGAD</h2>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <h3 style="color: #334155; margin-top: 0;">¡Hola, ${nombreUsuario}!</h3>
            <p style="color: #64748b; line-height: 1.6;">
              Te informamos que ha habido una actualización en tu expediente y credenciales de acceso dentro del <strong>Sistema de Gestión Académica y Docente (SIGAD)</strong>.
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #334155;"><strong>Correo personal vinculado:</strong> ${emailDestino}</p>
              ${mensajePassword}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Si no solicitaste este cambio o desconoces esta acción, por favor contacta a la coordinación inmediatamente.<br><br>
              Saludos cordiales,<br>
              <strong>El Equipo de Administración</strong>
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