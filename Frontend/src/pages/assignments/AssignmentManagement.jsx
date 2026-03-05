import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, CalendarDays, Loader2, Calendar, MapPin, User, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AssignmentForm } from './AssignmentForm';
import { useAuth } from '../../hooks/useAuth';

export const AssignmentManagement = () => {
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [asignaciones, setAsignaciones] = useState([]);
  const [periodosLista, setPeriodosLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAsignaciones = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/asignaciones');
      const data = response.data.data || response.data;
      setAsignaciones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar asignaciones:", error);
      toast.error('Error al cargar el listado de asignaciones');
      setAsignaciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPeriodosFiltro = async () => {
    try {
      const response = await api.get('/periodos');
      const data = response.data.data || response.data;
      setPeriodosLista(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar periodos para el filtro:", error);
    }
  };

  useEffect(() => {
    fetchAsignaciones();
    fetchPeriodosFiltro();
  }, []);

  // Motor de filtrado en frontend
  const filteredAsignaciones = useMemo(() => {
    return asignaciones.filter(asignacion => {
      const busqueda = searchTerm.toLowerCase();
      const nombreDocente = `${asignacion.docente_nombres} ${asignacion.docente_apellido_paterno}`.toLowerCase();
      const nombreMateria = asignacion.nombre_materia?.toLowerCase() || '';
      const nombreGrupo = asignacion.nombre_grupo?.toLowerCase() || '';

      const coincideBusqueda = nombreDocente.includes(busqueda) || nombreMateria.includes(busqueda) || nombreGrupo.includes(busqueda);
      const coincidePeriodo = periodoFilter ? asignacion.nombre_periodo === periodoFilter : true;
      const coincideEstatus = statusFilter ? asignacion.estatus_confirmacion === statusFilter : true;

      return coincideBusqueda && coincidePeriodo && coincideEstatus;
    });
  }, [asignaciones, searchTerm, periodoFilter, statusFilter]);

  // Lógica de paginación
  const totalPages = Math.ceil(filteredAsignaciones.length / itemsPerPage) || 1;
  const paginatedAsignaciones = filteredAsignaciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, periodoFilter, statusFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    fetchAsignaciones();
  };

  const handleNuevaAsignacion = () => {
    setShowForm(true);
  };

  const getStatusBadge = (estatus) => {
    const statusMap = {
      'ENVIADA': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACEPTADA': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'RECHAZADA': 'bg-red-100 text-red-800 border-red-200',
    };
    const cssClass = statusMap[estatus] || 'bg-slate-100 text-slate-800 border-slate-200';
    
    return (
      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${cssClass}`}>
        {estatus}
      </span>
    );
  };

  if (showForm) {
    return (
      <AssignmentForm 
        onBack={() => setShowForm(false)} 
        onSuccess={handleSuccessAction} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de asignaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra la distribución de horarios, docentes y aulas.</p>
        </div>
        <button 
          onClick={handleNuevaAsignacion} 
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nueva asignación
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por docente, materia o grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[220px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={periodoFilter}
              onChange={(e) => setPeriodoFilter(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todos los periodos</option>
              {periodosLista.map(periodo => (
                <option key={periodo.id_periodo} value={periodo.nombre_periodo}>
                  {periodo.nombre_periodo}
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full min-w-[180px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Todos los estatus</option>
            <option value="ENVIADA">Enviada</option>
            <option value="ACEPTADA">Aceptada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Docente</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Materia / Grupo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Horario</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Aula</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando asignaciones...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedAsignaciones.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <CalendarDays className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">No se encontraron asignaciones con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAsignaciones.map((asignacion) => (
                  <tr key={asignacion.id_asignacion} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mr-3 text-slate-500">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-900">
                          {asignacion.docente_nombres} {asignacion.docente_apellido_paterno}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800 flex items-center break-words max-w-[250px]">
                        <BookOpen className="w-4 h-4 mr-1.5 text-blue-500 shrink-0"/> 
                        <span className="truncate">{asignacion.nombre_materia}</span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-1">
                        Grupo: {asignacion.nombre_grupo} | {asignacion.nombre_periodo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-slate-700 text-sm font-medium bg-slate-100/80 inline-flex px-3 py-1.5 rounded-lg border border-slate-200">
                        <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                        {asignacion.dia_semana}: {asignacion.hora_inicio.substring(0,5)} - {asignacion.hora_fin.substring(0,5)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-slate-700 text-sm font-medium">
                        <MapPin className="w-4 h-4 mr-1.5 text-emerald-500" />
                        {asignacion.nombre_aula}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(asignacion.estatus_confirmacion)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación (Se oculta si no hay registros o está cargando) */}
        {!isLoading && filteredAsignaciones.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredAsignaciones.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredAsignaciones.length}</span> registros
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