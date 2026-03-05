import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Home, Beaker, MapPin, Users, Filter } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast';   
import AddAulaModal from './AddAulaModal';
import EditAulaModal from './EditAulaModal';
import DeactivateAulaModal from './DeactivateAulaModal';

const AulaManagement = () => {
  const [aulas, setAulas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");
  const [cargando, setCargando] = useState(true);
  
  // Estados para modales
  const [modalState, setModalState] = useState({ add: false, edit: false, del: false });
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);

const cargarAulas = async () => {
  try {
    setCargando(true);
    const response = await api.get('/aulas/consultar');
    
    // VALIDACIÓN CLAVE:
    // Si la respuesta es un arreglo, lo guardamos. 
    // Si no, guardamos un arreglo vacío para que .filter() no falle.
    if (Array.isArray(response.data)) {
      setAulas(response.data);
    } else {
      console.error("La API no devolvió un arreglo:", response.data);
      setAulas([]); 
    }
  } catch (error) {
    console.error("Error al cargar aulas:", error);
    setAulas([]); // En caso de error, mantenemos el arreglo vacío
    toast.error("Error al conectar con el servidor");
  } finally {
    setCargando(false);
  }
};
  
  useEffect(() => { cargarAulas(); }, []);

  //  búsqueda
  const aulasFiltradas = Array.isArray(aulas) 
  ? aulas.filter(aula => {
   
      const nombre = aula.nombre_codigo || ""; 
      const ubicacion = aula.ubicacion || "";
    const cumpleTexto = nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                        ubicacion.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleTipo = filtroTipo === "TODOS" || aula.tipo === filtroTipo;
    return cumpleTexto && cumpleTipo;
  }): [];

  return (
    <div className="p-6 font-['Figtree'] bg-white min-h-screen">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Catálogo de Espacios</h1>
          <p className="text-gray-500 text-sm italic">Gestión de Aulas y Laboratorios (HU-30 / HU-31)</p>
        </div>
        
        <button 
          onClick={() => setModalState({ ...modalState, add: true })}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nuevo Espacio
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o edificio..." 
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
          <Filter className="w-4 h-4 text-gray-400 ml-2" />
          <select 
            className="bg-transparent border-none outline-none text-sm text-gray-600 pr-4 cursor-pointer"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="AULA">Solo Aulas</option>
            <option value="LABORATORIO">Solo Laboratorios</option>
          </select>
        </div>
      </div>

      {/* Tabla con diseño unificado */}
      <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm bg-gray-50/30">
        <table className="w-full text-left">
          <thead className="bg-white text-gray-400 text-[11px] uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-bold">Espacio</th>
              <th className="px-6 py-4 font-bold">Capacidad</th>
              <th className="px-6 py-4 font-bold">Ubicación</th>
              <th className="px-6 py-4 font-bold">Estatus</th>
              <th className="px-6 py-4 font-bold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {cargando ? (
               <tr><td colSpan="5" className="text-center py-20 text-gray-400 animate-pulse">Sincronizando con SIGAD...</td></tr>
            ) : aulasFiltradas.length === 0 ? (
               <tr><td colSpan="5" className="text-center py-20 text-gray-400">No hay espacios que coincidan con tu búsqueda.</td></tr>
            ) : (
              aulasFiltradas.map((aula) => (
                <tr key={aula.id_aula} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${aula.tipo === 'LABORATORIO' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {aula.tipo === 'LABORATORIO' ? <Beaker className="w-5 h-5" /> : <Home className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800">{aula.nombre_codigo}</span>
                        <span className="text-[10px] font-medium text-gray-400 uppercase">{aula.tipo}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users className="w-4 h-4 text-gray-300" />
                      <span className="font-semibold">{aula.capacidad}</span>
                      <span className="text-xs text-gray-400">lugares</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 shrink-0" />
                      {aula.ubicacion}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wider ${
                      aula.estatus === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' :
                      aula.estatus === 'MANTENIMIENTO' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {aula.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { setAulaSeleccionada(aula); setModalState({ ...modalState, edit: true }); }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setAulaSeleccionada(aula); setModalState({ ...modalState, del: true }); }}
                        className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg transition-all" title="Eliminar"
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

      {/* Modales integrados */}
      {modalState.add && (
        <AddAulaModal alCerrar={() => setModalState({ ...modalState, add: false })} alExito={cargarAulas} adminId={1} />
      )}
      {modalState.edit && (
        <EditAulaModal aula={aulaSeleccionada} alCerrar={() => setModalState({ ...modalState, edit: false })} alExito={cargarAulas} adminId={1} />
      )}
      {modalState.del && (
        <DeactivateAulaModal aula={aulaSeleccionada} alCerrar={() => setModalState({ ...modalState, del: false })} alExito={cargarAulas} adminId={1} />
      )}
    </div>
  );
};

export default AulaManagement;