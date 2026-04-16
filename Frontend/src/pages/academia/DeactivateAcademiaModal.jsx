import { useState } from 'react';
import { AlertTriangle, X, Trash2, Loader2, BookOpen, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const DeactivateAcademiaModal = ({ academiaToDeactivate, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  if (!academiaToDeactivate) return null;

  const handleDeactivate = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Validando integridad y procesando baja...");

    try {
      await api.patch(`/academias/${academiaToDeactivate.id_academia}/estatus`, {
        estatus: 'INACTIVO',
        modificado_por: user.id_usuario,
        confirmar_rechazo: serverAction === 'WARN'
      });
      
      toast.success("Academia desactivada exitosamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      toast.dismiss(toastId);
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      if (status === 409 && (errorData.action === 'BLOCK' || errorData.action === 'WARN')) {
        setServerAction(errorData.action); 
        setServerMessage(errorData.detalles || "Conflicto de integridad referencial.");
        
        if (errorData.action === 'BLOCK') {
          toast.error("Operación denegada por reglas de integridad", { duration: 8000 });
        }
      } else {
        toast.error(errorData.error || "Error al comunicarse con el servidor.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setServerAction(null);
    setServerMessage('');
    onClose();
  };

  // Si hay un bloqueo por integridad o advertencia, ajustamos el color
  const isBlock = serverAction === 'BLOCK';
  const isWarn = serverAction === 'WARN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className={`flex justify-between items-center px-6 py-5 shrink-0 ${isBlock ? 'bg-amber-500' : isWarn ? 'bg-amber-500' : 'bg-[#0B1828]'}`}>
          <div className={`flex items-center ${isBlock || isWarn ? 'text-white' : 'text-white'}`}>
            {isBlock ? <Ban className="w-6 h-6 mr-3" /> : <AlertTriangle className="w-6 h-6 mr-3" />}
            <h3 className="text-xl font-black tracking-tight">{isBlock ? 'Acción bloqueada' : isWarn ? 'Confirmar rechazo' : 'Desactivar academia'}</h3>
          </div>
          <button onClick={handleClose} disabled={isSubmitting} className="p-2.5 bg-white/10 text-white hover:bg-black/20 rounded-full transition-all active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 text-center sm:text-left">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            {!isWarn && !isBlock && "Estás a punto de revocar el estatus activo de la siguiente academia:"}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <BookOpen className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#0B1828] leading-tight uppercase">{academiaToDeactivate.nombre}</h4>
              <p className="text-sm font-bold text-slate-500 mt-1">Coordinador: {academiaToDeactivate.coordinador_nombre}</p>
            </div>
          </div>

          {!isBlock && !isWarn && (
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
              <p className="text-sm text-red-800 font-medium">
                <strong className="font-black">Aviso de seguridad:</strong> El estatus cambiará a <span className="font-black">INACTIVO</span>. No podrá ser seleccionada en nuevos procesos hasta ser reactivada.
              </p>
            </div>
          )}

          {isBlock && (
             <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-2 shadow-sm text-left">
              <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">Libera a la academia en la sección de Asignaciones antes de darle de baja.</p>
            </div>
          )}
          {isWarn && (
             <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-2 shadow-sm text-left">
               <p className="text-sm text-amber-900 font-bold">{serverMessage}</p>
             </div>
          )}
        </div>
        
        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button onClick={handleClose} disabled={isSubmitting} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] disabled:opacity-50 transition-all shadow-sm active:scale-95">
            {isBlock ? 'Entendido' : 'Cancelar'}
          </button>
          
          {!isBlock && (
            <button
              onClick={handleDeactivate}
              disabled={isSubmitting}
              className={`flex items-center justify-center px-6 py-3 text-sm font-black text-white hover:shadow-md rounded-xl transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto ${isWarn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
              {isWarn ? 'Confirmar y rechazar asignaciones' : 'Desactivar Academia'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};