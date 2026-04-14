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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
        
        <div className={`flex justify-between items-center px-6 py-5 border-b ${serverAction === 'BLOCK' ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
          <div className={`flex items-center ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
            {serverAction === 'BLOCK' ? <Ban className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
            <h3 className="text-lg font-black tracking-tight">
              {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar baja de carrera'}
            </h3>
          </div>
          <button onClick={handleCloseModal} disabled={isSubmitting} className="text-slate-400 hover:text-[#0B1828] hover:bg-slate-200 p-2 rounded-xl disabled:opacity-50 transition-colors active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8">
          <div className="flex items-center space-x-6 mb-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
              <BookOpen className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#0B1828] tracking-tight leading-tight">{carrera.codigo_unico}</h4>
              <p className="text-sm font-medium text-slate-500 mt-1 line-clamp-2">{carrera.nombre_carrera}</p>
            </div>
          </div>

          <p className="text-slate-600 text-sm mb-6 font-medium">¿Estás seguro de que deseas desactivar este programa académico? Esta acción cambiará su estatus a inactivo.</p>

          {serverAction === 'BLOCK' && (
             <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-2 shadow-sm">
              <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">Libera las clases de este programa en la sección de Asignaciones antes de intentar darle de baja.</p>
            </div>
          )}

          {serverAction === 'WARN' && (
             <div className="bg-red-50 p-5 rounded-2xl border border-red-200 mb-4 shadow-sm">
               <p className="text-sm text-red-900 font-bold">{serverMessage}</p>
             </div>
          )}

          {serverAction !== 'BLOCK' && (
            <div className="space-y-2 mt-4">
              <label className="text-sm font-bold text-[#0B1828]">Motivo de la baja <span className="text-[#0B1828] ml-1">*</span></label>
              <textarea
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Escribe el motivo..."
                className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:ring-1 focus:border-[#0B1828] focus:ring-[#0B1828] transition-all resize-none h-24 shadow-sm outline-none"
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={handleCloseModal} disabled={isSubmitting} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] disabled:opacity-50 transition-all shadow-sm active:scale-95">
            {serverAction === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
          </button>
          
          {serverAction !== 'BLOCK' && (
            <button onClick={handleDesactivar} disabled={isSubmitting || !motivoBaja.trim()} className="flex items-center px-6 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 transition-all shadow-md hover:shadow-red-600/30 active:scale-95">
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</> : <><Trash2 className="w-4 h-4 mr-2" /> {serverAction === 'WARN' ? 'Confirmar y rechazar' : 'Dar de baja programa'}</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};