import { useState, useEffect } from 'react';
import { AlertTriangle, X, Trash2, Loader2, User, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const DeactivateDocenteModal = ({ docente, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');
  
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  // ✨ NUEVO: Limpiamos la memoria cada vez que se abre el modal
  useEffect(() => {
    if (docente) {
      setServerAction(null);
      setServerMessage('');
      setMotivoBaja('');
      setIsSubmitting(false);
    }
  }, [docente]);

  // ✨ NUEVO: Función para limpiar todo al cerrar
  const handleCloseModal = () => {
    setServerAction(null);
    setServerMessage('');
    setMotivoBaja('');
    onClose();
  };

  if (!docente) return null;

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
  const profileImageUrl = docente.foto_perfil_url ? `${API_BASE}${docente.foto_perfil_url}` : null;

  const handleDeactivate = async () => {
    if (!motivoBaja.trim()) {
      toast.error("Por favor, ingresa un motivo para la baja.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Procesando baja...");

    try {
      await api.patch(`/docentes/${docente.id_docente}/deactivate`, {
        eliminado_por: currentUser.id_usuario,
        motivo_baja: motivoBaja,
        confirmar_rechazo: serverAction === 'WARN' 
      });
      
      toast.success("Docente dado de baja correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const errorData = error.response?.data || {};
      const errorMsg = errorData.error || errorData.message || (error.response?.data && typeof error.response.data === 'string' ? error.response.data : "Error al comunicarse con el servidor.");
      
      const mensajeMayusculas = errorMsg.toUpperCase();
      let action = errorData.action;
      
      if (!action) {
        if (mensajeMayusculas.includes('ACEPTADA') || mensajeMayusculas.includes('REASIGNES')) {
          action = 'BLOCK';
        } else if (mensajeMayusculas.includes('ENVIADA') || mensajeMayusculas.includes('PENDIENTES')) {
          action = 'WARN';
        }
      }
      
      toast.dismiss(); 
      
      if (action === 'BLOCK' || action === 'WARN') {
        setServerAction(action); 
        setServerMessage(errorMsg);
      } else {
        toast.error(`Error: ${errorMsg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        <div className={`flex justify-between items-center px-6 py-5 border-b ${serverAction === 'BLOCK' ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
          <div className={`flex items-center ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
            {serverAction === 'BLOCK' ? <Ban className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
            <h3 className="text-lg font-black tracking-tight">
              {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar baja del docente'}
            </h3>
          </div>
          {/* ✨ Cambiamos onClose por handleCloseModal */}
          <button 
            onClick={handleCloseModal} disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-6 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-slate-400" />}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">{docente.nombres} {docente.apellido_paterno}</h4>
              <p className="text-sm font-medium text-slate-500">{docente.institutional_email}</p>
            </div>
          </div>

          {serverAction === 'BLOCK' && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
              <p className="text-sm text-amber-900 font-bold mb-3">{serverMessage}</p>
              <p className="text-xs text-amber-700 font-medium">
                Por favor, cierra esta ventana y dirígete a la sección de Asignaciones para liberar al docente antes de intentar darle de baja.
              </p>
            </div>
          )}

          {serverAction === 'WARN' && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 mb-6 shadow-sm">
              <p className="text-sm text-red-900 font-bold">{serverMessage}</p>
            </div>
          )}

          {serverAction !== 'BLOCK' && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Motivo de la baja <span className="text-red-500">*</span>
              </label>
              <textarea
                rows="3"
                className="w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 text-sm p-3 transition-all duration-200 resize-none"
                placeholder="Explica brevemente por qué se da de baja al docente..."
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                disabled={isSubmitting || serverAction === 'WARN'} 
              ></textarea>
            </div>
          )}

          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <p className="text-sm text-red-800 font-medium">
              <strong>Aviso de seguridad:</strong> El estatus cambiará a <span className="font-bold">BAJA</span> y el docente perderá acceso a la plataforma. Se registrará tu ID como auditor de esta acción.
            </p>
          </div>

        </div>

        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          {/* ✨ Cambiamos onClose por handleCloseModal */}
          <button 
            onClick={handleCloseModal} disabled={isSubmitting}
            className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
          >
            {serverAction === 'BLOCK' ? 'Cerrar' : 'Cancelar'}
          </button>
          
          {serverAction !== 'BLOCK' && (
            <button
              onClick={handleDeactivate}
              disabled={isSubmitting || !motivoBaja.trim()}
              className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 hover:shadow-md focus:ring-2 focus:ring-red-200 rounded-xl transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> {serverAction === 'WARN' ? 'Confirmar y rechazar' : 'Dar de baja docente'}</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};