import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Filter, Users, Loader2, Edit, 
  Trash2, ChevronLeft, ChevronRight, Hash, 
  BookOpen, Calendar, RotateCcw 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { GrupoForm } from './GrupoForm';
import { useAuth } from '../../hooks/useAuth';

import { DesactivarGrupoModal } from './DesactivarGrupoModal';
import { ReactivarGrupoModal } from './ReactivarGrupoModal';

export const GrupoManagement = () => {
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [grupos, setGrupos] = useState([]);
  const [carrerasLista, setCarrerasLista] = useState([]);
  const [cuatrimestresLista, setCuatrimestresLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [grupoAEditar, setGrupoAEditar] = useState(null);

  const [grupoToDesactivar, setGrupoToDesactivar] = useState(null);
  const [grupoToReactivar, setGrupoToReactivar] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [carreraFilter, setCarreraFilter] = useState('');
  const [cuatrimestreFilter, setCuatrimestreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState(''); 
  
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
      const coincideCarrera = carreraFilter ? grupo.carrera_id === Number(carreraFilter) : true;
      const coincideCuatrimestre = cuatrimestreFilter ? grupo.nombre_cuatrimestre === cuatrimestreFilter : true;
      const coincideEstatus = statusFilter ? grupo.estatus === statusFilter : true;
      const coincideNivel = nivelFilter ? (grupo.nivel_academico || 'LICENCIATURA') === nivelFilter : true;

      return coincideBusqueda && coincideCarrera && coincideCuatrimestre && coincideEstatus && coincideNivel;
    });
  }, [grupos, searchTerm, carreraFilter, cuatrimestreFilter, statusFilter, nivelFilter]);

  const totalPages = Math.ceil(filteredGrupos.length / itemsPerPage) || 1;
  const paginatedGrupos = filteredGrupos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, carreraFilter, cuatrimestreFilter, statusFilter, nivelFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setGrupoAEditar(null);
    setGrupoToDesactivar(null);
    setGrupoToReactivar(null);
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

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 px-4 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Users className="w-7 h-7 mr-3 text-white/90" />
            Grupos
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Administra los grupos asignados a las diferentes carreras y maestrías.
          </p>
        </div>
        <button 
          onClick={handleNuevoGrupo} 
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo grupo
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por identificador del grupo o programa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <div className="relative flex items-center w-full sm:w-auto min-w-[140px]">
             <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={nivelFilter}
              onChange={(e) => setNivelFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Nivel: Todos</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="MAESTRIA">Maestría</option>
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[180px]">
             <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={carreraFilter}
              onChange={(e) => setCarreraFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todas las carreras</option>
              {carrerasLista.map(carrera => (
                <option key={carrera.id_carrera} value={carrera.id_carrera}>
                  {carrera.codigo_unico || `ID: ${carrera.id_carrera}`}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[180px]">
             <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={cuatrimestreFilter}
              onChange={(e) => setCuatrimestreFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los cuatris</option>
              {cuatrimestresLista.map(cuatrimestre => (
                <option key={cuatrimestre.id_cuatrimestre} value={cuatrimestre.nombre}>
                  {cuatrimestre.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[150px]">
             <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los estatus</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Identificador</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Programa / Carrera</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Modalidad</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Cuatrimestre</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Consultando catálogo...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedGrupos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">No se encontraron grupos con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedGrupos.map((grupo) => (
                  <tr key={grupo.id_grupo} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-black text-[#0B1828]">
                          <Hash className="w-4 h-4 mr-1 text-slate-400" />
                          {grupo.identificador}
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${grupo.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {grupo.nivel_academico || 'LICENCIATURA'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[400px] whitespace-normal align-middle">
                      <div className="text-sm font-bold text-slate-700 flex items-start leading-snug break-words">
                        {grupo.nombre_carrera || 'Sin asignar'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center">
                        {grupo.modalidad || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-[#0B1828] bg-slate-100 px-3 py-1.5 rounded-lg inline-flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {grupo.nombre_cuatrimestre || `Cuatrimestre ${grupo.cuatrimestre_id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${
                        grupo.estatus === 'ACTIVO' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {grupo.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                      <button 
                        title={grupo.estatus === 'INACTIVO' ? "No se puede editar un grupo inactivo" : "Editar grupo"}
                        onClick={() => handleEditarGrupo(grupo)}
                        disabled={grupo.estatus === 'INACTIVO'}
                        className={`p-2 rounded-xl transition-all ${
                          grupo.estatus === 'INACTIVO' 
                            ? 'text-slate-200 cursor-not-allowed' 
                            : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:scale-95'
                        }`}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                        
                        {grupo.estatus === 'ACTIVO' ? (
                          <button
                            title="Desactivar grupo"
                            onClick={() => setGrupoToDesactivar(grupo)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            title="Reactivar grupo"
                            onClick={() => setGrupoToReactivar(grupo)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredGrupos.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredGrupos.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{filteredGrupos.length}</span> registros
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

      <DesactivarGrupoModal 
        grupo={grupoToDesactivar} 
        onClose={() => setGrupoToDesactivar(null)} 
        onSuccess={handleSuccessAction} 
      />
      <ReactivarGrupoModal 
        grupo={grupoToReactivar} 
        onClose={() => setGrupoToReactivar(null)} 
        onSuccess={handleSuccessAction} 
      />
    </div>
  );
};