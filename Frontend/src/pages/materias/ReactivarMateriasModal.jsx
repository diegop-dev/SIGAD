import { useState } from 'react';
import { RefreshCw, X, Loader2, BookOpen } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const ReactivarMateriaModal = ({ materia, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!materia) return null;

const handleReactivar = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Reactivando materia...");
    try {
      // ✨ CAMBIO: Ahora apunta al endpoint específico de reactivar
      await api.patch(`/materias/${materia.id_materia}/reactivar`);
      toast.success("Materia reactivada correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.error || "Error de servidor"}`, { id: toastId });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden border border-slate-100">
        
        <div className="flex justify-between items-center px-6 py-5 border-b border-emerald-100 bg-emerald-50">
           <div className="flex items-center text-emerald-600">
             <RefreshCw className="w-5 h-5 mr-2" />
             <h3 className="text-lg font-black tracking-tight">Confirmar reactivación</h3>
           </div>
           <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-[#0B1828] hover:bg-slate-200 p-2 rounded-xl transition-colors active:scale-95">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-sm text-slate-600 font-medium mb-6">
            Estás a punto de reincorporar esta materia al sistema activo.
          </p>

          <div className="flex items-center space-x-6 mb-2 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
             <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shrink-0 border-4 border-white shadow-md">
               <BookOpen className="h-8 w-8 text-slate-300" />
             </div>
             <div>
               <h4 className="text-xl font-black text-[#0B1828] tracking-tight leading-tight">{materia.nombre}</h4>
               <p className="text-sm font-medium text-slate-500 mt-1">{materia.codigo_unico}</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] transition-all shadow-sm active:scale-95"
          >
            Cancelar
          </button>

          <button
            onClick={handleReactivar}
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-emerald-600/30 active:scale-95"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Reactivar materia
          </button>
        </div>
      </div>
    </div>
  );
};