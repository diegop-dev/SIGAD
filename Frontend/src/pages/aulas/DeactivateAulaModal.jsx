import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, Trash2 } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast'
const DeactivateAulaModal = ({ aula, alCerrar, alExito, adminId }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const manejarDesactivacion = async () => {
    setCargando(true);
    setError(null);

  try {

      const response = await api.patch(`/aulas/desactivar/${aula.id_aula}`, {
        eliminado_por: adminId 
      });


      if (response.status === 200) {
        toast.success("¡Espacio desactivado con éxito!");
        alExito(); 
        alCerrar(); 
      }
    } catch (err) {
      
      const msg = err.response?.data?.message || "Error al conectar con el servidor.";
      setError(msg);
      toast.error("Hubo un problema al desactivar el espacio");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        
      
        <div className="bg-red-50 p-4 flex items-center gap-3 border-b border-red-100">
          <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-800">Confirmar Desactivación</h2>
            <p className="text-sm text-red-600">Esta acción cambiará el estatus del espacio.</p>
          </div>
          <button onClick={alCerrar} className="ml-auto text-red-400 hover:text-red-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <p className="text-gray-700 mb-2">
            ¿Estás seguro de que deseas desactivar el espacio: <br/>
            <span className="font-bold text-gray-900 text-lg">{aula.nombre_codigo}</span>?
          </p>
          <p className="text-sm text-gray-500">
            El aula ya no estará disponible para asignar nuevas clases, pero se mantendrá en el historial para consultas pasadas.
          </p>

          <div className="flex justify-end gap-3 mt-8">
            <button 
              onClick={alCerrar} disabled={cargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={manejarDesactivacion} disabled={cargando}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {cargando ? 'Desactivando...' : 'Sí, desactivar espacio'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAulaModal;