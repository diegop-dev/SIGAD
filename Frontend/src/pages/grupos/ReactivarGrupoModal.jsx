import { useState } from 'react';
import { RotateCcw, X, Loader2, Users } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const ReactivarGrupoModal = ({ grupo, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!grupo) return null;

  const handleReactivar = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Reactivando grupo...");
    try {
      await api.patch(`/grupos/${grupo.id_grupo}/reactivar`);
      toast.success("Grupo reactivado correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.error || "Error de servidor"}`, { id: toastId });
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        <div className="flex justify-between items-center px-6 py-5 border-b border-emerald-100 bg-emerald-50">
          <div className="flex items-center text-emerald-600">
            <RotateCcw className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-black tracking-tight">Confirmar reactivación</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <p className="text-slate-600 text-sm mb-6">Estás a punto de reincorporar este grupo al sistema activo:</p>
          <div className="flex items-center space-x-6 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
             <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shrink-0 border-4"><Users className="h-8 w-8 text-slate-400" /></div>
             <div>
               <h4 className="text-lg font-bold">Grupo {grupo.identificador}</h4>
               <p className="text-sm text-slate-500">{grupo.nombre_carrera}</p>
             </div>
          </div>
        </div>
        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700">Cancelar</button>
          <button onClick={handleReactivar} disabled={isSubmitting} className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</> : <><RotateCcw className="w-4 h-4 mr-2" /> Reactivar grupo</>}
          </button>
        </div>
      </div>
    </div>
  );
};