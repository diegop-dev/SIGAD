import { useState } from 'react';
import { RotateCcw, X, Loader2, User } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const ReactivateDocenteModal = ({ docente, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!docente) return null;

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
  const profileImageUrl = docente.foto_perfil_url ? `${API_BASE}${docente.foto_perfil_url}` : null;

  const handleReactivate = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Reactivando docente...");

    try {
      await api.patch(`/docentes/${docente.id_docente}/reactivate`);
      toast.success("Docente reactivado correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al comunicarse con el servidor.";
      toast.error(`Error: ${errorMsg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center px-6 py-5 border-b border-emerald-100 bg-emerald-50">
          <div className="flex items-center text-emerald-600">
            <RotateCcw className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-black tracking-tight">Confirmar reactivación</h3>
          </div>
          <button 
            onClick={onClose} disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            Estás a punto de reincorporar al siguiente docente al sistema activo:
          </p>

          <div className="flex items-center space-x-6 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-slate-400" />}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">{docente.nombres} {docente.apellido_paterno}</h4>
              <p className="text-sm font-medium text-slate-500">{docente.institutional_email}</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
            <p className="text-sm text-emerald-800 font-medium">
              El docente recuperará su acceso a la plataforma de inmediato y podrá volver a recibir cargas académicas.
            </p>
          </div>
        </div>

        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose} disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleReactivate} disabled={isSubmitting}
            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 rounded-xl transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
            ) : (
              <><RotateCcw className="w-4 h-4 mr-2" /> Reactivar docente</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};