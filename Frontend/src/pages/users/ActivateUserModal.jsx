import { useState } from 'react';
import { UserCheck, X, CheckCircle, Loader2, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const ActivateUserModal = ({ userToActivate, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!userToActivate) return null;

  // Construcción robusta de la URL de la imagen
  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
    
  const profileImageUrl = userToActivate.foto_perfil_url 
    ? `${API_BASE}${userToActivate.foto_perfil_url}` 
    : null;

  const handleActivate = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando reactivación...");

    try {
      await api.patch(`/users/${userToActivate.id_usuario}/activate`, {
        modificado_por: currentUser.id_usuario
      });
      
      toast.success("Usuario reactivado exitosamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al comunicarse con el servidor.";
      toast.error(`Error: ${errorMsg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-100">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-emerald-100 bg-emerald-50/50">
          <div className="flex items-center text-emerald-600">
            <UserCheck className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-black tracking-tight">Confirmar reactivación</h3>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="p-6">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            Estás a punto de restaurar el acceso al sistema para el siguiente usuario:
          </p>

          <div className="flex items-center space-x-6 mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-20 w-20 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                {userToActivate.nombres} {userToActivate.apellido_paterno}
              </h4>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {userToActivate.institutional_email}
              </p>
              <span className="mt-2 inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-600 border-slate-200">
                {userToActivate.nombre_rol}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-800 font-medium">
              <strong>Aviso:</strong> El estatus cambiará a <span className="font-bold">ACTIVO</span> y el usuario podrá iniciar sesión en la plataforma inmediatamente. Se registrará tu ID como auditor de esta acción.
            </p>
          </div>
        </div>
        
        {/* Pie del modal */}
        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleActivate}
            disabled={isSubmitting}
            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-200 focus:ring-2 focus:ring-emerald-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" /> Reactivar usuario
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
