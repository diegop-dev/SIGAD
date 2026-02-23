import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

// Inicialización del contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Efecto secundario para verificar si ya existe una sesión activa al recargar la página
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('sigad_jwt');
      const storedUser = localStorage.getItem('sigad_user');

      if (token && storedUser) {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Función asíncrona para iniciar sesión conectándose a la API REST
  const login = async (institutional_email, password_raw) => {
    try {
      const response = await api.post('/auth/login', {
        institutional_email,
        password_raw
      });

      const { token, usuario } = response.data;

      // Persistencia de credenciales en el navegador
      localStorage.setItem('sigad_jwt', token);
      localStorage.setItem('sigad_user', JSON.stringify(usuario));

      // Actualización del estado global en memoria
      setUser(usuario);
      setIsAuthenticated(true);

      return { success: true, rol_id: usuario.rol_id };
    } catch (error) {
      console.error('[AuthContext - login]:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error de conexión con el servidor.' 
      };
    }
  };

  // Función para cerrar sesión y limpiar el rastro de auditoría local
  const logout = () => {
    localStorage.removeItem('sigad_jwt');
    localStorage.removeItem('sigad_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
