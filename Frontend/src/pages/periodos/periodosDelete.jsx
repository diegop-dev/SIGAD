import { useState } from 'react';
import { AlertTriangle, X, Trash2, Loader2, CalendarDays, Archive, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const PeriodosDelete = ({ periodo, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  if (!periodo) return null;

  const handleCloseModal = () => {
    setServerAction(null); 
    setServerMessage(''); 
    onClose();
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando eliminación física...");

    try {
      await api.delete(`/periodos/${periodo.id_periodo}`);
      toast.success("Periodo eliminado permanentemente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      if (status === 409) {
        toast.error(errorData.error || "El periodo tiene materias asociadas y no puede ser eliminado.", { id: toastId, duration: 6000 });
      } else {
        toast.error(errorData.error || "Error interno al intentar eliminar el periodo.", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogicalDelete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Aplicando baja lógica...");

    try {
      await api.patch(`/periodos/${periodo.id_periodo}/toggle`);
      toast.success("Periodo desactivado correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      toast.dismiss(toastId); 
      
      // Interceptamos la restricción de integridad relacional
      if (status === 409 && errorData.action === "BLOCK") {
        const detalles = errorData.detalles || "Conflicto de integridad en la base de datos.";
        setServerAction("BLOCK");
        setServerMessage(detalles);
        toast.error("Operación denegada por reglas de integridad", { duration: 8000 });
      } else {
        const msg = errorData.error || "Error al aplicar la baja lógica.";
        toast.error(`Error: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del modal */}
        <div className={`flex justify-between items-center px-6 py-5 border-b ${serverAction === 'BLOCK' ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
          <div className={`flex items-center ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
            {serverAction === 'BLOCK' ? <Ban className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
            <h3 className="text-lg font-black tracking-tight">{serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Administrar periodo'}</h3>
          </div>
          <button 
            onClick={handleCloseModal} 
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del modal */}
        <div className="p-6">
          <div className="flex items-center space-x-6 mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              <CalendarDays className="h-8 w-8 text-slate-400" />
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

          {serverAction === 'BLOCK' ? (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
              <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">Libera el ciclo escolar en la sección de Asignaciones antes de intentar darle de baja.</p>
            </div>
          ) : (
            <>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                Estás a punto de modificar el estado del periodo escolar. ¿Qué acción deseas realizar?
              </p>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  <strong>Aviso:</strong> Desactivar mantiene el historial intacto (baja lógica). Eliminar permanentemente borrará el registro si no tiene otras entidades (materias, calificaciones) asociadas.
                </p>
              </div>
            </>
          )}

        </div>

        {/* Pie del modal */}
        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
          <button 
            onClick={handleCloseModal} 
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all disabled:opacity-50"
          >
            {serverAction === 'BLOCK' ? 'Cerrar' : 'Cancelar'}
          </button>
          
          {serverAction !== 'BLOCK' && (
            <>
              <button
                onClick={handleLogicalDelete}
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
            </>
          )}
        </div>

      </div>
    </div>
  );
};