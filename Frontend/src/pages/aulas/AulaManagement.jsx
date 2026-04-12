import { useState, useEffect } from 'react';
import {
  Search, Plus, Edit, Home, Beaker,
  MapPin, Users, Filter, Loader2, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import ModalRegistroAula from './ModalRegistroAula';
import ModalEditarAula from './EditAulaModal';
import ModalDeactivarAula from './DeactivateAulaModal';

const GestionAulas = () => {
  const [listaAulas, setListaAulas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [estaCargando, setEstaCargando] = useState(true);

  const [estadoModal, setEstadoModal] = useState({ crear: false, editar: false, eliminar: false });
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);

  const cargarAulas = async () => {
    try {
      setEstaCargando(true);
      const respuesta = await api.get('/aulas/consultar');
      setListaAulas(Array.isArray(respuesta.data) ? respuesta.data : []);
    } catch (error) {
      console.error('Error al cargar aulas:', error);
      setListaAulas([]);
      toast.error('Error al conectar con el servidor');
    } finally {
      setEstaCargando(false);
    }
  };

  useEffect(() => { cargarAulas(); }, []);

  // ==========================================
  // LÓGICA DE BÚSQUEDA BLINDADA (HU-30)
  // ==========================================
  
  const manejarBusqueda = (evento) => {
    const valor = evento.target.value;
    
    // REGEX: Solo permite letras, números, espacios y guiones.
    // Si el usuario presiona "%" o "'", simplemente el input lo ignora.
    const regexBuscadorSeguro = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]*$/;
    
    if (regexBuscadorSeguro.test(valor)) {
      setBusqueda(valor);
    }
  };

  // Limpiamos la cadena: Quitamos espacios al inicio/fin y eliminamos espacios dobles en medio
  const busquedaLimpia = busqueda.trim().replace(/\s+/g, ' ');
  const requiereMasCaracteres = busquedaLimpia.length > 0 && busquedaLimpia.length < 3;

const aulasFiltradas = listaAulas.filter(aula => {
    let cumpleTexto = true;

    // Solo aplicamos el filtro de texto si ya escribieron 3 o más caracteres válidos
    if (busquedaLimpia.length >= 3) {
      const nombre = (aula.nombre_codigo || '').toLowerCase();
      const ubicacion = (aula.ubicacion || '').toLowerCase();
      const termino = busquedaLimpia.toLowerCase();
      cumpleTexto = nombre.includes(termino) || ubicacion.includes(termino);
    }

    const cumpleTipo = filtroTipo === 'TODOS' || aula.tipo === filtroTipo;
    return cumpleTexto && cumpleTipo;
  });

  const obtenerClaseEstatus = (estatus) => {
    if (estatus === 'ACTIVO')       return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (estatus === 'MANTENIMIENTO') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Home className="w-8 h-8 mr-3 text-blue-600" />
            Catálogo de espacios
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Gestión de aulas y laboratorios institucionales.
          </p>
        </div>
        <button
          onClick={() => setEstadoModal({ ...estadoModal, crear: true })}
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo espacio
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={busqueda}
            onChange={manejarBusqueda}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
          {/* Advertencia si hay menos de 3 caracteres */}
          {requiereMasCaracteres && (
            <p className="absolute -bottom-5 left-2 text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Escribe al menos 3 caracteres para buscar.
            </p>
          )}
        </div>
        <div className="relative flex items-center min-w-[200px]">
          <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="AULA">Solo Aulas</option>
            <option value="LABORATORIO">Solo Laboratorios</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Espacio</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Capacidad</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {estaCargando ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando espacios...</p>
                    </div>
                  </td>
                </tr>
              ) : aulasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Search className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">
                        No hay espacios que coincidan con la búsqueda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                aulasFiltradas.map((aula) => (
                  <tr key={aula.id_aula} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${aula.tipo === 'LABORATORIO' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                          {aula.tipo === 'LABORATORIO'
                            ? <Beaker className="w-5 h-5" />
                            : <Home className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{aula.nombre_codigo}</p>
                          <p className="text-xs font-medium text-slate-400 uppercase">{aula.tipo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-300" />
                        <span className="font-bold">{aula.capacidad}</span>
                        <span className="text-xs text-slate-400">lugares</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="w-4 h-4 shrink-0 text-slate-300" />
                        {aula.ubicacion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${obtenerClaseEstatus(aula.estatus)}`}>
                        {aula.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          title="Editar espacio"
                          onClick={() => { setAulaSeleccionada(aula); setEstadoModal({ ...estadoModal, editar: true }); }}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          disabled={aula.estatus === 'INACTIVO'}
                          title={aula.estatus === 'INACTIVO' ? 'Espacio ya desactivado' : 'Desactivar espacio'}
                          onClick={() => { setAulaSeleccionada(aula); setEstadoModal({ ...estadoModal, eliminar: true }); }}
                          className={`p-2 rounded-lg transition-all ${
                            aula.estatus === 'INACTIVO'
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {aula.estatus === 'INACTIVO'
                            ? <ToggleLeft className="w-6 h-6" />
                            : <ToggleRight className="w-6 h-6" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modales */}
      {estadoModal.crear && (
        <ModalRegistroAula
          alCerrar={() => setEstadoModal({ ...estadoModal, crear: false })}
          alExito={cargarAulas}
          adminId={1}
        />
      )}
      {estadoModal.editar && (
        <ModalEditarAula
          aula={aulaSeleccionada}
          alCerrar={() => setEstadoModal({ ...estadoModal, editar: false })}
          alExito={cargarAulas}
          adminId={1}
        />
      )}
      {estadoModal.eliminar && (
        <ModalDeactivarAula
          aula={aulaSeleccionada}
          alCerrar={() => setEstadoModal({ ...estadoModal, eliminar: false })}
          alExito={cargarAulas}
          adminId={1}
        />
      )}
    </div>
  );
};

export default GestionAulas;
