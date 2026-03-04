import React, { useState } from 'react';
import { Save, X, Loader2, AlertCircle } from 'lucide-react';

const EditAulaModal = ({ aula, alCerrar, alExito, adminId }) => {
  const [formData, setFormData] = useState({
    nombre: aula.nombre || '',
    tipo: aula.tipo || 'AULA',
    capacidad: aula.capacidad || '',
    ubicacion: aula.ubicacion || '',
    estatus: aula.estatus || 'ACTIVO'
  });
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Limpiar error al escribir
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const response = await fetch(`/api/aulas/actualizar/${aula.id_aula}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, modificado_por: adminId })
      });

      const data = await response.json();

      if (response.ok) {
        alExito(); // Refresca la tabla en AulaManagement
        alCerrar(); // Cierra el modal
      } else {
        // Muestra el error del validador o del controlador
        setError(data.message || data.errores?.join(', ') || "Error al actualizar");
      }
    } catch (err) {
      setError("Error de conexión con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-['Figtree']">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Actualizar Espacio</h2>
          <button onClick={alCerrar} className="text-gray-500 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              type="text" name="nombre" value={formData.nombre} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                name="tipo" value={formData.tipo} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="AULA">Aula</option>
                <option value="LABORATORIO">Laboratorio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input 
                type="number" name="capacidad" value={formData.capacidad} onChange={handleChange} min="1" max="200" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
            <select 
              name="estatus" value={formData.estatus} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="ACTIVO">Activo</option>
              <option value="MANTENIMIENTO">En Mantenimiento</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" onClick={alCerrar} disabled={cargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={cargando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAulaModal;