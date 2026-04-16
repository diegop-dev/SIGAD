import { useState } from 'react';
import { UserCheck, X, CheckCircle, Loader2, BookOpen } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const ActivateAcademiaModal = ({ academiaToActivate, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!academiaToActivate) return null;

  const handleActivate = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando reactivación...");

    try {
      await api.patch(`/academias/${academiaToActivate.id_academia}/estatus`, {
        estatus: 'ACTIVO',
        modificado_por: user.id_usuario
      });
      
      toast.success("Academia reactivada exitosamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al comunicarse con el servidor.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
          <div className="flex items-center text-white">
            <UserCheck className="w-6 h-6 mr-3" />
            <h3 className="text-xl font-black tracking-tight">Reactivar academia</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 flex-1 text-center sm:text-left">
          <p className="text-slate-600 text-sm font-medium mb-6">
            Estás a punto de restaurar el estatus activo para:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <BookOpen className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#0B1828] leading-tight uppercase">{academiaToActivate.nombre}</h4>
              <p className="text-sm font-bold text-slate-500 mt-1">Coordinador: {academiaToActivate.coordinador_nombre}</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-sm text-emerald-800 font-medium">
              <strong className="font-black">Aviso de sistema:</strong> La academia volverá a estar disponible para asignaciones y reportes de inmediato.
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={handleActivate}
            disabled={isSubmitting}
            className="flex items-center justify-center px-6 py-3 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md rounded-xl transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
            Reactivar Academia
          </button>
        </div>
      </div>
    </div>
  );
};