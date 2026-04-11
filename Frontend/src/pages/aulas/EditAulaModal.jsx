import React, { useState } from 'react';
import { Save, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast';

const EDIFICIOS_DISPONIBLES = [
  "Edificio A",
  "Edificio B",
  "Edificio C",
  "Edificio D",
  "Planta Baja",
  "Planta Alta"
];

const EditAulaModal = ({ aula, alCerrar, alExito, adminId }) => {
  const ubicacionesFinales = EDIFICIOS_DISPONIBLES.includes(aula.ubicacion)
    ? EDIFICIOS_DISPONIBLES
    : [...EDIFICIOS_DISPONIBLES, aula.ubicacion].filter(Boolean);
    
  const [formData, setFormData] = useState({
    nombre: aula.nombre_codigo || '',
    tipo: aula.tipo || 'AULA',
    capacidad: aula.capacidad || '',
    ubicacion: aula.ubicacion || '',
    estatus: aula.estatus || 'ACTIVO'
  });
  
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const toastId = toast.loading("Actualizando espacio...");

    try {
      const response = await api.patch(`/aulas/actualizar/${aula.id_aula}`, {
        ...formData,
        capacidad: parseInt(formData.capacidad), 
        modificado_por: adminId
      });

      if (response.status === 200) {
        toast.success("¡Espacio actualizado con éxito!", { id: toastId });
        alExito(); 
        alCerrar(); 
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};

      // Intercepción del bloqueo de integridad relacional
      if (status === 409 && data.action === "BLOCK") {
        const detalles = data.detalles || "Conflicto de integridad referencial.";
        setError(detalles);
        toast.error("Operación denegada por reglas de integridad", { id: toastId, duration: 8000 });
      } else {
        const msg = data.message || data.error || "Error al conectar con el servidor.";
        setError(msg);
        toast.error("No se pudo actualizar el espacio", { id: toastId });
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Actualizar espacio</h2>
          <button onClick={alCerrar} disabled={cargando} className="text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-sm border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-snug">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input 
              type="text" name="nombre" value={formData.nombre} onChange={handleChange} required
              maxLength={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                name="tipo" value={formData.tipo} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
              >
                <option value="AULA">Aula</option>
                <option value="LABORATORIO">Laboratorio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input 
                type="number" name="capacidad" value={formData.capacidad} onChange={handleChange} min="1" max="200" required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edificio / Ubicación</label>
            <select 
              name="ubicacion" 
              value={formData.ubicacion} 
              onChange={handleChange} 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            >
              <option value="" disabled>Selecciona un edificio...</option>
              {ubicacionesFinales.map((edificio) => (
                <option key={edificio} value={edificio}>
                  {edificio}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
            <select 
              name="estatus" value={formData.estatus} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white"
            >
              <option value="ACTIVO">Activo</option>
              <option value="MANTENIMIENTO">En Mantenimiento</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button 
              type="button" onClick={alCerrar} disabled={cargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={cargando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 shadow-sm"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAulaModal;