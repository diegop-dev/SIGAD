import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, CalendarDays, Loader2, Calendar, MapPin, ChevronLeft, ChevronRight, Edit2, Ban, RotateCcw, AlertTriangle, X, RefreshCcw, Users, FileText, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AssignmentForm } from './AssignmentForm';
import { useAuth } from '../../hooks/useAuth';
import ReporteAsignaciones from './ReporteAsignaciones';

export const AssignmentManagement = () => {
  const { user } = useAuth();
  const [modalReporte, setModalReporte] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [asignacionToEdit, setAsignacionToEdit] = useState(null);
  const [asignacionesRaw, setAsignacionesRaw] = useState([]);
  const [materiasLista, setMateriasLista] = useState([]);
  const [periodosLista, setPeriodosLista] = useState([]);
  const [gruposLista, setGruposLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingPromedios, setIsSyncingPromedios] = useState(false); // ← HU-38

  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [operativoFilter, setOperativoFilter] = useState('');
  const [confirmacionFilter, setConfirmacionFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, isCanceling: false, asignacion: null
  });

  const [syncModal, setSyncModal] = useState({
    isOpen: false, periodo_id: '', grupo_id: ''
  });

  // ─── HU-38: Modal de promedios consolidados ──────────────────────────────────
  const [promediosModal, setPromediosModal] = useState({
    isOpen: false,
    grupo_id: ''
  });
  // ─────────────────────────────────────────────────────────────────────────────

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

  const fetchCatalogosFiltrosYSync = async () => {
    try {
      const [resPeriodos, resGrupos, resMaterias] = await Promise.all([
        api.get('/periodos'),
        api.get('/grupos'),
        api.get('/materias')
      ]);
      setPeriodosLista(Array.isArray(resPeriodos.data.data || resPeriodos.data) ? (resPeriodos.data.data || resPeriodos.data) : []);
      setGruposLista(Array.isArray(resGrupos.data.data || resGrupos.data) ? (resGrupos.data.data || resGrupos.data) : []);
      setMateriasLista(Array.isArray(resMaterias.data.data || resMaterias.data) ? (resMaterias.data.data || resMaterias.data) : []);
    } catch (error) {
      console.error("Error al cargar catálogos:", error);
    }
  };

  useEffect(() => {
    fetchAsignaciones();
    fetchCatalogosFiltrosYSync();
  }, []);

  const handleSincronizarReportes = async () => {
    if (!syncModal.periodo_id || !syncModal.grupo_id) {
      toast.error("Por favor, selecciona un Periodo y un Grupo.");
      return;
    }
    setIsSyncing(true);
    const toastId = toast.loading('Conectando vía VPN con el sistema externo...');
    try {
      const response = await api.get(`/asignaciones/recepcion?grupo_id=${syncModal.grupo_id}&periodo_id=${syncModal.periodo_id}`);
      toast.success(response.data.message || 'Sincronización exitosa', { id: toastId, duration: 4000 });
      setSyncModal({ isOpen: false, periodo_id: '', grupo_id: '' });
      fetchAsignaciones();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al sincronizar reportes', { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  // ─── HU-38: Sincronizar promedios consolidados ───────────────────────────────
  const handleSincronizarPromedios = async () => {
    if (!promediosModal.grupo_id) {
      toast.error("Por favor, selecciona un grupo.");
      return;
    }

    setIsSyncingPromedios(true);
    const toastId = toast.loading('Consultando promedios en el sistema externo...');

    try {
      const response = await api.post(
        `/asignaciones/sincronizar-promedios?grupo_id=${promediosModal.grupo_id}`
      );

      const { actualizadas, sin_promedio, mensaje } = response.data;

      toast.success(
        mensaje || `Sincronización completada: ${actualizadas} asignacion(es) cerrada(s).`,
        { id: toastId, duration: 5000 }
      );

      // Si hubo materias sin promedio aún disponible, avisamos sin cortar el flujo
      if (sin_promedio && sin_promedio > 0) {
        toast(`${sin_promedio} materia(s) aún sin promedio disponible en SESA.`, {
          icon: '⚠️',
          duration: 5000
        });
      }

      setPromediosModal({ isOpen: false, grupo_id: '' });
      fetchAsignaciones();
    } catch (error) {
      console.error("Error al sincronizar promedios:", error);
      toast.error(
        error.response?.data?.error || 'Error al conectar con el sistema externo de promedios.',
        { id: toastId }
      );
    } finally {
      setIsSyncingPromedios(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

  const asignacionesAgrupadas = useMemo(() => {
    const agrupadasActivas = {};
    const agrupadasCerradas = {};
    asignacionesRaw.forEach(item => {
      const materiaEncontrada = materiasLista.find(m => m.id_materia === item.materia_id);
      const tipoAsignatura = materiaEncontrada ? materiaEncontrada.tipo_asignatura : 'DESCONOCIDO';
      const compositeKey = `${item.periodo_id}_${item.docente_id}_${item.materia_id}_${item.grupo_id || 'NULL'}`;
      const horarioData = {
        id_asignacion: item.id_asignacion, dia_semana: item.dia_semana,
        hora_inicio: item.hora_inicio, hora_fin: item.hora_fin,
        aula_id: item.aula_id, nombre_aula: item.nombre_aula
      };
      const baseItem = { ...item, tipo_asignatura: tipoAsignatura };
      if (item.estatus_acta !== 'CERRADA') {
        if (!agrupadasActivas[compositeKey]) agrupadasActivas[compositeKey] = { ...baseItem, horarios: [] };
        agrupadasActivas[compositeKey].horarios.push(horarioData);
      } else {
        if (!agrupadasCerradas[compositeKey]) agrupadasCerradas[compositeKey] = { ...baseItem, horarios: [] };
        agrupadasCerradas[compositeKey].horarios.push(horarioData);
      }
    });
    const result = Object.values(agrupadasActivas);
    Object.keys(agrupadasCerradas).forEach(key => {
      if (!agrupadasActivas[key]) result.push(agrupadasCerradas[key]);
    });
    return result;
  }, [asignacionesRaw, materiasLista]);

  const filteredAsignaciones = useMemo(() => {
    return asignacionesAgrupadas.filter(asignacion => {
      const busqueda = searchTerm.toLowerCase();
      const nombreDocente = `${asignacion.docente_nombres || ''} ${asignacion.docente_apellido_paterno || ''} ${asignacion.docente_apellido_materno || ''}`.toLowerCase();
      const coincideBusqueda =
        nombreDocente.includes(busqueda) ||
        (asignacion.nombre_materia?.toLowerCase() || '').includes(busqueda) ||
        (asignacion.codigo_unico?.toLowerCase() || '').includes(busqueda) ||
        (asignacion.nombre_grupo?.toLowerCase() || '').includes(busqueda);
      return (
        coincideBusqueda &&
        (periodoFilter ? asignacion.nombre_periodo === periodoFilter : true) &&
        (operativoFilter ? asignacion.estatus_acta === operativoFilter : true) &&
        (confirmacionFilter ? asignacion.estatus_confirmacion === confirmacionFilter : true) &&
        (nivelFilter ? (asignacion.nivel_academico || 'LICENCIATURA') === nivelFilter : true)
      );
    });
  }, [asignacionesAgrupadas, searchTerm, periodoFilter, operativoFilter, confirmacionFilter, nivelFilter]);

  const totalPages = Math.ceil(filteredAsignaciones.length / itemsPerPage) || 1;
  const paginatedAsignaciones = filteredAsignaciones.slice(
    (currentPage - 1) * itemsPerPage, currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, periodoFilter, operativoFilter, confirmacionFilter, nivelFilter]);

  const handleSuccessAction = () => { setShowForm(false); setAsignacionToEdit(null); fetchAsignaciones(); };
  const handleEdit = (asignacion) => { setAsignacionToEdit(asignacion); setShowForm(true); };
  const openConfirmModal = (asignacion, isCanceling) => setConfirmModal({ isOpen: true, isCanceling, asignacion });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, isCanceling: false, asignacion: null });

  const executeToggleStatus = async () => {
    const { isCanceling, asignacion } = confirmModal;
    const endpoint = isCanceling ? "/asignaciones" : "/asignaciones/reactivar";
    const httpMethod = isCanceling ? api.delete : api.patch;
    closeConfirmModal();
    const toastId = toast.loading('Procesando petición en el servidor...');
    try {
      const payload = { data: { periodo_id: asignacion.periodo_id, materia_id: asignacion.materia_id, docente_id: asignacion.docente_id, grupo_id: asignacion.grupo_id } };
      isCanceling ? await httpMethod(endpoint, payload) : await httpMethod(endpoint, payload.data);
      toast.success(`Asignación ${isCanceling ? 'cancelada' : 'reactivada'} exitosamente`, { id: toastId });
      fetchAsignaciones();
    } catch (error) {
      toast.error(error.response?.data?.error || `Error al procesar la asignación`, { id: toastId });
    }
  };

  const getStatusBadge = (estatus) => {
    const statusMap = {
      'ENVIADA': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACEPTADA': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'RECHAZADA': 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${statusMap[estatus] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {estatus || 'DESCONOCIDO'}
      </span>
    );
  };

  const getTipoAsignaturaStyles = (tipo) => {
    if (tipo === 'TRONCO_COMUN') return 'bg-white text-slate-700 border-slate-300';
    if (tipo === 'OBLIGATORIA') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tipo === 'OPTATIVA') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const diasSemanaMapa = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado" };

  if (showForm) {
    return <AssignmentForm onBack={() => { setShowForm(false); setAsignacionToEdit(null); }} onSuccess={handleSuccessAction} initialData={asignacionToEdit} />;
  }

  return (
    <div className="space-y-6 relative">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de asignaciones
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra la distribución de horarios, docentes y aulas.</p>
        </div>
        {(user?.rol_id === 1 || user?.rol_id === 2) && (
          <div className="flex flex-wrap gap-3">

            {/* Botón Incumplimientos (HU-39) */}
            <button
              onClick={() => setSyncModal({ ...syncModal, isOpen: true })}
              className="flex items-center px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm font-bold"
            >
              <RefreshCcw className="w-4 h-4 mr-2 text-slate-500" />
              Sincronizar Incumplimientos
            </button>

            {/* ─── Botón Promedios (HU-38) ─────────────────────────────────── */}
            <button
              onClick={() => setPromediosModal({ isOpen: true, grupo_id: '' })}
              className="flex items-center px-4 py-2.5 bg-white border border-violet-200 text-violet-700 rounded-xl hover:bg-violet-50 transition-all duration-200 shadow-sm font-bold"
            >
              <BarChart2 className="w-4 h-4 mr-2 text-violet-500" />
              Obtener Promedios
            </button>
            {/* ──────────────────────────────────────────────────────────────── */}

            <button
              onClick={() => { setAsignacionToEdit(null); setShowForm(true); }}
              className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
            >
              <Plus className="w-5 h-5 mr-2" /> Nueva asignación
            </button>

          </div>
        )}
      </div>

      <button
        onClick={() => setModalReporte(true)}
        className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all shadow-md active:scale-95"
      >
        <FileText className="w-5 h-5" /> Generar Reporte
      </button>

      {/* ── Filtros ── */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4">
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
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <select value={nivelFilter} onChange={(e) => setNivelFilter(e.target.value)} className="block w-full sm:w-auto min-w-[140px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer">
            <option value="">Nivel: Todos</option>
            <option value="LICENCIATURA">Licenciatura</option>
            <option value="MAESTRIA">Maestría</option>
          </select>
          <div className="relative flex items-center w-full sm:w-auto min-w-[160px]">
            <select value={periodoFilter} onChange={(e) => setPeriodoFilter(e.target.value)} className="pl-4 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer">
              <option value="">Todos los periodos</option>
              {periodosLista.map(p => <option key={p.id_periodo} value={p.codigo}>{p.codigo}</option>)}
            </select>
          </div>
          <select value={operativoFilter} onChange={(e) => setOperativoFilter(e.target.value)} className="block w-full sm:w-auto min-w-[160px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer">
            <option value="">Acta: Todos</option>
            <option value="ABIERTA">Abierta</option>
            <option value="CERRADA">Cerrada</option>
          </select>
          <select value={confirmacionFilter} onChange={(e) => setConfirmacionFilter(e.target.value)} className="block w-full sm:w-auto min-w-[180px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer">
            <option value="">Confirmación: Todos</option>
            <option value="ENVIADA">Enviada</option>
            <option value="ACEPTADA">Aceptada</option>
            <option value="RECHAZADA">Rechazada</option>
          </select>
        </div>
      </div>

      {/* ── Tabla ── */}
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
                <tr><td colSpan={(user?.rol_id === 1 || user?.rol_id === 2) ? "5" : "4"} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                    <p className="text-sm text-slate-500 font-medium">Cargando asignaciones...</p>
                  </div>
                </td></tr>
              ) : paginatedAsignaciones.length === 0 ? (
                <tr><td colSpan={(user?.rol_id === 1 || user?.rol_id === 2) ? "5" : "4"} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-4"><CalendarDays className="h-8 w-8 text-slate-400" /></div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                    <p className="text-sm text-slate-500">No se encontraron asignaciones con los filtros actuales.</p>
                  </div>
                </td></tr>
              ) : (
                paginatedAsignaciones.map((asignacion) => {
                  const compositeKey = `${asignacion.periodo_id}_${asignacion.docente_id}_${asignacion.materia_id}_${asignacion.grupo_id || 'NULL'}`;
                  const isCancelada = asignacion.estatus_acta === 'CERRADA';
                  const tieneReporteExterno = asignacion.tiene_reporte_externo === 1;
                  const esGrupoGlobal = !asignacion.grupo_id || asignacion.nombre_grupo === 'TRONCO COMÚN / GLOBAL';

                  return (
                    <tr key={compositeKey} className={`transition-colors duration-150 group ${isCancelada ? 'bg-slate-50 opacity-75' : 'hover:bg-blue-50/50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${isCancelada ? 'text-slate-500' : 'text-slate-900'}`}>
                          {`${asignacion.docente_nombres} ${asignacion.docente_apellido_paterno} ${asignacion.docente_apellido_materno || ''}`.trim()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-bold flex items-start break-words max-w-[250px] ${isCancelada ? 'text-slate-500' : 'text-slate-800'}`}>
                          <div>
                            {asignacion.nombre_materia}
                            <div className={`flex items-center text-xs font-medium mt-1 ${isCancelada ? 'text-slate-400' : 'text-slate-500'}`}>
                              {asignacion.codigo_unico || 'SIN CÓDIGO'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-2 flex flex-wrap items-center gap-2">
                          <span>{esGrupoGlobal ? asignacion.nombre_periodo : `Grupo: ${asignacion.nombre_grupo} • ${asignacion.nombre_periodo}`}</span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${asignacion.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {asignacion.nivel_academico || 'LICENCIATURA'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getTipoAsignaturaStyles(asignacion.tipo_asignatura)}`}>
                            {(asignacion.tipo_asignatura || 'DESCONOCIDO').replace(/_/g, ' ')}
                          </span>
                          {/* ── Promedio consolidado (HU-38) ── */}
                          {asignacion.promedio_consolidado !== null && asignacion.promedio_consolidado !== undefined && (
                            <span className="px-2 py-0.5 rounded-md font-bold text-[10px] border bg-violet-100 text-violet-700 border-violet-200 flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" />
                              Prom: {Number(asignacion.promedio_consolidado).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {asignacion.horarios.map((horario, idx) => (
                            <div key={idx} className={`flex items-center text-sm font-medium inline-flex px-3 py-1 rounded-lg border w-max ${isCancelada ? 'bg-slate-100/50 text-slate-500 border-slate-200' : 'bg-slate-100/80 text-slate-700 border-slate-200'}`}>
                              <Calendar className={`w-3.5 h-3.5 mr-2 ${isCancelada ? 'text-slate-400' : 'text-amber-500'}`} />
                              {diasSemanaMapa[horario.dia_semana] || horario.dia_semana}: {horario.hora_inicio?.substring(0, 5)} - {horario.hora_fin?.substring(0, 5)}
                              <MapPin className={`w-3.5 h-3.5 ml-3 mr-1.5 ${isCancelada ? 'text-slate-400' : 'text-emerald-500'}`} />
                              <span className="text-xs">{horario.nombre_aula}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-2">
                          {isCancelada ? (
                            <span className="px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-600 border-slate-300">CERRADA</span>
                          ) : (
                            getStatusBadge(asignacion.estatus_confirmacion)
                          )}
                          {tieneReporteExterno && (
                            <span className="px-2 py-0.5 inline-flex items-center text-[10px] font-bold uppercase tracking-wider rounded border bg-red-50 text-red-700 border-red-200 shadow-sm animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-1" /> Reporte Externo
                            </span>
                          )}
                        </div>
                      </td>
                      {(user?.rol_id === 1 || user?.rol_id === 2) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!isCancelada && (
                              <button onClick={() => handleEdit(asignacion)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modificar asignación">
                                <Edit2 className="w-5 h-5" />
                              </button>
                            )}
                            {isCancelada ? (
                              <button onClick={() => openConfirmModal(asignacion, false)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Reactivar asignación">
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            ) : (
                              <button onClick={() => openConfirmModal(asignacion, true)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancelar asignación">
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
            <p className="text-sm font-medium text-slate-500">
              Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
              <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredAsignaciones.length)}</span> de{' '}
              <span className="font-bold text-slate-900">{filteredAsignaciones.length}</span> asignaciones
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Sincronizar Incumplimientos (HU-39) ── */}
      {syncModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center">
                <RefreshCcw className="w-5 h-5 mr-2 text-blue-600" /> Sincronización externa
              </h3>
              <button onClick={() => setSyncModal({ isOpen: false, periodo_id: '', grupo_id: '' })} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">Selecciona el grupo y el periodo para consultar los estatus de incumplimiento en el sistema externo.</p>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700"><Calendar className="w-4 h-4 mr-2 text-blue-500" /> Periodo académico</label>
                <select value={syncModal.periodo_id} onChange={(e) => setSyncModal({ ...syncModal, periodo_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 bg-white">
                  <option value="">-- Seleccione un periodo --</option>
                  {periodosLista.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700"><Users className="w-4 h-4 mr-2 text-blue-500" /> Grupo asignado</label>
                <select value={syncModal.grupo_id} onChange={(e) => setSyncModal({ ...syncModal, grupo_id: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 bg-white">
                  <option value="">-- Seleccione un grupo --</option>
                  {gruposLista.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.identificador}</option>)}
                </select>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setSyncModal({ isOpen: false, periodo_id: '', grupo_id: '' })} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSincronizarReportes} disabled={isSyncing || !syncModal.periodo_id || !syncModal.grupo_id} className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center">
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isSyncing ? 'Conectando...' : 'Iniciar sincronización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Obtener Promedios (HU-38) ─────────────────────────────────── */}
      {promediosModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center">
                <BarChart2 className="w-5 h-5 mr-2 text-violet-600" /> Obtener promedios consolidados
              </h3>
              <button onClick={() => setPromediosModal({ isOpen: false, grupo_id: '' })} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                Selecciona el grupo para consultar los promedios finales en el sistema externo. Las asignaciones con promedio disponible serán marcadas como <strong>CERRADA</strong> automáticamente.
              </p>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <Users className="w-4 h-4 mr-2 text-violet-500" /> Grupo
                </label>
                <select
                  value={promediosModal.grupo_id}
                  onChange={(e) => setPromediosModal({ ...promediosModal, grupo_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-violet-100 bg-white"
                >
                  <option value="">-- Seleccione un grupo --</option>
                  {gruposLista.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.identificador}</option>)}
                </select>
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3">
                <p className="text-xs text-violet-700 font-medium leading-relaxed">
                  El sistema consultará automáticamente las materias y grupos en SESA para hacer el match de IDs antes de obtener los promedios.
                </p>
              </div>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setPromediosModal({ isOpen: false, grupo_id: '' })} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleSincronizarPromedios}
                disabled={isSyncingPromedios || !promediosModal.grupo_id}
                className="px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm flex items-center"
              >
                {isSyncingPromedios ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart2 className="w-4 h-4 mr-2" />}
                {isSyncingPromedios ? 'Consultando SESA...' : 'Obtener promedios'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────────────────────── */}

      {/* Modal confirmación cancelar/reactivar */}
      {confirmModal.isOpen && confirmModal.asignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center">
                {confirmModal.isCanceling
                  ? <><AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Confirmar cancelación</>
                  : <><RotateCcw className="w-5 h-5 mr-2 text-emerald-500" /> Confirmar reactivación</>}
              </h3>
              <button onClick={closeConfirmModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Estás a punto de {confirmModal.isCanceling ? <strong className="text-red-600">cancelar (borrado lógico)</strong> : <strong className="text-emerald-600">reactivar</strong>} la asignación de <span className="font-bold text-slate-900">{confirmModal.asignacion.nombre_materia}</span> impartida por <span className="font-bold text-slate-900">{confirmModal.asignacion.docente_nombres} {confirmModal.asignacion.docente_apellido_paterno}</span>.
              </p>
              {confirmModal.isCanceling
                ? <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">Esta acción liberará los horarios del aula y el docente asignado.</p>
                : <p className="text-xs text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">El sistema verificará disponibilidad antes de reactivar.</p>}
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeConfirmModal} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">Mantener sin cambios</button>
              <button onClick={executeToggleStatus} className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm ${confirmModal.isCanceling ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                Sí, {confirmModal.isCanceling ? 'cancelar' : 'reactivar'} asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {modalReporte && <ReporteAsignaciones alCerrar={() => setModalReporte(false)} />}
    </div>
  );
};