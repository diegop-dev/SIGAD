import { useState } from 'react';
import { AlertTriangle, X, Trash2, Loader2, User, Mail } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const DeactivateUserModal = ({ userToDeactivate, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!userToDeactivate) return null;

  // Construcción robusta de la URL de la imagen
  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
    
  const profileImageUrl = userToDeactivate.foto_perfil_url 
    ? `${API_BASE}${userToDeactivate.foto_perfil_url}` 
    : null;

  // Función lógica para estandarizar los colores de los roles
  const getRoleBadgeStyle = (rol) => {
    if (rol === 'Superadministrador') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (rol === 'Administrador') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-800 border-slate-200'; // Docente
  };

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Validando integridad relacional y procesando desactivación...");

    try {
      await api.patch(`/users/${userToDeactivate.id_usuario}/deactivate`, {
        eliminado_por: currentUser.id_usuario
      });
      
      toast.success("Usuario desactivado exitosamente.", { id: toastId });
      onSuccess();
    } catch (error) {
<<<<<<< HEAD
      // Interceptamos específicamente el error 409 de choque de dependencias (docentes con asignación)
      if (error.response?.status === 409) {
        const detalles = error.response.data?.detalles || "Conflicto de integridad en la base de datos.";
        // Usamos un tiempo de visualización más largo (6 segundos) para que el admin pueda leer la instrucción
        toast.error(`Operación denegada: ${detalles}`, { id: toastId, duration: 6000 });
      } else {
        // Fallback para otros errores (500, 404, 403)
=======
      if (error.response?.status === 409) {
        const detalles = error.response.data?.detalles || "Conflicto de integridad en la base de datos.";
        toast.error(`Operación denegada: ${detalles}`, { id: toastId, duration: 6000 });
      } else {
>>>>>>> f077882590116f3213427c490c599d2888b309b2
        const errorMsg = error.response?.data?.error || "Error al comunicarse con el servidor.";
        toast.error(`Error: ${errorMsg}`, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      {/* Modal con bordes más curvos (rounded-[2.5rem]) */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
          <div className="flex items-center text-white">
            <AlertTriangle className="w-6 h-6 mr-3 text-white" />
            <h3 className="text-xl font-black tracking-tight">Desactivar usuario</h3>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95 disabled:opacity-50"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="p-8 overflow-y-auto flex-1">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            A continuación, se visualiza el expediente del usuario cuyo acceso al sistema estás a punto de revocar:
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-20 w-20 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-300" />
              )}
            </div>
            <div className="pt-1">
              <h4 className="text-xl font-black text-[#0B1828] leading-tight">
                {userToDeactivate.nombres} <br /> {userToDeactivate.apellido_paterno} {userToDeactivate.apellido_materno}
              </h4>
              <p className="text-sm font-bold text-slate-500 mt-1.5 flex items-center justify-center sm:justify-start">
                <Mail className="w-3.5 h-3.5 mr-1.5" />
                {userToDeactivate.institutional_email}
              </p>
              <span className={`mt-3 inline-flex px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border shadow-sm ${getRoleBadgeStyle(userToDeactivate.nombre_rol)}`}>
                {userToDeactivate.nombre_rol}
              </span>
            </div>
          </div>

          <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
            <p className="text-sm text-red-800 font-medium">
              <strong className="font-black">Aviso de seguridad:</strong> El estatus del usuario cambiará a <span className="font-black">INACTIVO</span> y su acceso a la plataforma será bloqueado inmediatamente. Se registrará tu ID institucional como autor de esta acción.
            </p>
          </div>
        </div>
        
        {/* Pie del modal sin botón de cancelar */}
        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={handleDeactivate}
            disabled={isSubmitting}
            className="flex items-center justify-center px-6 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 shadow-md hover:shadow-red-200 focus:ring-2 focus:ring-red-200 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5 mr-2" /> Desactivar Usuario
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};