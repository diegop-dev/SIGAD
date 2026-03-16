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
const AddAulaModal = ({ alCerrar, alExito, adminId }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'AULA', 
    capacidad: '',
    ubicacion: ''
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
try {
  
    const datosAEnviar = {
  ...formData,
  capacidad: parseInt(formData.capacidad), 
  creado_por: adminId 
};
    const response = await api.post('/aulas/registrar', datosAEnviar);

    if (response.status === 201) {
      toast.success('¡Aula registrada con éxito!');
      alExito(); 
      alCerrar();
    }
  } catch (err) {
    
    const msg = err.response?.data?.message || "Error al conectar con el servidor";
    toast.error(msg);
  } finally {
    setCargando(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/50  backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] transition-all">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Espacio</h2>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Código</label>
            <input 
              type="text" name="nombre" value={formData.nombre} onChange={handleChange} 
              required placeholder="Ej. A-101 o Lab. Cómputo 1"
              maxLength={50}
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
                type="number" name="capacidad" value={formData.capacidad} onChange={handleChange} 
                min="1" max="200" required placeholder="Ej. 40"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edificio / Ubicación</label>
          { /* <input 
              type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} 
              required placeholder="Ej. Edificio B, Planta Baja"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            /> */}
            <select 
              name="ubicacion" 
              value={formData.ubicacion} 
              onChange={handleChange} 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="" disabled>Selecciona un edificio...</option>
              {EDIFICIOS_DISPONIBLES.map((edificio) => (
                <option key={edificio} value={edificio}>
                  {edificio}
                </option>
              ))}
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
              {cargando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAulaModal;