import { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { CarreraForm } from './CarreraForm';

export const CarreraManagement = () => {
  // Estados para controlar la vista
  const [showForm, setShowForm] = useState(false);

  // Función que se ejecuta cuando el formulario guarda con éxito
  const handleSuccessAction = () => {
    // Aquí más adelante llamaremos a la función para recargar la tabla (ej. fetchCarreras)
    setShowForm(false);
  };

  return (
    <div className="flex-1 space-y-6">
      
      {/* Encabezado y botón de acción */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de carreras
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Administra el catálogo de carreras de la institución.
          </p>
        </div>

        {/* El botón solo se muestra si NO estamos viendo el formulario */}
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva carrera
          </button>
        )}
      </div>

      {/* Renderizado condicional: Formulario o Tabla */}
      {showForm ? (
        <CarreraForm 
          onBack={() => setShowForm(false)} 
          onSuccess={handleSuccessAction} 
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center min-h-[400px]">
           {/* Placeholder temporal para la tabla */}
           <BookOpen className="w-16 h-16 text-slate-200 mb-4" />
           <p className="text-slate-500 font-medium text-lg">La tabla de carreras se mostrará aquí</p>
           <p className="text-slate-400 text-sm mt-1">Haz clic en "Nueva carrera" para probar el formulario.</p>
        </div>
      )}

    </div>
  );
};