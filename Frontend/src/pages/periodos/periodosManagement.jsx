import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Loader2, Edit, Trash2, ChevronLeft, ChevronRight, Hash, Calendar, CalendarDays } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PeriodosForm } from './periodosForm';
import { PeriodosDelete } from './periodosDelete';
import { useAuth } from '../../hooks/useAuth';

export const PeriodosManagement = () => {
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [periodos, setPeriodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [periodoToEdit, setPeriodoToEdit] = useState(null);
  const [periodoToDelete, setPeriodoToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-MX", { timeZone: 'UTC' });
  };

  const fetchPeriodos = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/periodos');
      const data = response.data.data || response.data;
      setPeriodos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar periodos:", error);
      toast.error('Error al cargar el listado de periodos');
      setPeriodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPeriodos = useMemo(() => {
    return periodos.filter(p => {
      const busqueda = searchTerm.toLowerCase();
      const codigoPeriodo = p.codigo?.toLowerCase() || '';

      const coincideBusqueda = codigoPeriodo.includes(busqueda);
      const coincideYear = filterYear ? p.anio.toString() === filterYear : true;
      const coincideEstatus = filterStatus ? p.estatus === filterStatus : true;

      return coincideBusqueda && coincideYear && coincideEstatus;
    });
  }, [periodos, searchTerm, filterYear, filterStatus]);

  const totalPages = Math.ceil(filteredPeriodos.length / itemsPerPage) || 1;
  const paginatedPeriodos = filteredPeriodos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterStatus]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setPeriodoToEdit(null);
    fetchPeriodos();
  };

  const handleNuevoPeriodo = () => {
    setPeriodoToEdit(null);
    setShowForm(true);
  };

  const handleEditarPeriodo = (periodo) => {
    setPeriodoToEdit(periodo);
    setShowForm(true);
  };

  if (showForm) {
    return (
      <PeriodosForm 
        periodoToEdit={periodoToEdit}
        onBack={() => {
          setShowForm(false);
          setPeriodoToEdit(null);
        }} 
        onSuccess={handleSuccessAction} 
      />
    );
  }

  // Obtenemos los años únicos para el selector dinámico
  const uniqueYears = [...new Set(periodos.map(p => p.anio))].sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de periodos
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra los cuatrimestres y fechas límite del ciclo escolar.</p>
        </div>
        <button 
          onClick={handleNuevoPeriodo} 
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo periodo
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código (ej. ENERO-ABRIL)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[180px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todos los años</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full min-w-[180px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
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
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Periodo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Año</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Inicio - Fin</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Límite Calif.</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando catálogo...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPeriodos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <CalendarDays className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">No se encontraron periodos con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPeriodos.map((p) => (
                  <tr key={p.id_periodo} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-bold text-slate-900">
                        <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                        {p.codigo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-slate-700">
                        <Hash className="w-4 h-4 mr-1 text-slate-400" />
                        {p.anio}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-600">
                        {formatDate(p.fecha_inicio)} <span className="text-slate-400 mx-1">→</span> {formatDate(p.fecha_fin)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg inline-flex items-center">
                        {formatDate(p.fecha_limite_calif)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${
                        p.estatus === 'ACTIVO' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : p.estatus === 'INACTIVO'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {p.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          title="Editar periodo" 
                          onClick={() => handleEditarPeriodo(p)}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          title="Cambiar estatus / Eliminar" 
                          onClick={() => setPeriodoToDelete(p)}
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

        {!isLoading && filteredPeriodos.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredPeriodos.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredPeriodos.length}</span> registros
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

      {periodoToDelete && (
        <PeriodosDelete
          periodo={periodoToDelete}
          onClose={() => setPeriodoToDelete(null)}
          onSuccess={() => {
            setPeriodoToDelete(null);
            fetchPeriodos();
          }}
        />
      )}
    </div>
  );
};