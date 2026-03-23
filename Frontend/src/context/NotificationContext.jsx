import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth(); // Usamos la sesión para saber si debemos buscar
  const [notifications, setNotifications] = useState([]);

  // Función para obtener las notificaciones desde el backend
  const fetchNotifications = useCallback(async () => {
    if (!user) return; // Si no hay sesión, no buscamos
    try {
      const response = await api.get('/notificaciones');
      const data = response.data.data || response.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error);
    }
  }, [user]);

  // Sincronización automática: Busca al cargar y luego cada 60 segundos
  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 60000); // Polling cada 1 minuto (60000ms)

    return () => clearInterval(intervalId); // Limpiamos el intervalo si se desmonta
  }, [fetchNotifications]);

  // Actualización optimista: Borramos localmente y luego le avisamos al backend
  const removeNotification = async (id) => {
    // 1. Lo quitamos de la vista inmediatamente para una sensación de rapidez
    setNotifications(prev => prev.filter(n => n.id !== id));
    
    try {
      // 2. Le avisamos a la BD que ya fue leída
      await api.patch(`/notificaciones/${id}/leer`);
    } catch (error) {
      console.error("Error al marcar como leída:", error);
      fetchNotifications(); // Si falla, recargamos para recuperar la alerta
    }
  };

  // Limpiar todas las notificaciones
  const clearNotifications = async () => {
    const actuales = [...notifications];
    setNotifications([]); // Limpiamos la vista
    
    try {
      // Ejecutamos la petición de lectura para cada una en paralelo
      await Promise.all(
        actuales.map(n => api.patch(`/notificaciones/${n.id}/leer`).catch(e => e))
      );
    } catch (error) {
      console.error("Error al limpiar notificaciones:", error);
      fetchNotifications();
    }
  };

  return (
    <NotificationContext.Provider
      value={{ 
        notifications, 
        removeNotification, 
        clearNotifications,
        fetchNotifications // Lo exponemos por si quieres forzar recargas manuales en otros componentes
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  return ctx;
};