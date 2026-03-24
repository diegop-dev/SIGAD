/**
 * toastMessages.js
 * Mensajes centralizados para notificaciones toast del sistema SIGAD.
 * Importar solo el namespace necesario en cada módulo.
 *
 * Convenciones:
 *  - Oración completa con punto final.
 *  - Estados de carga (loading) sin punto final — son transitorios.
 *  - Minúscula después de ":" en mensajes de acceso denegado.
 *  - Tono institucional, sin términos técnicos expuestos al usuario.
 */

// ─── Mensajes compartidos entre módulos ────────────────────────────────────
export const TOAST_COMMON = {
  enDesarrollo:                  'Esta función estará disponible próximamente.',
  errorServidor:                 'No se pudo conectar con el servidor. Intenta de nuevo.',
  contrasenaCopiadaPortapapeles: 'Contraseña copiada al portapapeles.',
};

// ─── Módulo: Carreras ───────────────────────────────────────────────────────
export const TOAST_CARRERAS = {
  // Carga
  errorCarga:          'Error al cargar el catálogo de carreras.',
  errorCargaAcademias: 'No se pudieron cargar las academias.',

  // Loading (estados transitorios)
  loadingGuardar:    'Guardando carrera',
  loadingActualizar: 'Actualizando carrera',

  // CRUD — resultado
  guardadoOk:    'Carrera registrada correctamente.',
  actualizadoOk: 'Carrera actualizada correctamente.',

  // Validación
  camposInvalidos:    'Corrige los campos señalados antes de continuar.',
  errorCamposBackend: 'El servidor rechazó algunos datos. Revisa el formulario.',
};

// ─── Módulo: Usuarios ───────────────────────────────────────────────────────
export const TOAST_USUARIOS = {
  // Carga
  errorCarga: 'Error al cargar el listado de usuarios.',

  // Loading (estados transitorios)
  loadingRegistrar:  'Registrando usuario',
  loadingActualizar: 'Actualizando expediente',

  // CRUD — resultado
  registradoOk:  'Usuario registrado exitosamente.',
  actualizadoOk: 'Usuario actualizado exitosamente.',

  // Validación
  camposInvalidos:    'Corrige los campos señalados antes de continuar.',
  errorCamposBackend: 'El servidor rechazó algunos datos. Revisa el formulario.',

  // Control de acceso
  accesoDenegadoVerSuperAdmin:
    'Acceso denegado: no puedes consultar expedientes de otros Superadministradores.',
  accesoDenegadoVerRol:
    'Acceso denegado: tu rol solo permite consultar expedientes de docentes.',
  accesoDenegadoPropioPerfil:
    "Para modificar tus propios datos, utiliza la sección 'Mi Perfil'.",
  accesoDenegadoModificarSuperAdmin:
    'Acceso denegado: no puedes modificar a otro Superadministrador.',
  accesoDenegadoModificarDirectivos:
    'Acceso denegado: no tienes permiso para modificar directivos.',

  // Estado del registro
  yaInactivo: 'Este usuario ya se encuentra inactivo.',
  yaActivo:   'Este usuario ya se encuentra activo.',
};

// ─── Módulo: Horarios ───────────────────────────────────────────────────────
export const TOAST_HORARIOS = {
  // Carga
  errorCarga: 'Error al cargar el horario. Intenta de nuevo.',

  // PDF — estados transitorios (sin punto final)
  loadingPDF: 'Generando tu horario oficial en PDF',

  // PDF — resultado
  pdfDescargadoOk: 'Horario descargado exitosamente.',
  errorPDF:        'No se pudo generar el PDF. Intenta de nuevo.',
};

// ─── Módulo: Docentes ───────────────────────────────────────────────────────
export const TOAST_DOCENTES = {
  // Carga
  errorCarga:          'Error al cargar el listado de docentes.',
  errorCargaAcademias: 'Error al cargar el catálogo de academias.',

  // Loading (estados transitorios)
  loadingRegistrar:  'Registrando credenciales y expediente',
  loadingActualizar: 'Actualizando expediente',

  // CRUD — resultado
  registradoOk:  'Alta de docente completada exitosamente.',
  actualizadoOk: 'Expediente actualizado correctamente.',

  // Validación y archivos
  archivoFormatoInvalido: 'El archivo debe ser del formato correcto.',
  validarPaso1:           'Verifica los datos de usuario antes de continuar.',
  rfcCurpInvalido:        'Corrige el formato de RFC o CURP antes de continuar.',
  errorCamposBackend:     'El servidor rechazó algunos datos. Revisa el formulario.',

  // Estado del registro
  yaInactivo: 'Este docente ya se encuentra inactivo.',
};