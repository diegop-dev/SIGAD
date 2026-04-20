import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Users, BookOpen, Clock, BarChart2,
  ChevronRight, Award, GraduationCap, CalendarDays,
  AlertCircle, Sparkles, Settings, X, Loader2,
  ShieldCheck, Building2, CalendarCheck
} from 'lucide-react';
import api from '../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { REGEX } from '../utils/regex';

/* ── Tarjeta de KPI reutilizable ────────────────────────────── */
const KpiCard = ({ title, value, subtitle, icon: Icon, accentColor, iconBg, iconColor, loading, linkTo }) => {
  const inner = (
    <div className="relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98] group h-full flex flex-col overflow-hidden">
      {/* barra de acento superior */}
      <div className={`h-1.5 w-full ${accentColor}`} />

      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 truncate">
              {title}
            </p>
            {loading ? (
              <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <p className="text-3xl font-black text-[#0B1828] truncate">
                {value}
              </p>
            )}
          </div>

          <div className={`shrink-0 p-3 rounded-2xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>

        {subtitle && (
          <p className="mt-auto pt-4 text-xs font-medium text-slate-500 line-clamp-2">
            {subtitle}
          </p>
        )}
        
        {linkTo && (
          <div className="mt-3 flex items-center text-xs font-bold text-[#0B1828]/60 group-hover:text-[#0B1828] transition-colors duration-200">
            Ver panel completo <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        )}
      </div>
    </div>
  );

  if (linkTo) return <Link to={linkTo} className="block h-full">{inner}</Link>;
  return <div className="h-full">{inner}</div>;
};

/* ── Modal de configuración del sistema ─────────────────────── */
const CONFIG_LABELS = {
  max_horas_semana:         { label: 'Máximo de horas semanales por docente', min: 1, max: 60, step: 1 },
  max_horas_continuas:      { label: 'Máximo de horas continuas por bloque',  min: 1, max: 8,  step: 0.5 },
  max_asignaciones_docente: { label: 'Máximo de materias por docente',        min: 1, max: 20, step: 1 },
};

const SettingsModal = ({ onClose }) => {
  const [config, setConfig]     = useState({});
  const [errores, setErrores]   = useState({});
  const [saving, setSaving]     = useState(false);
  const [fetching, setFetching] = useState(true);

  const validateField = (clave, valor) => {
    let err = null;
    const valTrim = (valor || '').toString().trim();
    
    if (!valTrim) {
      err = 'Este campo es obligatorio.';
    } else if (clave === 'max_horas_continuas') {
      if (!valTrim.match(/^\d+(\.\d)?$/)) err = 'Formato decimal no válido (ej. 4.5).';
    } else {
      if (!REGEX.NUMEROS.test(valTrim)) err = 'Solo se permiten números enteros.';
    }

    if (!err) {
      const v = parseFloat(valTrim);
      const meta = CONFIG_LABELS[clave];
      if (v < meta.min) err = `El valor mínimo es ${meta.min}.`;
      else if (v > meta.max) err = `El valor máximo es ${meta.max}.`;
    }
    return err;
  };

  const handleChange = (clave, rawValue) => {
    const val = rawValue.replace(/[^0-9.]/g, ''); 
    setConfig(c => ({ ...c, [clave]: val }));

    const err = validateField(clave, val);
    setErrores(prev => {
      const n = { ...prev };
      if (err) n[clave] = err; else delete n[clave];
      return n;
    });
  };

  useEffect(() => {
    api.get('/configuracion')
      .then(res => {
        const raw = res.data.data ?? {};
        const initial = {};
        Object.keys(CONFIG_LABELS).forEach(k => {
          initial[k] = raw[k]?.valor ?? '';
        });
        setConfig(initial);
      })
      .catch(() => toast.error('No se pudo cargar la configuración.'))
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    const newErrors = {};
    for (const [clave] of Object.entries(CONFIG_LABELS)) {
      const err = validateField(clave, config[clave] ?? '');
      if (err) newErrors[clave] = err;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrores(newErrors);
      return toast.error('Corrige los errores antes de continuar.');
    }
    setSaving(true);
    const toastId = toast.loading('Guardando configuración…');
    try {
      const body = Object.entries(config).map(([clave, valor]) => ({ clave, valor }));
      await api.put('/configuracion', body);
      toast.dismiss(toastId);
      toast.success('Configuración actualizada correctamente.');
      onClose();
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.error ?? 'Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center bg-[#0B1828]/50 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0B1828] px-6 py-4 flex items-center justify-between shadow-md relative z-10">
          <div className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-white/80" />
            <h2 className="text-base font-black text-white">Configuración del sistema</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-all duration-300 active:scale-[0.98]">
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-5">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#0B1828]" />
            </div>
          ) : (
            Object.entries(CONFIG_LABELS).map(([clave, meta]) => (
              <div key={clave}>
                <label className="block text-sm font-bold text-[#0B1828] mb-2">{meta.label} <span className="text-[#0B1828] ml-1">*</span></label>
                <input
                  type="text"
                  value={config[clave] ?? ''}
                  onChange={e => handleChange(clave, e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all text-[#0B1828] font-medium shadow-sm ${errores[clave] ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-white' : 'border-slate-200 focus:border-[#0B1828] focus:ring-[#0B1828]'}`}
                />
                {errores[clave] && <p className="text-xs font-bold text-red-500 mt-1.5">{errores[clave]}</p>}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-100 transition-all duration-300 active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || fetching}
            className="px-5 py-2.5 rounded-xl bg-[#0B1828] text-white text-sm font-bold shadow-md hover:bg-[#162840] hover:shadow-lg disabled:opacity-60 transition-all duration-300 active:scale-[0.98]"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Componente principal ───────────────────────────────────── */
const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [stats, setStats] = useState({
    activeUsers: '--',
    totalMaterias: '--',
    activePeriodo: null,
    totalAulas: '--',
    lastAuditDate: null,
    totalAuditLogs: 0,
    docentesSinAsig: null,
    nombre_academia: null,
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const superAdmin = user?.rol_id === 1;
      const admin      = user?.rol_id <= 2;

      try {
        const [resPeriodos, resMaterias, resUsers, resAulas, resAudit, resMiAcademia] = await Promise.all([
          api.get('/periodos').catch(() => ({ data: [] })),
          admin      ? api.get('/materias').catch(() => ({ data: [] }))                                  : null,
          admin      ? api.get('/users').catch(() => ({ data: [] }))                                     : null,
          admin      ? api.get('/aulas/consultar').catch(() => ({ data: [] }))                           : null,
          superAdmin ? api.get('/audit-logs', { params: { page: 1, limit: 1 } }).catch(() => null)       : null,
          user?.rol_id === 2 ? api.get('/academias/mi-academia').catch(() => ({ data: {} }))             : null,
        ]);

        const periodosRaw = resPeriodos.data?.data ?? resPeriodos.data;
        const periodos    = Array.isArray(periodosRaw) ? periodosRaw : [];
        const activePeriodo = periodos.find(p => p.estatus === 'ACTIVO') ?? null;

        let totalMaterias = '--';
        if (resMaterias) {
          const materias = Array.isArray(resMaterias.data) ? resMaterias.data : [];
          totalMaterias = materias.filter(m => m.estatus === 'ACTIVO').length;
        }

        let activeUsers = '--';
        if (resUsers) {
          const users = Array.isArray(resUsers.data) ? resUsers.data : [];
          activeUsers = users.filter(u => u.estatus === 'ACTIVO').length;
        }

        let totalAulas = '--';
        if (resAulas) {
          const aulasRaw = Array.isArray(resAulas.data) ? resAulas.data : (resAulas.data?.data ?? []);
          totalAulas = aulasRaw.filter(a => a.estatus === 'ACTIVO').length;
        }

        let lastAuditDate = null;
        let totalAuditLogs = 0;
        if (resAudit?.data?.data?.[0]) {
          lastAuditDate  = resAudit.data.data[0].fecha;
          totalAuditLogs = resAudit.data.total ?? 0;
        }

        let nombre_academia = null;
        if (resMiAcademia?.data?.nombre) {
          nombre_academia = resMiAcademia.data.nombre;
        }

        let docentesSinAsig = null;
        if (admin && activePeriodo?.id_periodo) {
          try {
            const [resAsig, resDocentes] = await Promise.all([
              api.get('/asignaciones', { params: { periodo_id: activePeriodo.id_periodo } }).catch(() => ({ data: { data: [] } })),
              api.get('/docentes').catch(() => ({ data: [] })),
            ]);
            const asigList    = resAsig.data?.data ?? [];
            const conAsig     = new Set(asigList.filter(a => a.estatus_acta === 'ABIERTA').map(a => a.docente_id));
            const docentesRaw = Array.isArray(resDocentes.data) ? resDocentes.data : (resDocentes.data?.data ?? []);
            const activos     = docentesRaw.filter(d => d.estatus === 'ACTIVO');
            docentesSinAsig   = Math.max(0, activos.length - conAsig.size);
          } catch { }
        }

        setStats({ activeUsers, totalMaterias, activePeriodo, totalAulas, lastAuditDate, totalAuditLogs, docentesSinAsig, nombre_academia });
      } catch (err) {
        console.error('Error al cargar estadísticas del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const isSuperAdmin = user?.rol_id === 1;
  const isAdmin = user?.rol_id <= 2;
  const isDocente = user?.rol_id === 3;

  const rolLabel = isSuperAdmin
    ? 'Superadministrador'
    : isAdmin ? 'Administrador' : 'Docente';

  const formatDateRange = (inicio, fin) => {
    const opts = { month: 'short', year: 'numeric' };
    return `${new Date(inicio).toLocaleDateString('es-MX', opts)} – ${new Date(fin).toLocaleDateString('es-MX', opts)}`;
  };

  const timeAgo = (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <div className="space-y-8">

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}

      {/* ── HERO HEADER COMPACTO ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0B1828] p-5 sm:p-6 md:p-7 text-white shadow-xl">
        {/* Decoración sutil corporativa */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white opacity-5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-10 w-40 h-40 rounded-full bg-white opacity-5 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* izquierda: saludo */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white/90 border border-white/20 shadow-sm">
                <Award className="w-3.5 h-3.5" />
                {rolLabel}
              </span>
              
              {/* Botón de configuración con animación estandarizada */}
              {isSuperAdmin && (
                <button
                  onClick={() => setSettingsOpen(true)}
                  title="Configuración del sistema"
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-300 active:scale-[0.98] shadow-sm"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight">
              {getGreeting()},{' '}
              <span className="text-white/60">
                {user?.nombres?.split(' ')[0]} {user?.apellido_paterno}
              </span>
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs sm:text-sm text-white/60 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>

          {/* derecha: badge de periodo activo + academia del administrador */}
          <div className="flex flex-col items-start md:items-end gap-2">
            {loading ? (
              <div className="h-16 w-44 rounded-2xl bg-white/5 animate-pulse" />
            ) : stats.activePeriodo ? (
              <div className="flex flex-col items-start md:items-end gap-1 bg-white/5 px-4 py-3 rounded-2xl border border-white/10">
                <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/50">
                  Periodo activo
                </p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-white font-black text-xl sm:text-2xl tracking-wide leading-none">
                    {stats.activePeriodo.codigo}
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs font-medium text-white/60 mt-0.5">
                  {formatDateRange(stats.activePeriodo.fecha_inicio, stats.activePeriodo.fecha_fin)}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500/20 border border-red-400/30">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-300 font-bold text-xs sm:text-sm">Sin periodo activo</span>
              </div>
            )}

            {user?.rol_id === 2 && stats.nombre_academia && (
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
                <div className="text-left md:text-right">
                  <p className="text-xs font-bold text-white/80 leading-tight">{stats.nombre_academia}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

        {isAdmin && (
          <KpiCard
            title="Usuarios activos"
            value={stats.activeUsers}
            subtitle="Cuentas habilitadas en el sistema"
            icon={Users}
            accentColor="bg-blue-600"
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
            loading={loading}
            linkTo="/usuarios"
          />
        )}

        {isAdmin && (
          <KpiCard
            title="Materias activas"
            value={stats.totalMaterias}
            subtitle="Registradas en el catálogo institucional"
            icon={BookOpen}
            accentColor="bg-indigo-600"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
            loading={loading}
            linkTo="/materias"
          />
        )}

        <KpiCard
          title="Periodo en curso"
          value={loading ? '--' : (stats.activePeriodo?.codigo ?? 'Ninguno')}
          subtitle={
            loading ? null :
            stats.activePeriodo
              ? formatDateRange(stats.activePeriodo.fecha_inicio, stats.activePeriodo.fecha_fin)
              : 'No hay periodo activo configurado'
          }
          icon={stats.activePeriodo || loading ? CalendarDays : AlertCircle}
          accentColor={stats.activePeriodo || loading ? 'bg-emerald-500' : 'bg-slate-300'}
          iconBg={stats.activePeriodo || loading ? 'bg-emerald-50' : 'bg-slate-100'}
          iconColor={stats.activePeriodo || loading ? 'text-emerald-600' : 'text-slate-400'}
          loading={loading}
          linkTo="/periodos"
        />

        {isAdmin && (
          <KpiCard
            title="Asignaciones"
            value={
              loading ? '--' :
              stats.docentesSinAsig === null ? '—' :
              stats.docentesSinAsig === 0 ? 'OK' :
              stats.docentesSinAsig
            }
            subtitle={
              loading ? null :
              stats.docentesSinAsig === null ? 'Sin periodo activo para evaluar' :
              stats.docentesSinAsig === 0 ? 'Todos los docentes tienen carga asignada' :
              `${stats.docentesSinAsig} docente${stats.docentesSinAsig !== 1 ? 's' : ''} sin asignaciones`
            }
            icon={CalendarCheck}
            accentColor={!loading && stats.docentesSinAsig > 0 ? 'bg-amber-500' : 'bg-cyan-500'}
            iconBg={!loading && stats.docentesSinAsig > 0 ? 'bg-amber-50' : 'bg-cyan-50'}
            iconColor={!loading && stats.docentesSinAsig > 0 ? 'text-amber-600' : 'text-cyan-600'}
            loading={loading}
            linkTo="/asignaciones"
          />
        )}

        {isAdmin && (
          <KpiCard
            title="Aulas y laboratorios"
            value={stats.totalAulas}
            subtitle="Espacios habilitados en el plantel"
            icon={Building2}
            accentColor="bg-teal-500"
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
            loading={loading}
            linkTo="/aulas"
          />
        )}

        {isSuperAdmin && (
          <KpiCard
            title="Panel de métricas"
            value="Analítica"
            subtitle="Inscritos, egresados y promedios"
            icon={BarChart2}
            accentColor="bg-[#0B1828]"
            iconBg="bg-slate-100"
            iconColor="text-[#0B1828]"
            loading={false}
            linkTo="/metricas"
          />
        )}

        {isSuperAdmin && (
          <KpiCard
            title="Registro de auditoría"
            value={loading ? '--' : (stats.lastAuditDate ? timeAgo(stats.lastAuditDate) : 'Vacío')}
            subtitle={
              loading ? null :
              stats.lastAuditDate
                ? `${stats.totalAuditLogs.toLocaleString()} eventos — último registro`
                : 'Aún no se han registrado eventos'
            }
            icon={ShieldCheck}
            accentColor="bg-violet-500"
            iconBg="bg-violet-50"
            iconColor="text-violet-600"
            loading={loading}
            linkTo="/audit-logs"
          />
        )}
      </div>

      {/* ── SECCIÓN INFORMATIVA POR ROL ──────────────────────── */}
      {isDocente && (
        <div className="flex items-start gap-5 rounded-3xl border border-slate-100 bg-white shadow-sm p-6 sm:p-8 transition-all duration-300 active:scale-[0.98]">
          <div className="shrink-0 rounded-2xl bg-[#0B1828]/5 p-4">
            <GraduationCap className="h-8 w-8 text-[#0B1828]" />
          </div>
          <div>
            <p className="text-lg font-black text-[#0B1828]">Portal docente</p>
            <p className="mt-1 text-sm font-medium text-slate-500 leading-relaxed">
              Consulta tus asignaciones y descarga tu horario oficial en PDF desde el menú lateral.
            </p>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex items-start gap-5 rounded-3xl border border-slate-100 bg-white shadow-sm p-6 sm:p-8 transition-all duration-300 active:scale-[0.98]">
          <div className="shrink-0 rounded-2xl bg-[#0B1828]/5 p-4">
            <Sparkles className="h-8 w-8 text-[#0B1828]" />
          </div>
          <div>
            <p className="text-lg font-black text-[#0B1828]">
              {isSuperAdmin ? 'Acceso completo al sistema' : 'Panel de administración'}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-500 leading-relaxed">
              {isSuperAdmin
                ? 'Gestiona usuarios, materias, periodos y revisa las métricas institucionales desde el panel de control.'
                : 'Administra docentes, materias, periodos, aulas, carreras y asignaciones desde el menú lateral.'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;