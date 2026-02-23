import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Previene redirecciones erróneas mientras React lee el almacenamiento local
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">Verificando sesión segura...</span>
      </div>
    );
  }

  // Si no hay un token válido, se expulsa al usuario a la pantalla de acceso
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Control de acceso basado en roles (RBAC)
  // Si la ruta exige roles específicos y el rol del usuario no está incluido, se bloquea
  if (allowedRoles && !allowedRoles.includes(user.rol_id)) {
    return <Navigate to="/dashboard" replace />; 
  }

  // Si pasa todas las validaciones de seguridad, Outlet renderiza los componentes hijos
  return <Outlet />;
};
