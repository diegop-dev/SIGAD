export const REGEX = {
  // Solo números enteros
  NUMEROS: /^\d+$/,
  
  // Números enteros o decimales (hasta 2 decimales)
  NUMEROS_DECIMALES: /^\d+(\.\d{1,2})?$/,
  
  // Solo letras (incluye acentos y eñes) y espacios — sin doble espacio
  LETRAS_Y_ESPACIOS: /^(?!.*\s{2})[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  
  // Letras, números y espacios — sin doble espacio
  ALFANUMERICO_ESPACIOS: /^(?!.*\s{2})[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/,
  
  // Alfanuméricos y guiones (ej. A-101) sin espacios
  ALFANUMERICO_GUIONES: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\-]+$/,
  
  // Alfanuméricos, espacios, puntos y guiones (ej. Lab. Cómputo 1 o A-101) — sin doble espacio
  ALFANUMERICO_ESPACIOS_PUNTUACION: /^(?!.*\s{2})[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\.\-]+$/,
  
  // Correo electrónico estándar
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Cualquier carácter excepto espacios
  SIN_ESPACIOS: /^[^\s]+$/,
  
  // Año exactamente de 4 dígitos
  ANIO: /^\d{4}$/,
  
  // Nombres (permite letras y un solo espacio intermedio)
  NOMBRES: /^[a-zA-ZÀ-ÿ\u00f1\u00d1]+(\s[a-zA-ZÀ-ÿ\u00f1\u00d1]+)*$/,
  
  // Contraseña fuerte (Mín 8 chars, 1 mayús, 1 número, sin espacios)
  PASSWORD_FUERTE_SIN_ESPACIOS: /^(?=.*[A-Z])(?=.*\d)[^\s]{8,}$/,

  // Triple letra repetida consecutiva (ej. "Juaaan", "Marrría") → uso negativo: si hace match, es inválido
  TRIPLE_LETRA_REPETIDA: /(.)\1{2,}/i,

  // Nombre de materia: letras, espacios, puntos, guiones y dígitos aislados — sin doble espacio ni dígitos consecutivos
  // Válido: "Matemáticas 1", "Cálculo I", "Lab. Cómputo 2"  | Inválido: "Cálculo 11", "Física 101"
  NOMBRE_MATERIA: /^(?!.*\d{2})(?!.*\s{2})[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.\-0-9]+$/,

  // Extrae solo letras (con acentos y eñe) de un string — útil para contar letras reales ignorando dígitos y símbolos
  // Uso: valor.replace(REGEX.SOLO_LETRAS, '').length  → cantidad de letras
  SOLO_LETRAS: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g
};
