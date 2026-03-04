import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Home, Beaker, MapPin, Users } from 'lucide-react';
import EditAulaModal from './EditAulaModal'; 
import AddAulaModal from './AddAulaModal';
import DeactivateAulaModal from './DeactivateAulaModal';

const AulaManagement = () => {
  const [aulas, setAulas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [mostrarModalEdit, setMostrarModalEdit] = useState(false);
  const [mostrarModalAdd, setMostrarModalAdd] = useState(false);
  const [mostrarModalDeactivate, setMostrarModalDeactivate] = useState(false);

  // 1. Cargar datos desde el Backend (HU-30)
  const cargarAulas = async () => {
    try {
      const response = await fetch('/api/aulas/consultar');
      const data = await response.json();
      setAulas(data);
    } catch (error) {
      console.error("Error al cargar aulas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAulas();
  }, []);

 
  const aulasFiltradas = aulas.filter(aula => 
    aula.nombre_codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    aula.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6 font-['Figtree'] bg-white min-h-screen">
    
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestión de Aulas y Laboratorios</h1>
          <p className="text-gray-500 text-sm">Administra los espacios físicos de la institución (HU-31)</p>
        </div>
        
        <button 
        onClick={() => setMostrarModalAdd(true)}
        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-sm">
          <Plus className="w-4 h-4" />
          Nuevo Espacio
        </button>
      </div>

  
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar por nombre o edificio..." 
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

  
      <div className="overflow-x-auto border border-gray-100 rounded-xl shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Espacio</th>
              <th className="px-6 py-4 font-semibold">Tipo / Capacidad</th>
              <th className="px-6 py-4 font-semibold">Ubicación</th>
              <th className="px-6 py-4 font-semibold">Estatus</th>
              <th className="px-6 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan="5" className="text-center py-10 text-gray-400 italic">Cargando espacios...</td></tr>
            ) : aulasFiltradas.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-10 text-gray-400">No se encontraron resultados.</td></tr>
            ) : (
              aulasFiltradas.map((aula) => (
                <tr key={aula.id_aula} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${aula.tipo === 'LABORATORIO' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                        {aula.tipo === 'LABORATORIO' ? <Beaker className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                      </div>
                      <span className="font-bold text-gray-700">{aula.nombre_codigo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col text-sm">
                      <span className="text-gray-600">{aula.tipo}</span>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Users className="w-3 h-3" /> {aula.capacidad} personas
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 text-gray-300" />
                      {aula.ubicacion}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      aula.estatus === 'ACTIVO' ? 'bg-green-100 text-green-700' :
                      aula.estatus === 'MANTENIMIENTO' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {aula.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* BOTÓN EDITAR ( HU-31) */}
                      <button 
                        onClick={() => {
                          setAulaSeleccionada(aula);
                          setMostrarModalEdit(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar Espacio"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button  onClick={() => {
                            setAulaSeleccionada(aula);
                            setMostrarModalDeactivate(true);
                        }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Desactivar"
                        >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

   
      {mostrarModalEdit && (
        <EditAulaModal 
          aula={aulaSeleccionada} 
          alCerrar={() => setMostrarModalEdit(false)} 
          alExito={cargarAulas} 
          adminId={1}
        />
      )}
      {mostrarModalAdd && (
  <AddAulaModal 
    alCerrar={() => setMostrarModalAdd(false)} 
    alExito={cargarAulas} 
    adminId={1} 
  />
)}
{mostrarModalDeactivate && (
  <DeactivateAulaModal 
    aula={aulaSeleccionada} 
    alCerrar={() => setMostrarModalDeactivate(false)} 
    alExito={cargarAulas} 
    adminId={1} 
  />
)}
    </div>
  );
};

export default AulaManagement;