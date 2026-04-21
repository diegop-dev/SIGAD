import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, CalendarDays, Loader2, Calendar, MapPin,
  ChevronLeft, ChevronRight, Edit, Trash2, AlertTriangle,
  X, RefreshCcw, Users, FileText, BarChart2, CheckCircle2,
  ClipboardList, Filter, UserCheck, ChevronDown, WifiOff
} from 'lucide-react';
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
  const [isSyncingPromedios, setIsSyncingPromedios] = useState(false);

  // Estados de Búsqueda y Debounce
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [operativoFilter, setOperativoFilter] = useState('');
  const [confirmacionFilter, setConfirmacionFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false, isCanceling: false, asignacion: null, isLoading: false, error: null
  });

  const [syncModal, setSyncModal] = useState({
    isOpen: false, periodo_id: '', grupo_id: ''
  });

  const [promediosModal, setPromediosModal] = useState({
    isOpen: false, grupo_id: ''
  });

  const [resultadosModal, setResultadosModal] = useState({
    isOpen: false,
    tipo: null,
    estado: null,        // 'exitosa' | 'no_vinculada' | 'error'
    asignaciones: [],
    resumen: {},
    mensajeError: ''
  });

  const fetchAsignaciones = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/asignaciones');
      const data = response.data.data || response.data;
      const arr = Array.isArray(data) ? data : [];
      setAsignacionesRaw(arr);
      return arr;
    } catch (error) {
      console.error("Error al cargar asignaciones:", error);
      toast.error('Ocurrió un error al cargar el listado de asignaciones en el sistema.');
      setAsignacionesRaw([]);
      return [];
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

  // Validación y debounce de búsqueda
  const handleSearchInput = (e) => {
    let val = e.target.value;
    val = val.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d10-9@._\-\s]/g, '');
    val = val.replace(/^\s+/g, '').replace(/\s{2,}/g, ' ');
    const parts = val.split('@');
    if (parts.length > 2) {
      val = parts[0] + '@' + parts.slice(1).join('').replace(/@/g, '');
    }
    setSearchInput(val);
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      const cleanTerm = searchInput.trim();
      if (cleanTerm.length >= 3 || cleanTerm.length === 0) {
        setSearchTerm(cleanTerm);
      }
    }, 400);
    return () => clearTimeout(timerId);
  }, [searchInput]);

  // Detecta el periodo vigente cuyas fechas cubren la fecha actual
  const periodoActivo = useMemo(() => {
    if (!periodosLista.length) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return periodosLista.find(p => {
      if (!p.fecha_inicio || !p.fecha_fin) return false;
      const inicio = new Date(p.fecha_inicio);
      const fin = new Date(p.fecha_fin);
      return inicio <= today && fin >= today;
    }) || null;
  }, [periodosLista]);

  // Pre-selecciona el periodo activo en el filtro principal al cargar
  useEffect(() => {
    if (periodoActivo && !periodoFilter) {
      setPeriodoFilter(periodoActivo.codigo);
    }
  }, [periodoActivo]);

  const deduplicarPorMateriaDocente = (items) => {
    const seen = new Set();
    return items.filter(item => {
      const key = `${item.materia_id}_${item.docente_id}_${item.grupo_id ?? 'NULL'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const handleSincronizarReportes = async () => {
    if (!syncModal.periodo_id || !syncModal.grupo_id) {
      toast.error("Por favor, selecciona un Periodo y un Grupo de la lista.");
      return;
    }

    const { grupo_id, periodo_id } = syncModal;

    // Capturar el conjunto de asignaciones ya reportadas ANTES del sync
    const prevReportadosKeys = new Set(
      asignacionesRaw
        .filter(item =>
          (item.tiene_reporte_externo === 1 || item.tiene_reporte_externo === true) &&
          String(item.grupo_id) === String(grupo_id) &&
          String(item.periodo_id) === String(periodo_id)
        )
        .map(item => `${item.materia_id}_${item.docente_id}`)
    );

    setIsSyncing(true);
    const toastId = toast.loading('Estableciendo conexión con SESA...');

    try {
      const response = await api.get(
        `/asignaciones/recepcion?grupo_id=${grupo_id}&periodo_id=${periodo_id}`
      );
      toast.dismiss(toastId);
      setSyncModal({ isOpen: false, periodo_id: '', grupo_id: '' });

      const rawActualizado = await fetchAsignaciones();

      // Mostrar solo los recién marcados en esta sincronización
      const conReporte = deduplicarPorMateriaDocente(
        rawActualizado.filter(item =>
          (item.tiene_reporte_externo === 1 || item.tiene_reporte_externo === true) &&
          String(item.grupo_id) === String(grupo_id) &&
          String(item.periodo_id) === String(periodo_id) &&
          !prevReportadosKeys.has(`${item.materia_id}_${item.docente_id}`)
        )
      );

      setResultadosModal({
        isOpen: true,
        tipo: 'incumplimientos',
        estado: 'exitosa',
        asignaciones: conReporte,
        resumen: {
          reportes_recibidos: response.data.reportes_recibidos ?? conReporte.length,
          asignaciones_afectadas: response.data.asignaciones_afectadas ?? conReporte.length,
          paginas_consumidas: response.data.paginas_consumidas ?? 1,
        },
        mensajeError: ''
      });

    } catch (error) {
      toast.dismiss(toastId);
      const status = error.response?.status;
      setSyncModal({ isOpen: false, periodo_id: '', grupo_id: '' });
      setResultadosModal({
        isOpen: true,
        tipo: 'incumplimientos',
        estado: status === 404 ? 'no_vinculada' : 'error',
        asignaciones: [],
        resumen: {},
        mensajeError: error.response?.data?.error || 'No se pudo establecer comunicación con el sistema externo SESA. Verifica la conexión e inténtalo nuevamente.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSincronizarPromedios = async () => {
    if (!promediosModal.grupo_id) {
      toast.error("Por favor, selecciona un grupo de la lista.");
      return;
    }

    const { grupo_id } = promediosModal;

    // Capturar el conjunto de asignaciones ya cerradas con promedio ANTES del sync
    const prevConPromedioKeys = new Set(
      asignacionesRaw
        .filter(item =>
          item.promedio_consolidado !== null &&
          item.promedio_consolidado !== undefined &&
          String(item.grupo_id) === String(grupo_id) &&
          item.estatus_acta === 'CERRADA'
        )
        .map(item => `${item.materia_id}_${item.docente_id}`)
    );

    setIsSyncingPromedios(true);
    const toastId = toast.loading('Estableciendo conexión con SESA...');

    try {
      const response = await api.post(
        `/asignaciones/sincronizar-promedios?grupo_id=${grupo_id}`
      );
      const { actualizadas, sin_promedio } = response.data;

      toast.dismiss(toastId);
      setPromediosModal({ isOpen: false, grupo_id: '' });

      const rawActualizado = await fetchAsignaciones();

      // Mostrar solo los recién cerrados en esta sincronización
      const conPromedio = deduplicarPorMateriaDocente(
        rawActualizado.filter(item =>
          item.promedio_consolidado !== null &&
          item.promedio_consolidado !== undefined &&
          String(item.grupo_id) === String(grupo_id) &&
          item.estatus_acta === 'CERRADA' &&
          !prevConPromedioKeys.has(`${item.materia_id}_${item.docente_id}`)
        )
      );

      setResultadosModal({
        isOpen: true,
        tipo: 'promedios',
        estado: 'exitosa',
        asignaciones: conPromedio,
        resumen: {
          actualizadas: actualizadas ?? conPromedio.length,
          sin_promedio: sin_promedio ?? 0,
        },
        mensajeError: ''
      });

    } catch (error) {
      toast.dismiss(toastId);
      const status = error.response?.status;
      const errMsg = error.response?.data?.error || 'No fue posible conectar con el sistema externo SESA.';
      setPromediosModal({ isOpen: false, grupo_id: '' });
      setResultadosModal({
        isOpen: true,
        tipo: 'promedios',
        estado: status === 404 ? 'no_vinculada' : 'error',
        asignaciones: [],
        resumen: {},
        mensajeError: errMsg
      });
    } finally {
      setIsSyncingPromedios(false);
    }
  };

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
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, isCanceling: false, asignacion: null, isLoading: false, error: null });

  const executeToggleStatus = async () => {
    const { isCanceling, asignacion } = confirmModal;
    const endpoint = isCanceling ? "/asignaciones" : "/asignaciones/reactivar";
    const httpMethod = isCanceling ? api.delete : api.patch;

    setConfirmModal(prev => ({ ...prev, isLoading: true, error: null }));
    const toastId = toast.loading('Procesando solicitud de actualización...');

    try {
      const payload = { data: { periodo_id: asignacion.periodo_id, materia_id: asignacion.materia_id, docente_id: asignacion.docente_id, grupo_id: asignacion.grupo_id } };
      
      if (isCanceling) {
        await httpMethod(endpoint, payload);
      } else {
        await httpMethod(endpoint, payload.data);
      }

      toast.success(`Asignación ${isCanceling ? 'cancelada' : 'reactivada'} exitosamente.`, { id: toastId });
      closeConfirmModal();
      fetchAsignaciones();
    } catch (error) {
      const errMsg = error.response?.data?.error || `Ocurrió un error al procesar el estatus de la asignación.`;
      toast.dismiss(toastId);
      setConfirmModal(prev => ({ ...prev, isLoading: false, error: errMsg }));
    }
  };

  const getStatusBadge = (estatus) => {
    const statusMap = {
      'ENVIADA': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACEPTADA': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'RECHAZADA': 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border shadow-sm ${statusMap[estatus] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
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

  const filterInputClass = "block w-full px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none [&:autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:autofill]:[-webkit-text-fill-color:#0B1828] appearance-none cursor-pointer";

  return (
    <div className="space-y-6 relative">

      {/* Header Navy Estandarizado */}
      <div className="flex flex-col gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        {/* Fila Superior Título y Botón Principal */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
              <CalendarDays className="w-7 h-7 mr-3 text-white/90" />
              Asignaciones
            </h1>
            <p className="mt-1.5 text-sm text-white/70 font-medium">
              Administra la distribución de horarios, carga docente y asignación de aulas.
            </p>
          </div>
          
          {(user?.rol_id === 1 || user?.rol_id === 2) && (
            <button
              onClick={() => { setAsignacionToEdit(null); setShowForm(true); }}
              className="flex items-center justify-center px-6 py-3 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black text-sm shrink-0 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" /> Nueva asignación
            </button>
          )}
        </div>
        
        {/* Fila Inferior Botones Secundarios Alineados a la Izquierda */}
        <div className="flex flex-wrap justify-start gap-3 w-full border-t border-white/10 pt-4 mt-2">
          <button
            onClick={() => setModalReporte(true)}
            className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 shadow-sm active:scale-95 font-bold text-sm"
          >
            <FileText className="w-4 h-4 mr-2" /> Informe de asignaciones
          </button>
          
          {(user?.rol_id === 1 || user?.rol_id === 2) && (
            <>
              <button
                onClick={() => setSyncModal({ isOpen: true, periodo_id: periodoActivo ? String(periodoActivo.id_periodo) : '', grupo_id: '' })}
                className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 shadow-sm active:scale-95 font-bold text-sm"
              >
                <RefreshCcw className="w-4 h-4 mr-2" /> Incumplimientos docente
              </button>
              <button
                onClick={() => setPromediosModal({ isOpen: true, grupo_id: '' })}
                className="flex-1 sm:flex-none flex items-center justify-center px-5 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200 shadow-sm active:scale-95 font-bold text-sm"
              >
                <BarChart2 className="w-4 h-4 mr-2" /> Promedios consolidados
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filtros Estandarizados */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
        {/* Fila de búsqueda principal */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            maxLength="100"
            placeholder="Buscar por nombre del docente, materia o identificador de grupo (Mínimo 3 caracteres)..."
            value={searchInput}
            onChange={handleSearchInput}
            className={`pl-11 cursor-text ${filterInputClass}`}
          />
        </div>
        
        {/* Fila de Selectores en Grid (Mejor Distribución Visual) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative flex items-center w-full">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10 pointer-events-none" />
            <select value={nivelFilter} onChange={(e) => setNivelFilter(e.target.value)} className={`pl-11 ${filterInputClass}`}>
              <option value="">Todos los niveles</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="MAESTRIA">Maestría</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          
          <div className="relative flex items-center w-full">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10 pointer-events-none" />
            <select value={periodoFilter} onChange={(e) => setPeriodoFilter(e.target.value)} className={`pl-11 ${filterInputClass}`}>
              <option value="">Todos los periodos</option>
              {periodosLista.map(p => <option key={p.id_periodo} value={p.codigo}>{p.codigo}</option>)}
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          
          <div className="relative flex items-center w-full">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10 pointer-events-none" />
            <select value={operativoFilter} onChange={(e) => setOperativoFilter(e.target.value)} className={`pl-11 ${filterInputClass}`}>
              <option value="">Todas las actas</option>
              <option value="ABIERTA">Abierta</option>
              <option value="CERRADA">Cerrada</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          
          <div className="relative flex items-center w-full">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10 pointer-events-none" />
            <select value={confirmacionFilter} onChange={(e) => setConfirmacionFilter(e.target.value)} className={`pl-11 ${filterInputClass}`}>
              <option value="">Todos los estatus</option>
              <option value="ENVIADA">Enviada</option>
              <option value="ACEPTADA">Aceptada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Estandarizada Navy */}
      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Docente Titular</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Materia, Grupo y Periodo</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Horarios Agrupados</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Estatus</th>
                {(user?.rol_id === 1 || user?.rol_id === 2) && (
                  <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={(user?.rol_id === 1 || user?.rol_id === 2) ? "5" : "4"} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                    <p className="text-sm text-slate-500 font-medium">Consultando la base de datos de asignaciones...</p>
                  </div>
                </td></tr>
              ) : paginatedAsignaciones.length === 0 ? (
                <tr><td colSpan={(user?.rol_id === 1 || user?.rol_id === 2) ? "5" : "4"} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100"><CalendarDays className="h-8 w-8 text-slate-400" /></div>
                    <h3 className="text-lg font-black text-[#0B1828] mb-1">No se encontraron resultados</h3>
                    <p className="text-sm text-slate-500 font-medium">No hay asignaciones registradas que coincidan con los filtros actuales.</p>
                  </div>
                </td></tr>
              ) : (
                paginatedAsignaciones.map((asignacion) => {
                  const compositeKey = `${asignacion.periodo_id}_${asignacion.docente_id}_${asignacion.materia_id}_${asignacion.grupo_id || 'NULL'}`;
                  const isCancelada = asignacion.estatus_acta === 'CERRADA';
                  const tieneReporteExterno = asignacion.tiene_reporte_externo === 1;
                  const esGrupoGlobal = !asignacion.grupo_id || asignacion.nombre_grupo === 'TRONCO COMÚN / GLOBAL';

                  return (
                    <tr key={compositeKey} className={`transition-colors duration-150 group ${isCancelada ? 'bg-slate-50 opacity-80' : 'hover:bg-slate-50/80'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-black ${isCancelada ? 'text-slate-500' : 'text-[#0B1828]'}`}>
                          {`${asignacion.docente_nombres} ${asignacion.docente_apellido_paterno} ${asignacion.docente_apellido_materno || ''}`.trim()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm font-black flex items-start break-words max-w-[250px] ${isCancelada ? 'text-slate-500' : 'text-[#0B1828]'}`}>
                          <div>
                            {asignacion.nombre_materia}
                            <div className={`flex items-center text-xs font-bold mt-1 ${isCancelada ? 'text-slate-400' : 'text-slate-500'}`}>
                              {asignacion.codigo_unico || 'SIN CÓDIGO'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-bold mt-2 flex flex-wrap items-center gap-2">
                          <span>{esGrupoGlobal ? asignacion.nombre_periodo : `Grupo: ${asignacion.nombre_grupo} • ${asignacion.nombre_periodo}`}</span>
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] border shadow-sm ${asignacion.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                            {asignacion.nivel_academico || 'LICENCIATURA'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-black text-[10px] border shadow-sm ${getTipoAsignaturaStyles(asignacion.tipo_asignatura)}`}>
                            {(asignacion.tipo_asignatura || 'DESCONOCIDO').replace(/_/g, ' ')}
                          </span>
                          {asignacion.promedio_consolidado !== null && asignacion.promedio_consolidado !== undefined && (
                            <span className="px-2 py-0.5 rounded-md font-black text-[10px] border bg-violet-100 text-violet-700 border-violet-200 shadow-sm flex items-center gap-1">
                              <BarChart2 className="w-3 h-3" />
                              Prom: {Number(asignacion.promedio_consolidado).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          {asignacion.horarios.map((horario, idx) => (
                            <div key={idx} className={`flex items-center text-sm font-bold inline-flex px-3.5 py-1.5 rounded-lg border w-max shadow-sm ${isCancelada ? 'bg-white text-slate-500 border-slate-200' : 'bg-slate-50 text-[#0B1828] border-slate-200'}`}>
                              <Calendar className={`w-3.5 h-3.5 mr-2 ${isCancelada ? 'text-slate-400' : 'text-[#0B1828]'}`} />
                              {diasSemanaMapa[horario.dia_semana] || horario.dia_semana}: {horario.hora_inicio?.substring(0, 5)} - {horario.hora_fin?.substring(0, 5)}
                              <MapPin className={`w-3.5 h-3.5 ml-3 mr-1.5 ${isCancelada ? 'text-slate-400' : 'text-blue-600'}`} />
                              <span className="text-xs font-medium">{horario.nombre_aula}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-2">
                          {isCancelada ? (
                            <span className="px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border bg-slate-100 text-slate-600 border-slate-300 shadow-sm">CERRADA</span>
                          ) : (
                            getStatusBadge(asignacion.estatus_confirmacion)
                          )}
                          {tieneReporteExterno && (
                            <span className="px-2 py-1 inline-flex items-center text-[10px] font-black uppercase tracking-wider rounded-lg border bg-red-50 text-red-700 border-red-200 shadow-sm animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-1.5" /> Reporte Externo
                            </span>
                          )}
                        </div>
                      </td>
                      {(user?.rol_id === 1 || user?.rol_id === 2) && (
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex items-center justify-center gap-2">
                            {!isCancelada && (
                              <button onClick={() => handleEdit(asignacion)} className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-95" title="Modificar asignación">
                                <Edit className="w-5 h-5" />
                              </button>
                            )}
                            {isCancelada ? (
                              <button onClick={() => openConfirmModal(asignacion, false)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95" title="Reactivar asignación">
                                <UserCheck className="w-5 h-5" />
                              </button>
                            ) : (
                              <button onClick={() => openConfirmModal(asignacion, true)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95" title="Cancelar asignación">
                                <Trash2 className="w-5 h-5" />
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
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-slate-500">
              Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
              <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredAsignaciones.length)}</span> de{' '}
              <span className="font-bold text-[#0B1828]">{filteredAsignaciones.length}</span> asignaciones
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-xl bg-white border border-slate-200 text-sm font-black text-[#0B1828] shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales Estandarizados (rounded-[2.5rem]) */}

      {/* Modal Sincronizar Incumplimientos (HU-39) */}
      {syncModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <h3 className="text-lg font-black text-white flex items-center">
                <RefreshCcw className="w-5 h-5 mr-3 text-white/90" /> Incumplimientos docente
              </h3>
              <button onClick={() => setSyncModal({ isOpen: false, periodo_id: '', grupo_id: '' })} className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-sm font-medium leading-relaxed">Selecciona el periodo académico y el grupo para consultar los incumplimientos docente en el sistema externo SESA.</p>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]"><Calendar className="w-4 h-4 mr-2" /> Periodo académico</label>
                <div className="relative">
                  <select value={syncModal.periodo_id} onChange={(e) => setSyncModal({ ...syncModal, periodo_id: e.target.value })} className={filterInputClass}>
                    <option value="" disabled>Seleccione un periodo</option>
                    {periodosLista.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]"><Users className="w-4 h-4 mr-2" /> Grupo</label>
                <div className="relative">
                  <select value={syncModal.grupo_id} onChange={(e) => setSyncModal({ ...syncModal, grupo_id: e.target.value })} className={filterInputClass}>
                    <option value="" disabled>Seleccione un grupo</option>
                    {gruposLista.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.identificador}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
              <button onClick={handleSincronizarReportes} disabled={isSyncing || !syncModal.periodo_id || !syncModal.grupo_id} className="px-6 py-3 w-full sm:w-auto text-sm font-black text-white bg-[#0B1828] hover:bg-[#162840] disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center">
                {isSyncing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isSyncing ? 'Conectando...' : 'Iniciar Sincronización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Obtener Promedios (HU-38) */}
      {promediosModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <h3 className="text-lg font-black text-white flex items-center">
                <BarChart2 className="w-5 h-5 mr-3 text-white/90" /> Promedios consolidados
              </h3>
              <button onClick={() => setPromediosModal({ isOpen: false, grupo_id: '' })} className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <p className="text-slate-600 text-sm font-medium leading-relaxed">
                Selecciona el grupo para consultar los promedios consolidados en el sistema externo SESA. Las asignaciones con promedio disponible serán marcadas como <strong className="font-black text-[#0B1828]">CERRADA</strong> automáticamente.
              </p>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]">
                  <Users className="w-4 h-4 mr-2" /> Grupo
                </label>
                <div className="relative">
                  <select
                    value={promediosModal.grupo_id}
                    onChange={(e) => setPromediosModal({ ...promediosModal, grupo_id: e.target.value })}
                    className={filterInputClass}
                  >
                    <option value="" disabled>Seleccione un grupo</option>
                    {gruposLista.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.identificador}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 shadow-sm rounded-xl p-4">
                <p className="text-xs text-slate-600 font-bold leading-relaxed">
                  El sistema consultará automáticamente las materias y grupos en SESA para hacer el match de IDs antes de obtener los promedios.
                </p>
              </div>
            </div>
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={handleSincronizarPromedios}
                disabled={isSyncingPromedios || !promediosModal.grupo_id}
                className="px-6 py-3 w-full sm:w-auto text-sm font-black text-white bg-[#0B1828] hover:bg-[#162840] disabled:opacity-50 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center"
              >
                {isSyncingPromedios ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {isSyncingPromedios ? 'Conectando...' : 'Iniciar Sincronización'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resultados SESA */}
      {resultadosModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">

            {/* Header siempre navy — subtítulo cambia según el estado */}
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <div className="flex items-center gap-3">
                {resultadosModal.estado === 'error' ? (
                  <WifiOff className="w-6 h-6 text-white" />
                ) : resultadosModal.estado === 'no_vinculada' ? (
                  <AlertTriangle className="w-6 h-6 text-white" />
                ) : resultadosModal.tipo === 'incumplimientos' ? (
                  <RefreshCcw className="w-6 h-6 text-white" />
                ) : (
                  <BarChart2 className="w-6 h-6 text-white" />
                )}
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">
                    {resultadosModal.tipo === 'incumplimientos'
                      ? 'Sincronización — Incumplimientos Docente'
                      : 'Sincronización — Promedios Consolidados'}
                  </h3>
                  <p className="text-xs text-white/70 font-bold mt-0.5">
                    {resultadosModal.estado === 'exitosa' && 'Sincronización exitosa con SESA'}
                    {resultadosModal.estado === 'no_vinculada' && 'Asignación aún no vinculada con SESA'}
                    {resultadosModal.estado === 'error' && 'Error de sincronización con SESA'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResultadosModal({ isOpen: false, tipo: null, estado: null, asignaciones: [], resumen: {}, mensajeError: '' })}
                className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cuerpo condicional según estado */}
            {resultadosModal.estado !== 'exitosa' ? (
              <div className="flex-1 flex items-center justify-center p-10">
                {resultadosModal.estado === 'no_vinculada' ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 w-full text-center shadow-sm">
                    <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
                    <h4 className="text-base font-black text-amber-900 mb-2">Grupo no vinculado con SESA</h4>
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">{resultadosModal.mensajeError}</p>
                    <p className="text-xs text-amber-600 font-bold mt-4">Verifica que el grupo esté registrado en el sistema externo antes de sincronizar.</p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 w-full text-center shadow-sm">
                    <WifiOff className="w-14 h-14 text-red-500 mx-auto mb-4" />
                    <h4 className="text-base font-black text-red-900 mb-2">Error de sincronización</h4>
                    <p className="text-sm text-red-800 font-medium leading-relaxed">{resultadosModal.mensajeError}</p>
                    <p className="text-xs text-red-600 font-bold mt-4">Verifica la conexión con SESA e inténtalo nuevamente.</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Tarjetas de resumen */}
                <div className={`px-8 pt-6 pb-4 grid gap-4 shrink-0 ${resultadosModal.tipo === 'incumplimientos' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {resultadosModal.tipo === 'incumplimientos' ? (
                    <>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-black text-[#0B1828]">{resultadosModal.resumen.paginas_consumidas ?? '—'}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Páginas SESA</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-black text-red-700">{resultadosModal.resumen.reportes_recibidos ?? '—'}</p>
                        <p className="text-xs text-red-600 font-bold mt-1 uppercase tracking-wider">Reportes recibidos</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-black text-amber-700">{resultadosModal.resumen.asignaciones_afectadas ?? '—'}</p>
                        <p className="text-xs text-amber-600 font-bold mt-1 uppercase tracking-wider">Actualizaciones</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-black text-emerald-700">{resultadosModal.resumen.actualizadas ?? '—'}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-wider">Actas Cerradas</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                        <p className="text-3xl font-black text-[#0B1828]">{resultadosModal.resumen.sin_promedio ?? '—'}</p>
                        <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-wider">Sin promedio aún</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="px-8 pb-3 shrink-0">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-5 h-5 text-slate-400" />
                    <p className="text-sm font-black text-[#0B1828] uppercase tracking-wider">
                      {resultadosModal.tipo === 'incumplimientos'
                        ? `Asignaciones Afectadas (${resultadosModal.asignaciones.length})`
                        : `Asignaciones Cerradas (${resultadosModal.asignaciones.length})`}
                    </p>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 px-8 pb-8">
                  {resultadosModal.asignaciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
                      <p className="text-base font-black text-[#0B1828]">
                        {resultadosModal.tipo === 'incumplimientos'
                          ? 'No se detectaron docentes con reporte de incumplimiento en este grupo.'
                          : 'No se encontraron asignaciones listas para cerrar con promedio en este grupo.'}
                      </p>
                      <p className="text-sm font-medium text-slate-500 mt-2">Los datos locales están completamente sincronizados con SESA.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead className="bg-[#0B1828]">
                          <tr>
                            <th className="px-5 py-4 text-left text-xs font-black text-white uppercase tracking-wider">Docente Titular</th>
                            <th className="px-5 py-4 text-left text-xs font-black text-white uppercase tracking-wider">Materia</th>
                            <th className="px-5 py-4 text-center text-xs font-black text-white uppercase tracking-wider">
                              {resultadosModal.tipo === 'incumplimientos' ? 'Estatus SESA' : 'Promedio Final'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                          {resultadosModal.asignaciones.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-5 py-4 font-black text-[#0B1828] whitespace-nowrap">
                                {`${item.docente_nombres ?? ''} ${item.docente_apellido_paterno ?? ''} ${item.docente_apellido_materno ?? ''}`.trim()}
                              </td>
                              <td className="px-5 py-4 text-slate-700">
                                <span className="font-black text-[#0B1828] block">{item.nombre_materia}</span>
                                <span className="text-[11px] text-slate-500 font-bold block mt-0.5">{item.codigo_unico} • Grupo {item.nombre_grupo}</span>
                              </td>
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                {resultadosModal.tipo === 'incumplimientos' ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black bg-red-50 text-red-700 border border-red-200 shadow-sm">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Incumplimiento
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                                    <BarChart2 className="w-3.5 h-3.5" />
                                    {Number(item.promedio_consolidado).toFixed(2)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setResultadosModal({ isOpen: false, tipo: null, estado: null, asignaciones: [], resumen: {}, mensajeError: '' })}
                className="px-8 py-3.5 text-sm font-black text-white bg-[#0B1828] hover:bg-[#162840] rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmación Cancelar/Reactivar */}
      {confirmModal.isOpen && confirmModal.asignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <div className="flex items-center text-white">
                {confirmModal.isCanceling ? (
                  <AlertTriangle className="w-6 h-6 mr-3 text-white" />
                ) : (
                  <UserCheck className="w-6 h-6 mr-3 text-white" />
                )}
                <h3 className="text-xl font-black tracking-tight">
                  {confirmModal.isCanceling ? 'Desactivar asignación' : 'Reactivar asignación'}
                </h3>
              </div>
              <button onClick={closeConfirmModal} className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8">
              {confirmModal.error && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-black text-red-800 uppercase tracking-tight">Error de validación</p>
                    <p className="text-sm text-red-700 font-medium leading-tight mt-0.5">{confirmModal.error}</p>
                  </div>
                </div>
              )}

              <p className="text-slate-600 text-sm mb-6 font-medium leading-relaxed">
                A continuación, se detalla la asignación docente que estás a punto de {confirmModal.isCanceling ? <strong className="text-red-600 font-black">cancelar</strong> : <strong className="text-emerald-600 font-black">reactivar</strong>}:
              </p>

              <div className="flex flex-col bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <span className="font-black text-[#0B1828] text-lg leading-tight mb-2">
                  {confirmModal.asignacion.nombre_materia}
                </span>
                <span className="text-sm font-bold text-slate-500">
                  Docente: {`${confirmModal.asignacion.docente_nombres} ${confirmModal.asignacion.docente_apellido_paterno} ${confirmModal.asignacion.docente_apellido_materno || ''}`.trim()}
                </span>
              </div>

              {confirmModal.isCanceling ? (
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
                  <p className="text-sm text-red-800 font-medium">
                    <strong className="font-black">Aviso del sistema:</strong> Al confirmar, esta acción liberará inmediatamente los horarios físicos del aula y desvinculará al docente asignado.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                  <p className="text-sm text-emerald-800 font-medium">
                    <strong className="font-black">Aviso del sistema:</strong> El sistema verificará automáticamente la disponibilidad de los bloques de horario para prevenir empalmes antes de aplicar la reactivación.
                  </p>
                </div>
              )}
            </div>
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={executeToggleStatus} 
                disabled={confirmModal.isLoading}
                className={`px-6 py-3 text-sm font-black text-white rounded-xl transition-all shadow-md active:scale-[0.98] w-full sm:w-auto flex justify-center items-center ${confirmModal.isCanceling ? 'bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-200 hover:shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-200 hover:shadow-emerald-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {confirmModal.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  confirmModal.isCanceling ? <Trash2 className="w-5 h-5 mr-2" /> : <UserCheck className="w-5 h-5 mr-2" />
                )}
                {confirmModal.isLoading ? 'Procesando...' : (confirmModal.isCanceling ? 'Desactivar Asignación' : 'Reactivar Asignación')}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalReporte && <ReporteAsignaciones alCerrar={() => setModalReporte(false)} />}
    </div>
  );
};