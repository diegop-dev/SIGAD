import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Users, Loader2, Edit, Trash2, ChevronLeft, ChevronRight, Hash, BookOpen, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GrupoForm } from './GrupoForm';
import { useAuth } from '../../hooks/useAuth';

export const GrupoManagement = () => {
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [carrerasLista, setCarrerasLista] = useState([]);
  const [cuatrimestresLista, setCuatrimestresLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grupoAEditar, setGrupoAEditar] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [carreraFilter, setCarreraFilter] = useState('');
  const [cuatrimestreFilter, setCuatrimestreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchGrupos = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/grupos');
      const data = response.data.data || response.data;
      setGrupos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar grupos:", error);
      toast.error('Error al cargar el listado de grupos');
      setGrupos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCatalogosFiltro = async () => {
    try {
      const [resCarreras, resCuatrimestres] = await Promise.all([
        api.get('/carreras'),
        api.get('/cuatrimestres')
      ]);
      
      const dataCarreras = resCarreras.data.data || resCarreras.data;
      setCarrerasLista(Array.isArray(dataCarreras) ? dataCarreras : []);

      const dataCuatrimestres = resCuatrimestres.data.data || resCuatrimestres.data;
      setCuatrimestresLista(Array.isArray(dataCuatrimestres) ? dataCuatrimestres : []);
    } catch (error) {
      console.error("Error al cargar catálogos para filtros:", error);
    }
  };

  useEffect(() => {
    fetchGrupos();
    fetchCatalogosFiltro();
  }, []);

  const filteredGrupos = useMemo(() => {
    return grupos.filter(grupo => {
      const busqueda = searchTerm.toLowerCase();
      const identificadorGrupo = grupo.identificador?.toLowerCase() || '';
      const nombreCarrera = grupo.nombre_carrera?.toLowerCase() || '';

      const coincideBusqueda = identificadorGrupo.includes(busqueda) || nombreCarrera.includes(busqueda);
      const coincideCarrera = carreraFilter ? grupo.nombre_carrera === carreraFilter : true;
      const coincideCuatrimestre = cuatrimestreFilter ? grupo.nombre_cuatrimestre === cuatrimestreFilter : true;
      const coincideEstatus = statusFilter ? grupo.estatus === statusFilter : true;

      return coincideBusqueda && coincideCarrera && coincideCuatrimestre && coincideEstatus;
    });
  }, [grupos, searchTerm, carreraFilter, cuatrimestreFilter, statusFilter]);

  const totalPages = Math.ceil(filteredGrupos.length / itemsPerPage) || 1;
  const paginatedGrupos = filteredGrupos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, carreraFilter, cuatrimestreFilter, statusFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setGrupoAEditar(null);
    fetchGrupos();
  };

  const handleNuevoGrupo = () => {
    setGrupoAEditar(null);
    setShowForm(true);
  };

  const handleEditarGrupo = (grupo) => {
    setGrupoAEditar(grupo);
    setShowForm(true);
  };

  const handleEliminarRapido = () => {
    toast("Función de eliminación en desarrollo", { icon: "🚧" });
  };

  if (showForm) {
    return (
      <GrupoForm 
        onBack={() => {
          setShowForm(false);
          setGrupoAEditar(null);
        }} 
        onSuccess={handleSuccessAction} 
        initialData={grupoAEditar}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de grupos
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra los grupos asignados a las diferentes carreras.</p>
        </div>
        <button 
          onClick={handleNuevoGrupo} 
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo grupo
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por identificador del grupo o carrera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative flex items-center">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={carreraFilter}
              onChange={(e) => setCarreraFilter(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todas las carreras</option>
              {carrerasLista.map(carrera => (
                <option key={carrera.id_carrera} value={carrera.nombre_carrera}>
                  {carrera.nombre_carrera}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <Calendar className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={cuatrimestreFilter}
              onChange={(e) => setCuatrimestreFilter(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todos los cuatrimestres</option>
              {cuatrimestresLista.map(cuatrimestre => (
                <option key={cuatrimestre.id_cuatrimestre} value={cuatrimestre.nombre}>
                  {cuatrimestre.nombre}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Todos los estatus</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Identificador</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Carrera</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cuatrimestre</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando catálogo...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedGrupos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">No se encontraron grupos con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGrupos.map((grupo) => (
                  <tr key={grupo.id_grupo} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-bold text-slate-900">
                        <Hash className="w-4 h-4 mr-1 text-slate-400" />
                        {grupo.identificador}
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[400px] whitespace-normal align-middle">
                      <div className="text-sm font-medium text-slate-700 leading-relaxed break-words">
                        <BookOpen className="w-4 h-4 inline mr-1 text-slate-400" />
                        {grupo.nombre_carrera || 'Sin asignar'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg inline-flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {grupo.nombre_cuatrimestre || `Cuatrimestre ${grupo.cuatrimestre_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${
                        grupo.estatus === 'ACTIVO' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : grupo.estatus === 'INACTIVO'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {grupo.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          title="Editar grupo" 
                          onClick={() => handleEditarGrupo(grupo)}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          title="Cambiar estatus" 
                          onClick={handleEliminarRapido}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredGrupos.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredGrupos.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredGrupos.length}</span> registros
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};