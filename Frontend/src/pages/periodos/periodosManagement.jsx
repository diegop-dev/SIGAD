import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, 
  Filter, Loader2, CalendarDays, Hash, Calendar, Clock, CheckCircle 
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PeriodosForm } from './periodosForm';
import { PeriodosDelete } from './periodosDelete';
import { PeriodosActivate } from './periodosActivate'; // Asegúrate de importar el nuevo componente

export const PeriodosManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const [periodos, setPeriodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para modales
  const [periodoToEdit, setPeriodoToEdit] = useState(null);
  const [periodoToDelete, setPeriodoToDelete] = useState(null);
  const [periodoToActivate, setPeriodoToActivate] = useState(null);

  // Estados de búsqueda con debounce
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filterYear, setFilterYear] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPeriodos = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/periodos');
      const data = response.data.data || response.data;
      setPeriodos(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error cargando periodos");
      setPeriodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  // Validación y debounce de búsqueda
  const handleSearchInput = (e) => {
    let val = e.target.value;
    
    // 1. Permitir letras, números, espacios y algunos caracteres (SIN arroba '@')
    val = val.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d10-9._\-\s]/g, '');
    
    // 2. Sin espacios al inicio y máximo un espacio consecutivo entre palabras
    val = val.replace(/^\s+/g, '').replace(/\s{2,}/g, ' ');

    setSearchInput(val);
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      // 3. El .trim() final asegura que si el usuario deja un espacio al final, 
      // no se envíe a la búsqueda, pero permite teclear normalmente.
      const cleanTerm = searchInput.trim();
      
      if (cleanTerm.length >= 3 || cleanTerm.length === 0) {
        setSearchTerm(cleanTerm);
      }
    }, 400);

    return () => clearTimeout(timerId);
  }, [searchInput]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-MX", { timeZone: "UTC" });
  };

  const filteredPeriodos = useMemo(() => {
    return periodos.filter((p) => {
      const busqueda = searchTerm.toLowerCase();
      const coincideBusqueda = 
        p.codigo?.toLowerCase().includes(busqueda) || 
        p.anio?.toString().includes(busqueda);
      
      const coincideYear = filterYear ? p.anio.toString() === filterYear : true;
      const coincideStatus = filterStatus ? p.estatus === filterStatus : true;

      return coincideBusqueda && coincideYear && coincideStatus;
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
    setPeriodoToDelete(null);
    setPeriodoToActivate(null);
    fetchPeriodos();
  };

  const uniqueYears = [...new Set(periodos.map((p) => p.anio))].sort((a, b) => b - a);

  if (showForm) {
    return (
      <PeriodosForm
        periodoToEdit={periodoToEdit}
        onBack={() => { setShowForm(false); setPeriodoToEdit(null); }}
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
            <CalendarDays className="w-7 h-7 mr-3 text-white/90" />
            Periodos
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Administra los ciclos escolares, fechas de inicio, fin y límites de calificaciones.
          </p>
        </div>
        <button 
          onClick={() => { setPeriodoToEdit(null); setShowForm(true); }} 
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo periodo
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
            maxLength="100"
            placeholder="Buscar por código o año (Mínimo 3 Caracteres)..."
            value={searchInput}
            onChange={handleSearchInput}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[200px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los años</option>
              {uniqueYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center min-w-[180px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los estatus</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Identificador</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Vigencia (Inicio - Fin)</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Vigencia (Calificación)</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Consultando la base de datos de periodos...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedPeriodos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <CalendarDays className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">No se encontraron resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">No hay periodos que coincidan con los filtros de búsqueda actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPeriodos.map((p) => (
                  <tr key={p.id_periodo} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center mr-4 text-slate-400 overflow-hidden shrink-0">
                          <Hash className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0B1828]">{p.codigo}</span>
                          <span className="text-xs font-bold text-slate-500 flex items-center mt-0.5">
                            Año {p.anio}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                          {formatDate(p.fecha_inicio)} - {formatDate(p.fecha_fin)}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-xs font-bold">{formatDate(p.fecha_limite_calif)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${
                        p.estatus === 'ACTIVO' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {p.estatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        
                        {/* Botón de Editar condicionado */}
                        <button 
                          title={p.estatus === 'ACTIVO' ? "Editar periodo" : "No es posible editar un periodo inactivo"} 
                          onClick={() => { if(p.estatus === 'ACTIVO') { setPeriodoToEdit(p); setShowForm(true); } }}
                          disabled={p.estatus !== 'ACTIVO'}
                          className={`p-2 rounded-xl transition-all active:scale-95 ${
                            p.estatus === 'ACTIVO'
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-300 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {p.estatus === 'ACTIVO' ? (
                          <button 
                            title="Desactivar periodo" 
                            onClick={() => setPeriodoToDelete(p)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            title="Reactivar periodo" 
                            onClick={() => setPeriodoToActivate(p)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
                          >
                            <CheckCircle className="w-5 h-5" />
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

        {/* Paginación */}
        {!isLoading && filteredPeriodos.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredPeriodos.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{filteredPeriodos.length}</span> registros
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
      
      {/* Modales */}
      {periodoToDelete && (
        <PeriodosDelete 
          periodo={periodoToDelete} 
          onClose={() => setPeriodoToDelete(null)} 
          onSuccess={handleSuccessAction} 
        />
      )}
      
      {periodoToActivate && (
        <PeriodosActivate 
          periodo={periodoToActivate} 
          onClose={() => setPeriodoToActivate(null)} 
          onSuccess={handleSuccessAction} 
        />
      )}
    </div>
  );
};