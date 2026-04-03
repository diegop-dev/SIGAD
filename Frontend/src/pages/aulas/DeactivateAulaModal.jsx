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
    const toastId = toast.loading("Procesando desactivación...");

    try {
      const response = await api.patch(`/aulas/desactivar/${aula.id_aula}`, {
        eliminado_por: adminId 
      });

      if (response.status === 200) {
        toast.success("¡Espacio desactivado con éxito!", { id: toastId });
        alExito(); 
        alCerrar(); 
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      
      // intercepción del bloqueo de integridad relacional
      if (status === 409 && data.action === "BLOCK") {
        setServerAction("BLOCK");
        const detalles = data.detalles || "Conflicto de integridad referencial.";
        setError(detalles);
        toast.error("Operación denegada por reglas de integridad", { id: toastId, duration: 8000 });
      } else {
        const msg = data.message || data.error || "Error al conectar con el servidor.";
        setError(msg);
        toast.error("Hubo un problema al desactivar el espacio", { id: toastId });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 transition-all">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        
        <div className={`p-4 flex items-center gap-3 border-b ${serverAction === 'BLOCK' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`p-2 rounded-full shrink-0 ${serverAction === 'BLOCK' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
            {serverAction === 'BLOCK' ? <Ban className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${serverAction === 'BLOCK' ? 'text-amber-800' : 'text-red-800'}`}>
              {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar desactivación'}
            </h2>
            <p className={`text-sm ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
              {serverAction === 'BLOCK' ? 'Restricción del sistema' : 'Esta acción cambiará el estatus del espacio.'}
            </p>
          </div>
          <button onClick={alCerrar} disabled={cargando} className={`ml-auto transition-colors disabled:opacity-50 ${serverAction === 'BLOCK' ? 'text-amber-400 hover:text-amber-600' : 'text-red-400 hover:text-red-600'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${serverAction === 'BLOCK' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          {serverAction !== 'BLOCK' && (
            <>
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas desactivar el espacio: <br/>
                <span className="font-bold text-gray-900 text-lg">{aula.nombre_codigo}</span>?
              </p>
              <p className="text-sm text-gray-500">
                El aula ya no estará disponible para asignar nuevas clases, pero se mantendrá en el historial para consultas pasadas.
              </p>
            </>
          )}

          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={alCerrar} disabled={cargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {serverAction === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
            </button>
            
            {serverAction !== 'BLOCK' && (
              <button 
                onClick={manejarDesactivacion} disabled={cargando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
              >
                {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {cargando ? 'Desactivando...' : 'Sí, desactivar espacio'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAulaModal;