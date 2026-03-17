import { useState } from 'react';
import { AlertTriangle, X, Trash2, Loader2, CalendarDays, Archive } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const PeriodosDelete = ({ periodo, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!periodo) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando eliminación...");

    try {
      await api.delete(`/periodos/${periodo.id_periodo}`);
      toast.success("Periodo eliminado correctamente", { id: toastId });
      onSuccess();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("Tiene materias asociadas. Se aplicará baja lógica.", { id: toastId });
        await handleLogicalDelete(toastId);
      } else {
        toast.error("Error eliminando", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogicalDelete = async (existingToastId = null) => {
    setIsSubmitting(true);
    const toastId = existingToastId || toast.loading("Aplicando baja lógica...");

    try {
      await api.patch(`/periodos/${periodo.id_periodo}/toggle`);
      toast.success("Periodo desactivado", { id: toastId });
      onSuccess();
    } catch {
      toast.error("Error aplicando baja lógica", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-100">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-red-100 bg-red-50/50">
          <div className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-black tracking-tight">Administrar periodo</h3>
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
            Estás a punto de modificar el estado del siguiente periodo escolar. ¿Qué acción deseas realizar?
          </p>

          <div className="flex items-center space-x-6 mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-20 w-20 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              <CalendarDays className="h-10 w-10 text-slate-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                {periodo.codigo}
              </h4>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Año {periodo.anio}
              </p>
              <span className="mt-2 inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-600 border-slate-200">
                Estatus actual: {periodo.estatus}
              </span>
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-sm text-red-800 font-medium">
              <strong>Aviso:</strong> Desactivar mantiene el historial intacto (baja lógica). Eliminar permanentemente borrará el registro si no tiene otras entidades (materias, calificaciones) asociadas.
            </p>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button
            onClick={() => handleLogicalDelete()}
            disabled={isSubmitting}
            className="flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 hover:shadow-md hover:shadow-amber-200 focus:ring-2 focus:ring-amber-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Archive className="w-4 h-4 mr-2" />
            )}
            Desactivar
          </button>

          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 hover:shadow-md hover:shadow-red-200 focus:ring-2 focus:ring-red-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Eliminar
          </button>
        </div>

      </div>
    </div>
  );
};