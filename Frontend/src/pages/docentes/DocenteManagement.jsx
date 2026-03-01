import { useState } from "react";
import { AltaDocente } from "./AltaDocente";
import { Plus } from "lucide-react";

export const DocenteManagement = () => {
  // Estado para controlar qué pantalla estamos viendo
  const [isCreating, setIsCreating] = useState(false);

  // Función que se ejecuta cuando el registro fue exitoso
  const handleSuccess = () => {
    setIsCreating(false);
    // Aquí en el futuro puedes recargar la lista de docentes
  };

  return (
    <div className="p-6">
      {/* Si isCreating es true, mostramos el formulario que acabamos de armar */}
      {isCreating ? (
        <AltaDocente 
          onBack={() => setIsCreating(false)} 
          onSuccess={handleSuccess} 
        />
      ) : (
        /* Si es false, mostramos la vista principal (Tabla de docentes) */
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-black text-slate-900">Gestión de Docentes</h1>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Docente
            </button>
          </div>
          
          {/* Aquí iría tu futura tabla (DataGrid) con la lista de docentes */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
            Aquí aparecerá la tabla de docentes registrados. <br/>
            Haz clic en "Nuevo Docente" para probar tu formulario.
          </div>
        </div>
      )}
    </div>
  );
};