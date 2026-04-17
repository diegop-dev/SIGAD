import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Edit, Home, Beaker,
  MapPin, Users, Filter, Loader2, ToggleLeft, ToggleRight,
  ChevronLeft, ChevronRight, Trash2, CheckCircle2, Eye
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AulaForm } from './AulaForm';
import { AulaModal } from './AulaModal';
import DeactivateAulaModal from './DeactivateAulaModal';
import ReactivateAulaModal from './ReactivateAulaModal';

const AulaManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [aulaSeleccionada, setAulaSeleccionada] = useState(null);
  const [viewAula, setViewAula] = useState(null);
  
  const [aulas, setAulas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modales
  const [modalState, setModalState] = useState({ del: false, reactivate: false });
  const [actionAula, setActionAula] = useState(null);

  const cargarAulas = async () => {
    try {
      setCargando(true);
      const response = await api.get('/aulas/consultar');
      setAulas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error al cargar aulas:', error);
      setAulas([]);
      toast.error('Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarAulas(); }, []);

  const aulasFiltradas = useMemo(() => {
    return aulas.filter(aula => {
      const nombre = aula.nombre_codigo || '';
      const ubicacion = aula.ubicacion || '';
      const cumpleTexto =
        nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        ubicacion.toLowerCase().includes(busqueda.toLowerCase());
      const cumpleTipo = filtroTipo === 'TODOS' || aula.tipo === filtroTipo;
      return cumpleTexto && cumpleTipo;
    });
  }, [aulas, busqueda, filtroTipo]);

  const totalPages = Math.ceil(aulasFiltradas.length / itemsPerPage) || 1;
  const paginatedAulas = aulasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, filtroTipo]);

  const getStatusBadge = (estatus) => {
    if (estatus === 'ACTIVO')       return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (estatus === 'MANTENIMIENTO') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const handleSuccessAction = () => {
    setShowForm(false);
    setAulaSeleccionada(null);
    cargarAulas();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setAulaSeleccionada(null);
  };

  if (showForm) {
    return (
      <AulaForm 
        aulaToEdit={aulaSeleccionada}
        onBack={handleCloseForm}
        onSuccess={handleSuccessAction}
      />
    );
  }

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Home className="w-7 h-7 mr-3 text-white/90" />
            Catálogo de espacios
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Gestión de aulas y laboratorios institucionales.
          </p>
        </div>
        <button
          onClick={() => { setAulaSeleccionada(null); setShowForm(true); }}
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo espacio
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o ubicación..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        <div className="relative flex items-center min-w-[200px]">
          <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="AULA">Solo Aulas</option>
            <option value="LABORATORIO">Solo Laboratorios</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Espacio</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Capacidad</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando catálogo de espacios...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedAulas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <Home className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">No se encontraron resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">
                        No hay espacios que coincidan con los filtros de búsqueda actuales.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAulas.map((aula) => (
                  <tr key={aula.id_aula} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 flex items-center justify-center rounded-full shrink-0 shadow-sm border ${aula.tipo === 'LABORATORIO' ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                          {aula.tipo === 'LABORATORIO'
                            ? <Beaker className="w-5 h-5" />
                            : <Home className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-[#0B1828]">{aula.nombre_codigo}</p>
                          <p className="text-xs font-bold text-slate-500 flex items-center mt-0.5">{aula.tipo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[#0B1828]">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-bold">{aula.capacidad}</span>
                        <span className="text-xs font-normal text-slate-500">lugares</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-[#0B1828]">
                        <MapPin className="w-4 h-4 shrink-0 text-slate-400" />
                        {aula.ubicacion}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${getStatusBadge(aula.estatus)}`}>
                        {aula.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          title="Ver información"
                          onClick={() => setViewAula(aula)}
                          className="p-2 text-slate-400 hover:text-[#0B1828] hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          title="Modificar espacio"
                          onClick={() => { setAulaSeleccionada(aula); setShowForm(true); }}
                          className="p-2 text-slate-400 hover:text-[#0B1828] hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          title={aula.estatus === 'INACTIVO' ? 'Reactivar espacio' : 'Desactivar espacio'}
                          onClick={() => { 
                            setActionAula(aula); 
                            if (aula.estatus === 'INACTIVO') {
                              setModalState({ ...modalState, reactivate: true });
                            } else {
                              setModalState({ ...modalState, del: true }); 
                            }
                          }}
                          className={`p-2 rounded-xl transition-all active:scale-95 ${
                            aula.estatus === 'INACTIVO'
                              ? 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                        >
                          {aula.estatus === 'INACTIVO'
                            ? <CheckCircle2 className="w-5 h-5" />
                            : <Trash2 className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!cargando && aulasFiltradas.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, aulasFiltradas.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{aulasFiltradas.length}</span> registros
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] hover:border-[#0B1828]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-xl bg-white border border-slate-200 text-sm font-black text-[#0B1828] shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] hover:border-[#0B1828]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales de Confirmación y Visualización */}
      {viewAula && (
        <AulaModal 
          aula={viewAula} 
          onClose={() => setViewAula(null)} 
        />
      )}
      {modalState.del && actionAula && (
        <DeactivateAulaModal
          aula={actionAula}
          alCerrar={() => setModalState({ ...modalState, del: false })}
          alExito={cargarAulas}
          adminId={1}
        />
      )}
      {modalState.reactivate && actionAula && (
        <ReactivateAulaModal
          aula={actionAula}
          alCerrar={() => setModalState({ ...modalState, reactivate: false })}
          alExito={cargarAulas}
          adminId={1}
        />
      )}
    </div>
  );
};

export default AulaManagement;
