import { useState } from 'react';
import { X, CheckCircle, Loader2, CalendarDays } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const PeriodosActivate = ({ periodo, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!periodo) return null;

  const handleActivate = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando reactivación del periodo...");

    try {
      await api.patch(`/periodos/${periodo.id_periodo}/toggle`);
      toast.success("Periodo reactivado exitosamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al comunicarse con el servidor.";
      toast.error(`Error: ${errorMsg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      {/* Modal con bordes curvos estandarizados */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
          <div className="flex items-center text-white">
            <CheckCircle className="w-6 h-6 mr-3 text-white" />
            <h3 className="text-xl font-black tracking-tight">Reactivar periodo</h3>
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
            A continuación, se visualiza el periodo escolar al que estás a punto de restaurar su estatus activo:
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-20 w-20 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              <CalendarDays className="h-10 w-10 text-slate-300" />
            </div>
            <div className="pt-1">
              <h4 className="text-xl font-black text-[#0B1828] leading-tight">
                {periodo.codigo}
              </h4>
              <p className="text-sm font-bold text-slate-500 mt-1.5 flex items-center justify-center sm:justify-start">
                Año {periodo.anio}
              </p>
              <span className="mt-3 inline-flex px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border shadow-sm bg-slate-100 text-slate-800 border-slate-200">
                Estatus actual: {periodo.estatus}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-sm text-emerald-800 font-medium">
              <strong className="font-black">Aviso de sistema:</strong> El estatus del periodo cambiará a <span className="font-black">ACTIVO</span>. A partir de este momento, el ciclo escolar podrá ser seleccionado nuevamente para asignaciones y operaciones.
            </p>
          </div>
        </div>
        
        {/* Pie del modal */}
        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={handleActivate}
            disabled={isSubmitting}
            className="flex items-center justify-center px-6 py-3 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-emerald-200 focus:ring-2 focus:ring-emerald-200 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" /> Reactivar Periodo
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};