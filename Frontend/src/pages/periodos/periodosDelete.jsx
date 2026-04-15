import { useState } from 'react';
import { AlertTriangle, X, Loader2, CalendarDays, Archive, Ban } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      {/* Modal con bordes más curvos estandarizados */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
          <div className="flex items-center text-white">
            {serverAction === 'BLOCK' ? (
              <Ban className="w-6 h-6 mr-3 text-amber-500" />
            ) : (
              <AlertTriangle className="w-6 h-6 mr-3 text-white" />
            )}
            <h3 className="text-xl font-black tracking-tight">
              {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Desactivar periodo'}
            </h3>
          </div>
          <button 
            onClick={handleCloseModal} 
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
            A continuación, se visualiza el periodo escolar que estás a punto de desactivar:
          </p>

          {/* Ficha de información estandarizada */}
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
                Estatus: {periodo.estatus}
              </span>
            </div>
          </div>

          {/* Validaciones y Avisos */}
          {serverAction === 'BLOCK' ? (
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
              <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">
                Libera el ciclo escolar en la sección de Asignaciones antes de intentar darle de baja.
              </p>
            </div>
          ) : (
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
              <p className="text-sm text-red-800 font-medium">
                <strong className="font-black">Aviso de sistema:</strong> El estatus del periodo cambiará a <span className="font-black">INACTIVO</span> (baja lógica). Esto mantendrá el historial intacto, pero evitará que pueda ser seleccionado para nuevas operaciones.
              </p>
            </div>
          )}

        </div>

        {/* Pie del modal sin botón de cancelar */}
        {serverAction !== 'BLOCK' && (
          <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end shrink-0">
            <button
              onClick={handleLogicalDelete}
              disabled={isSubmitting}
              className="flex items-center justify-center px-6 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 shadow-md hover:shadow-red-200 focus:ring-2 focus:ring-red-200 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...
                </>
              ) : (
                <>
                  <Archive className="w-5 h-5 mr-2" /> Desactivar Periodo
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};