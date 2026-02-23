import axios from 'axios';

// Instanciación del cliente base apuntando a la URL de nuestro backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  // Eliminamos el Content-Type forzado para que Axios decida dinámicamente
});

// Interceptor de peticiones (Request): Se ejecuta antes de enviar cualquier solicitud
api.interceptors.request.use(
  (config) => {
    // Extracción del token JWT desde el almacenamiento local del navegador
    const token = localStorage.getItem('sigad_jwt');
    
    // Si existe un token de sesión, lo inyectamos automáticamente en las cabeceras
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Si la configuración de la petición falla antes de salir, rechazamos la promesa
    return Promise.reject(error);
  }
);

// Interceptor de respuestas (Response): Se ejecuta al recibir la contestación del servidor
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa (códigos 200-299), la dejamos pasar intacta
    return response;
  },
  (error) => {
    // Manejo global defensivo: intercepción de códigos HTTP 401 (No autorizado)
    if (error.response && error.response.status === 401) {
      console.warn('[Seguridad SIGAD] Token inválido o expirado. Purgando credenciales.');
      
      // Eliminamos los rastros de sesión comprometida o caducada
      localStorage.removeItem('sigad_jwt');
      localStorage.removeItem('sigad_user');
      
      // Si el usuario no está ya en la página de login, lo redirigimos forzosamente
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Propagamos el error para que el componente visual pueda mostrar un mensaje
    return Promise.reject(error);
  }
);

export default api;
