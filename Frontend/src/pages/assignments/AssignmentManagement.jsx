import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, CalendarDays, Loader2, Calendar, MapPin, User, BookOpen, ChevronLeft, ChevronRight, Edit2, Ban, RotateCcw, AlertTriangle, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AssignmentForm } from './AssignmentForm';
import { useAuth } from '../../hooks/useAuth';

export const AssignmentManagement = () => {
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [asignacionToEdit, setAsignacionToEdit] = useState(null); 
  const [asignacionesRaw, setAsignacionesRaw] = useState([]); 
  const [periodosLista, setPeriodosLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  
  // NUEVOS ESTADOS: Filtros separados
  const [operativoFilter, setOperativoFilter] = useState('');
  const [confirmacionFilter, setConfirmacionFilter] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    isCanceling: false,
    asignacion: null
  });

  const fetchAsignaciones = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/asignaciones');
      const data = response.data.data || response.data;
      setAsignacionesRaw(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar asignaciones:", error);
      toast.error('Error al cargar el listado de asignaciones');
      setAsignacionesRaw([]);
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

  // MOTOR DE AGRUPACIÓN CORREGIDO
  const asignacionesAgrupadas = useMemo(() => {
    const agrupadasActivas = {};
    const agrupadasCerradas = {};

    // 1. Separar filas activas de las cerradas (historial)
    asignacionesRaw.forEach(item => {
      const compositeKey = `${item.periodo_id}_${item.docente_id}_${item.materia_id}_${item.grupo_id}`;
      const horarioData = {
        id_asignacion: item.id_asignacion,
        dia_semana: item.dia_semana,
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
        aula_id: item.aula_id,
        nombre_aula: item.nombre_aula
      };

      if (item.estatus_acta !== 'CERRADA') {
        if (!agrupadasActivas[compositeKey]) {
          agrupadasActivas[compositeKey] = { ...item, horarios: [] };
        }
        agrupadasActivas[compositeKey].horarios.push(horarioData);
      } else {
        if (!agrupadasCerradas[compositeKey]) {
          agrupadasCerradas[compositeKey] = { ...item, horarios: [] };
        }
        agrupadasCerradas[compositeKey].horarios.push(horarioData);
      }
    });

    // 2. Consolidar: Mostramos todas las activas
    const result = Object.values(agrupadasActivas);

    // 3. Solo agregamos al listado las CERRADAS si NO existe una versión ACTIVA para esa materia/grupo.
    Object.keys(agrupadasCerradas).forEach(key => {
      if (!agrupadasActivas[key]) {
        result.push(agrupadasCerradas[key]);
      }
    });

    return result;
  }, [asignacionesRaw]);

  // MOTOR DE BÚSQUEDA Y FILTRADO (Actualizado para filtros independientes)
  const filteredAsignaciones = useMemo(() => {
    return asignacionesAgrupadas.filter(asignacion => {
      const busqueda = searchTerm.toLowerCase();
      const nombreDocente = `${asignacion.docente_nombres || ''} ${asignacion.docente_apellido_paterno || ''}`.toLowerCase();
      const nombreMateria = asignacion.nombre_materia?.toLowerCase() || '';
      const nombreGrupo = asignacion.nombre_grupo?.toLowerCase() || '';

      const coincideBusqueda = nombreDocente.includes(busqueda) || nombreMateria.includes(busqueda) || nombreGrupo.includes(busqueda);
      const coincidePeriodo = periodoFilter ? asignacion.nombre_periodo === periodoFilter : true;
      
      const coincideOperativo = operativoFilter ? asignacion.estatus_acta === operativoFilter : true;
      const coincideConfirmacion = confirmacionFilter ? asignacion.estatus_confirmacion === confirmacionFilter : true;

      return coincideBusqueda && coincidePeriodo && coincideOperativo && coincideConfirmacion;
    });
  }, [asignacionesAgrupadas, searchTerm, periodoFilter, operativoFilter, confirmacionFilter]);

  const totalPages = Math.ceil(filteredAsignaciones.length / itemsPerPage) || 1;
  const paginatedAsignaciones = filteredAsignaciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reiniciar a la primera página si cambia cualquier filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, periodoFilter, operativoFilter, confirmacionFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setAsignacionToEdit(null);
    fetchAsignaciones();
  };

  const handleEdit = (asignacion) => {
    setAsignacionToEdit(asignacion);
    setShowForm(true);
  };

  const openConfirmModal = (asignacion, isCanceling) => {
    setConfirmModal({
      isOpen: true,
      isCanceling,
      asignacion
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      isCanceling: false,
      asignacion: null
    });
  };

  const executeToggleStatus = async () => {
    const { isCanceling, asignacion } = confirmModal;
    const actionText = isCanceling ? "cancelar" : "reactivar";
    const endpoint = isCanceling ? "/asignaciones" : "/asignaciones/reactivar";
    const httpMethod = isCanceling ? api.delete : api.patch;

    closeConfirmModal();
    const toastId = toast.loading(`Procesando petición en el servidor...`);
    
    try {
      const payload = {
        data: {
          periodo_id: asignacion.periodo_id,
          materia_id: asignacion.materia_id,
          docente_id: asignacion.docente_id,
          grupo_id: asignacion.grupo_id
        }
      };
      
      if (isCanceling) {
        await httpMethod(endpoint, payload);
      } else {
        await httpMethod(endpoint, payload.data);
      }

      toast.success(`Asignación ${isCanceling ? 'cancelada' : 'reactivada'} exitosamente`, { id: toastId });
      fetchAsignaciones();
    } catch (error) {
      toast.error(error.response?.data?.error || `Error al ${actionText} la asignación`, { id: toastId });
    }
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
        {estatus || 'DESCONOCIDO'}
      </span>
    );
  };

  const diasSemanaMapa = {
    1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado"
  };

  if (showForm) {
    return (
      <AssignmentForm 
        onBack={() => { setShowForm(false); setAsignacionToEdit(null); }} 
        onSuccess={handleSuccessAction} 
        initialData={asignacionToEdit} 
      />
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de asignaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra la distribución de horarios, docentes y aulas.</p>
        </div>
        {(user?.rol_id === 1 || user?.rol_id === 2) && (
          <button 
            onClick={() => { setAsignacionToEdit(null); setShowForm(true); }} 
            className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
          >
            <Plus className="w-5 h-5 mr-2" /> Nueva asignación
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
        {/* Barra de Búsqueda */}
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
        
        {/* Controles de Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[180px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={periodoFilter}
              onChange={(e) => setPeriodoFilter(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todos los periodos</option>
              {periodosLista.map(periodo => (
                <option key={periodo.id_periodo} value={periodo.codigo}>
                  {periodo.codigo}
                </option>
              ))}
            </select>
          </div>

          <select
            value={operativoFilter}
            onChange={(e) => setOperativoFilter(e.target.value)}
            className="block w-full min-w-[160px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Acta: Todos</option>
            <option value="ABIERTA">Abierta</option>
            <option value="CERRADA">Cerrada</option>
          </select>

          <select
            value={confirmacionFilter}
            onChange={(e) => setConfirmacionFilter(e.target.value)}
            className="block w-full min-w-[180px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Confirmación: Todos</option>
            <option value="ENVIADA">Enviada</option>
            <option value="ACEPTADA">Aceptada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Docente titular</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Materia y grupo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Horarios agrupados</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                {(user?.rol_id === 1 || user?.rol_id === 2) && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
                )}
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={(user?.rol_id === 1 || user?.rol_id === 2) ? "5" : "4"} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando asignaciones...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedAsignaciones.length === 0 ? (
                <tr>
                  <td colSpan={(user?.rol_id === 1 || user?.rol_id === 2) ? "5" : "4"} className="px-6 py-16 text-center">
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
                paginatedAsignaciones.map((asignacion) => {
                  const compositeKey = `${asignacion.periodo_id}_${asignacion.docente_id}_${asignacion.materia_id}_${asignacion.grupo_id}`;
                  const isCancelada = asignacion.estatus_acta === 'CERRADA';

                  return (
                    <tr key={compositeKey} className={`transition-colors duration-150 group ${isCancelada ? 'bg-slate-50 opacity-75' : 'hover:bg-blue-50/50'}`}>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${isCancelada ? 'bg-slate-200 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                            <User className="h-4 w-4" />
                          </div>
                          <span className={`font-bold ${isCancelada ? 'text-slate-500' : 'text-slate-900'}`}>
                            {asignacion.docente_nombres} {asignacion.docente_apellido_paterno}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold flex items-center break-words max-w-[250px] ${isCancelada ? 'text-slate-500' : 'text-slate-800'}`}>
                          <BookOpen className={`w-4 h-4 mr-1.5 shrink-0 ${isCancelada ? 'text-slate-400' : 'text-blue-500'}`}/> 
                          <span className="truncate" title={asignacion.nombre_materia}>{asignacion.nombre_materia}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                          Grupo: {asignacion.nombre_grupo} <span className="mx-1">•</span> {asignacion.nombre_periodo}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {asignacion.horarios.map((horario, idx) => (
                            <div key={idx} className={`flex items-center text-sm font-medium inline-flex px-3 py-1 rounded-lg border w-max ${isCancelada ? 'bg-slate-100/50 text-slate-500 border-slate-200' : 'bg-slate-100/80 text-slate-700 border-slate-200'}`}>
                              <Calendar className={`w-3.5 h-3.5 mr-2 ${isCancelada ? 'text-slate-400' : 'text-amber-500'}`} />
                              {diasSemanaMapa[horario.dia_semana] || horario.dia_semana}: {horario.hora_inicio?.substring(0,5)} - {horario.hora_fin?.substring(0,5)}
                              <MapPin className={`w-3.5 h-3.5 ml-3 mr-1.5 ${isCancelada ? 'text-slate-400' : 'text-emerald-500'}`} />
                              <span className="text-xs">{horario.nombre_aula}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCancelada ? (
                          <span className="px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-600 border-slate-300">
                            CERRADA
                          </span>
                        ) : (
                          getStatusBadge(asignacion.estatus_confirmacion)
                        )}
                      </td>

                      {(user?.rol_id === 1 || user?.rol_id === 2) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!isCancelada && (
                              <button 
                                onClick={() => handleEdit(asignacion)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modificar asignación"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                            )}
                            
                            {isCancelada ? (
                              <button 
                                onClick={() => openConfirmModal(asignacion, false)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Reactivar asignación"
                              >
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => openConfirmModal(asignacion, true)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cancelar asignación"
                              >
                                <Ban className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredAsignaciones.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredAsignaciones.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredAsignaciones.length}</span> asignaciones
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

      {confirmModal.isOpen && confirmModal.asignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center">
                {confirmModal.isCanceling ? (
                  <><AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Confirmar cancelación</>
                ) : (
                  <><RotateCcw className="w-5 h-5 mr-2 text-emerald-500" /> Confirmar reactivación</>
                )}
              </h3>
              <button onClick={closeConfirmModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Estás a punto de {confirmModal.isCanceling ? <strong className="text-red-600">cancelar (borrado lógico)</strong> : <strong className="text-emerald-600">reactivar</strong>} la asignación de la materia <span className="font-bold text-slate-900">{confirmModal.asignacion.nombre_materia}</span> impartida por el docente <span className="font-bold text-slate-900">{confirmModal.asignacion.docente_nombres} {confirmModal.asignacion.docente_apellido_paterno}</span> para el grupo <span className="font-bold text-slate-900">{confirmModal.asignacion.nombre_grupo}</span>.
              </p>
              {confirmModal.isCanceling ? (
                <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                  Esta acción liberará los horarios para que otros grupos puedan utilizar el aula y el docente asignado. Podrás reactivarla más adelante si los espacios siguen disponibles.
                </p>
              ) : (
                <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                  El sistema verificará automáticamente si el aula y el docente aún están disponibles antes de aplicar la reactivación para evitar empalmes.
                </p>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={closeConfirmModal}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Mantener sin cambios
              </button>
              <button 
                onClick={executeToggleStatus}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm ${
                  confirmModal.isCanceling ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Sí, {confirmModal.isCanceling ? 'cancelar' : 'reactivar'} asignación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};