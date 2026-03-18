import { useState, useEffect } from 'react';
import { AlertTriangle, X, Trash2, Loader2, Users, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const DesactivarGrupoModal = ({ grupo, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    if (grupo) {
      setServerAction(null); 
      setServerMessage(''); 
      setIsSubmitting(false);
    }
  }, [grupo]);

  const handleCloseModal = () => {
    setServerAction(null); 
    setServerMessage(''); 
    onClose();
  };

  if (!grupo) return null;

  const handleDesactivar = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando baja...");

    try {
      await api.patch(`/grupos/${grupo.id_grupo}/desactivar`, {
        eliminado_por: currentUser.id_usuario,
        confirmar_rechazo: serverAction === 'WARN' 
      });
      toast.success("Grupo dado de baja correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const errorData = error.response?.data || {};
      const errorMsg = errorData.error || errorData.message || (error.response?.data && typeof error.response.data === 'string' ? error.response.data : "Error de servidor.");
      const mensajeMayusculas = errorMsg.toUpperCase();
      let action = errorData.action;
      
      if (!action) {
        if (mensajeMayusculas.includes('ACEPTADA') || mensajeMayusculas.includes('REASIGNES')) action = 'BLOCK';
        else if (mensajeMayusculas.includes('ENVIADA') || mensajeMayusculas.includes('PENDIENTES')) action = 'WARN';
      }
      
      toast.dismiss(); 
      if (action === 'BLOCK' || action === 'WARN') {
        setServerAction(action); setServerMessage(errorMsg);
      } else {
        toast.error(`Error: ${errorMsg}`);
      }
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`flex justify-between items-center px-6 py-5 border-b ${serverAction === 'BLOCK' ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
          <div className={`flex items-center ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
            {serverAction === 'BLOCK' ? <Ban className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
            <h3 className="text-lg font-black tracking-tight">{serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar baja de grupo'}</h3>
          </div>
          <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-6 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center shrink-0">
              <Users className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">Grupo {grupo.identificador}</h4>
              <p className="text-sm font-medium text-slate-500">{grupo.nombre_carrera}</p>
            </div>
          </div>

          <p className="text-slate-600 text-sm mb-6">¿Estás seguro de que deseas desactivar este grupo? Esta acción cambiará su estatus a inactivo.</p>

          {serverAction === 'BLOCK' && (
             <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
              <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">Libera al grupo en la sección de Asignaciones antes de darle de baja.</p>
            </div>
          )}
          {serverAction === 'WARN' && (
             <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-6"><p className="text-sm text-red-900 font-bold">{serverMessage}</p></div>
          )}
        </div>

        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={handleCloseModal} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">
            {serverAction === 'BLOCK' ? 'Cerrar' : 'Cancelar'}
          </button>
          {serverAction !== 'BLOCK' && (
            <button onClick={handleDesactivar} disabled={isSubmitting} className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</> : <><Trash2 className="w-4 h-4 mr-2" /> {serverAction === 'WARN' ? 'Confirmar y rechazar' : 'Dar de baja grupo'}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};