import { useState, useEffect } from 'react';
import { AlertTriangle, X, Trash2, Loader2, BookOpen, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const DesactivarCarreraModal = ({ carrera, onClose, onSuccess }) => {
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');
  
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    if (carrera) {
      setServerAction(null); 
      setServerMessage(''); 
      setMotivoBaja('');
      setIsSubmitting(false);
    }
  }, [carrera]);

  const handleCloseModal = () => {
    setServerAction(null); 
    setServerMessage(''); 
    setMotivoBaja('');
    onClose();
  };

  if (!carrera) return null;

  const handleDesactivar = async () => {
    if (!motivoBaja.trim()) {
      toast.error("El motivo de la baja es obligatorio.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Procesando baja...");

    try {
      await api.patch(`/carreras/${carrera.id_carrera}/desactivar`, {
        eliminado_por: user?.id_usuario,
        motivo_baja: motivoBaja,
        confirmar_rechazo: serverAction === 'WARN' 
      });
      
      toast.success("Carrera dada de baja correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};
      
      toast.dismiss(toastId); 
      
      if (status === 409 && (errorData.action === 'BLOCK' || errorData.action === 'WARN')) {
        const detalles = errorData.detalles || errorData.error || "Conflicto de integridad referencial.";
        setServerAction(errorData.action); 
        setServerMessage(detalles);
        
        if (errorData.action === 'BLOCK') {
          toast.error("Operación denegada por reglas de integridad", { duration: 8000 });
        }
      } else {
        const msg = errorData.error || errorData.message || "Ocurrió un error al procesar la baja.";
        toast.error(`Error: ${msg}`);
      }
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const isBlock = serverAction === 'BLOCK';
  const isWarn = serverAction === 'WARN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className={`flex justify-between items-center px-6 py-5 shrink-0 ${isBlock ? 'bg-amber-500' : isWarn ? 'bg-amber-500' : 'bg-[#0B1828]'}`}>
          <div className="flex items-center text-white">
            {isBlock ? <Ban className="w-6 h-6 mr-3" /> : <AlertTriangle className="w-6 h-6 mr-3" />}
            <h3 className="text-xl font-black tracking-tight">
              {isBlock ? 'Acción bloqueada' : isWarn ? 'Confirmar rechazo' : 'Desactivar carrera'}
            </h3>
          </div>
          <button 
            onClick={handleCloseModal} disabled={isSubmitting} 
            className="p-2.5 bg-white/10 text-white hover:bg-black/20 rounded-full transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 text-center sm:text-left">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            {!isWarn && !isBlock && "Estás a punto de revocar el estatus activo de la siguiente carrera/programa académico:"}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <BookOpen className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#0B1828] leading-tight uppercase">{carrera.codigo_unico}</h4>
              <p className="text-sm font-bold text-slate-500 mt-1 line-clamp-2">{carrera.nombre_carrera}</p>
            </div>
          </div>

          {!isBlock && !isWarn && (
            <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm mb-6">
              <p className="text-sm text-red-800 font-medium">
                <strong className="font-black">Aviso de seguridad:</strong> El estatus cambiará a <span className="font-black">INACTIVO</span>. No podrá ser seleccionada en nuevos procesos hasta ser reactivada.
              </p>
            </div>
          )}

          {isBlock && (
             <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-2 shadow-sm text-left">
              <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">Libera las clases de este programa en la sección de Asignaciones antes de intentar darle de baja.</p>
            </div>
          )}

          {isWarn && (
             <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-2 shadow-sm text-left">
               <p className="text-sm text-amber-900 font-bold">{serverMessage}</p>
             </div>
          )}

          {!isBlock && (
            <div className="mb-2 text-left">
              <label className="block text-sm font-bold text-[#0B1828] mb-2">
                Motivo de la baja <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Escribe el motivo..."
                disabled={isSubmitting || isWarn}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm p-3.5 transition-all duration-200 resize-none outline-none shadow-sm"
                rows="3"
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={handleCloseModal} disabled={isSubmitting} 
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            {isBlock ? 'Entendido' : 'Cancelar'}
          </button>
          
          {!isBlock && (
            <button 
              onClick={handleDesactivar} 
              disabled={isSubmitting || !motivoBaja.trim()} 
              className={`flex items-center justify-center px-6 py-3 text-sm font-black text-white rounded-xl transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto shadow-md ${isWarn ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><Trash2 className="w-5 h-5 mr-2" /> {isWarn ? 'Confirmar y rechazar asignaciones' : 'Desactivar Carrera'}</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};