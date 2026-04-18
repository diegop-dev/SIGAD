/**
 * Utilidad global para formatear automáticamente la entrada de texto
 * a mayúsculas, respetando excepciones como correos y contraseñas.
 */

const EMAIL_KEYWORDS = ['email', 'correo', 'institucional', 'personal'];
const PASSWORD_KEYWORDS = ['password', 'contraseña', 'clave', 'pass'];

/**
 * Normaliza y formatea un valor a mayúsculas basado en el contexto de su nombre o tipo.
 * @param {string} value - El valor introducido por el usuario.
 * @param {string} name - Atributo 'name' del input para inferir contexto (opcional).
 * @param {string} type - Atributo 'type' del input (opcional).
 * @returns {string} El valor formateado (en mayúsculas o en su formato original si está exceptuado).
 */
export const formatToGlobalUppercase = (value, name = '', type = 'text') => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return value;

  const lowerName = name.toLowerCase();

  // Excepciones por tipo de input estricto
  if (type === 'email' || type === 'password') {
    // Si es tipo email, lo forzamos a minúsculas
    if (type === 'email') return value.toLowerCase();
    return value;
  }

  // Excepciones por palabras clave en el nombre del campo
  const isEmailField = EMAIL_KEYWORDS.some(keyword => lowerName.includes(keyword));
  const isPasswordField = PASSWORD_KEYWORDS.some(keyword => lowerName.includes(keyword));

  if (isEmailField || isPasswordField) {
    if (isEmailField) return value.toLowerCase();
    return value;
  }

  // Aplica mayúsculas al resto de campos por defecto
  return value.toUpperCase();
};

/**
 * Middleware para envolver el evento onChange de React antes de pasarlo
 * a la función de estado (handleChange original o setState).
 * 
 * Uso:
 * onChange={(e) => handleGlobalUppercaseChange(e, handleChange)}
 * 
 * @param {Object} e - Evento original de React onChange.
 * @param {Function} callback - Función a ejecutar con el evento modificado.
 * @returns {void}
 */
export const handleGlobalUppercaseChange = (e, callback) => {
  if (!e || !e.target) {
    if (typeof callback === 'function') callback(e);
    return;
  }

  const { name, value, type } = e.target;
  const formattedValue = formatToGlobalUppercase(value, name, type);
  
  // Clonar el evento para reemplazar el 'value' con el texto ya formateado
  const syntheticEvent = {
    ...e,
    target: {
      ...e.target,
      name,
      type,
      value: formattedValue,
    }
  };

  if (typeof callback === 'function') {
    callback(syntheticEvent);
  }
};
