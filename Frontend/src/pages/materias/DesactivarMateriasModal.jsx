import { useState, useEffect } from "react";
import { X, Trash2, AlertTriangle, Loader2, BookOpen, Ban } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export const DesactivarMateriaModal = ({ materia, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  useEffect(() => {
    if (materia) {
      setServerAction(null); 
      setServerMessage(''); 
      setIsSubmitting(false);
    }
  }, [materia]);

  const handleCloseModal = () => {
    setServerAction(null); 
    setServerMessage(''); 
    onClose();
  };

  const handleLogicalDelete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando baja lógica...");

    try {
      await api.patch(`/materias/${materia.id_materia}/desactivar`, {
        confirmar_rechazo: serverAction === 'WARN'
      });
      
      toast.success("Materia desactivada correctamente.", { id: toastId });
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

  if (!materia) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

        <div className={`flex justify-between items-center px-6 py-5 border-b ${serverAction === 'BLOCK' ? 'border-amber-100 bg-amber-50' : 'bg-red-50 border-red-100'}`}>
          <div className={`flex items-center ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
            {serverAction === 'BLOCK' ? <Ban className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
            <h3 className="text-lg font-black tracking-tight">
              {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar baja de materia'}
            </h3>
          </div>

          <button 
            onClick={handleCloseModal}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-[#0B1828] hover:bg-slate-200 p-2 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center space-x-6 p-5 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
            <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
              <BookOpen className="h-8 w-8 text-slate-300" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#0B1828] tracking-tight leading-tight">{materia.nombre}</h4>
              <p className="text-sm font-medium text-slate-500 mt-1">{materia.codigo_unico}</p>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-600">
            ¿Estás seguro de que deseas desactivar esta materia? Esta acción cambiará su estatus a <span className="font-bold text-red-600 uppercase">inactivo</span> en el sistema.
          </p>

          {serverAction === 'BLOCK' && (
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">
                Reasigna o cancela las clases activas en la sección de Asignaciones Docentes antes de intentar darle de baja.
              </p>
            </div>
          )}

          {serverAction === 'WARN' && (
             <div className="bg-red-50 p-5 rounded-2xl border border-red-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
               <p className="text-sm text-red-900 font-bold">{serverMessage}</p>
             </div>
          )}

          {serverAction !== 'BLOCK' && (
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                <span className="font-bold text-[#0B1828]">Nota:</span> Desactivar la materia ocultará el registro para nuevos procesos, pero conservará el historial académico y las calificaciones previas para reportes oficiales.
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={handleCloseModal}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {serverAction === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
          </button>

          {serverAction !== 'BLOCK' && (
            <button
              onClick={handleLogicalDelete}
              disabled={isSubmitting}
              className="flex items-center px-6 py-3 text-sm font-black text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 transition-all shadow-md hover:shadow-red-600/30 active:scale-95"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> {serverAction === 'WARN' ? 'Confirmar y rechazar' : 'Dar de baja materia'}</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};