import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, Trash2, Ban } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast';

const DeactivateAulaModal = ({ aula, alCerrar, alExito, adminId }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [serverAction, setServerAction] = useState(null);

    const manejarDesactivacion = async () => {
    setCargando(true);
    setError(null);

    try {
      const response = await api.patch(`/aulas/desactivar/${aula.id_aula}`, {
        eliminado_por: adminId,
        confirmar_rechazo: serverAction === 'WARN'
      });

      if (response.status === 200) {
        toast.success("¡Espacio desactivado con éxito!");
        alExito(); 
        alCerrar(); 
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      
      // intercepción del bloqueo de integridad relacional
      if (status === 409 && (data.action === "BLOCK" || data.action === "WARN")) {
        setServerAction(data.action);
        const detalles = data.detalles || data.error || "Conflicto de integridad referencial.";
        setError(detalles);
        if (data.action === "BLOCK") {
          toast.error("Operación denegada por reglas de integridad", { duration: 8000 });
        }
      } else {
        const msg = data.message || data.error || "Error al conectar con el servidor.";
        setError(msg);
        toast.error("Hubo un problema al desactivar el espacio");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className={`flex justify-between items-center px-6 py-5 shrink-0 ${serverAction === 'BLOCK' ? 'bg-amber-500' : 'bg-[#0B1828]'}`}>
          <div className="flex items-center text-white">
            {serverAction === 'BLOCK' ? <Ban className="w-6 h-6 mr-3" /> : <AlertTriangle className="w-6 h-6 mr-3" />}
            <h3 className="text-xl font-black tracking-tight">{serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar desactivación'}</h3>
          </div>
          <button onClick={alCerrar} disabled={cargando} className="p-2.5 bg-white/10 text-white hover:bg-black/20 rounded-full transition-all active:scale-95 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 text-center sm:text-left">
          {error && serverAction !== 'WARN' && (
            <div className={`mb-6 p-4 rounded-2xl flex gap-3 text-left border ${serverAction === 'BLOCK' ? 'bg-amber-50 text-amber-900 border-amber-200 shadow-sm' : 'bg-red-50 text-red-800 border-red-100 shadow-sm'}`}>
              {serverAction === 'BLOCK' ? <Ban className="w-6 h-6 shrink-0 mt-0.5" /> : <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />}
              <p className="font-bold text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {serverAction === 'WARN' && (
            <div className="bg-red-50 p-5 rounded-2xl border border-red-200 mb-6 shadow-sm text-left flex gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 text-red-600 mt-0.5" />
              <p className="text-sm text-red-900 font-bold">{error}</p>
            </div>
          )}

          {serverAction !== 'BLOCK' && (
            <>
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                Estás a punto de revocar el estatus del siguiente espacio:
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                  <Ban className="h-8 w-8 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-[#0B1828] leading-tight uppercase">{aula.nombre_codigo}</h4>
                  <p className="text-sm font-bold text-slate-500 mt-1">Ubicación: {aula.ubicacion}</p>
                </div>
              </div>

              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm text-left">
                <p className="text-sm text-red-800 font-medium">
                  <strong className="font-black" >Aviso de seguridad:</strong> El aula ya no estará disponible para asignar nuevas clases, pero se mantendrá en el historial para consultas pasadas.
                </p>
              </div>
            </>
          )}

          {serverAction === 'BLOCK' && (
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm text-left">
              <p className="text-xs text-amber-700 font-medium">Reubica las clases asignadas previamente en el módulo de asignaciones antes de dar de baja este espacio.</p>
            </div>
          )}
        </div>

        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={alCerrar} disabled={cargando}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            {serverAction === 'BLOCK' ? 'Entendido' : 'Cancelar'}
          </button>
          
          {serverAction !== 'BLOCK' && (
            <button 
              onClick={manejarDesactivacion} disabled={cargando}
              className="flex items-center justify-center px-6 py-3 text-sm font-black text-white hover:shadow-md rounded-xl transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto bg-red-600 hover:bg-red-700"
            >
              {cargando ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2" />}
              {cargando ? 'Procesando...' : serverAction === 'WARN' ? 'Confirmar y rechazar' : 'Desactivar Espacio'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeactivateAulaModal;