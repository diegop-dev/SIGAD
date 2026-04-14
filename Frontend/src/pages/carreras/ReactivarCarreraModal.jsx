import { useState } from 'react';
import { RotateCcw, X, Loader2, BookOpen } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const ReactivarCarreraModal = ({ carrera, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!carrera) return null;

  const handleReactivar = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Reactivando programa...");
    try {
      await api.patch(`/carreras/${carrera.id_carrera}/activar`, {
        modificado_por: user?.id_usuario
      });
      toast.success("Programa reactivado correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.message || error.response?.data?.error || "Error de servidor"}`, { id: toastId });
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        
        <div className="flex justify-between items-center px-6 py-5 border-b border-emerald-100 bg-emerald-50">
          <div className="flex items-center text-emerald-600">
            <RotateCcw className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-black tracking-tight">Confirmar reactivación</h3>
          </div>
          <button onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-[#0B1828] hover:bg-slate-200 p-2 rounded-xl transition-colors active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <p className="text-slate-600 font-medium text-sm mb-6">Estás a punto de reincorporar este programa al sistema activo:</p>
          
          <div className="flex items-center space-x-6 mb-2 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
             <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shrink-0 border-4 border-white shadow-md">
               <BookOpen className="h-8 w-8 text-slate-300" />
             </div>
             <div>
               <h4 className="text-xl font-black text-[#0B1828] tracking-tight">{carrera.codigo_unico}</h4>
               <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-2">{carrera.nombre_carrera}</p>
             </div>
          </div>
        </div>

        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} disabled={isSubmitting} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] transition-all shadow-sm active:scale-95">
            Cancelar
          </button>
          <button onClick={handleReactivar} disabled={isSubmitting} className="flex items-center px-6 py-3 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md hover:shadow-emerald-600/30 active:scale-95">
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</> : <><RotateCcw className="w-4 h-4 mr-2" /> Reactivar programa</>}
          </button>
        </div>

      </div>
    </div>
  );
};