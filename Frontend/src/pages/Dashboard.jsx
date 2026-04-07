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

/* ── Tarjeta de KPI reutilizable ────────────────────────────── */
const KpiCard = ({ title, value, subtitle, icon: Icon, accentColor, iconBg, iconColor, loading, linkTo }) => {
  const inner = (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
      {/* barra de acento superior */}
      <div className={`h-1 w-full ${accentColor}`} />

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 truncate">
              {title}
            </p>
            {loading ? (
              <div className="h-10 w-20 bg-slate-100 rounded-lg animate-pulse" />
            ) : (
              <p className="text-4xl font-black text-slate-800 leading-none truncate">
                {value}
              </p>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-slate-500 font-medium leading-snug">
                {subtitle}
              </p>
            )}
          </div>

          <div className={`shrink-0 p-3 rounded-xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-7 h-7 ${iconColor}`} />
          </div>
        </div>

        {linkTo && (
          <div className="mt-4 flex items-center text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors duration-200">
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
  max_asignaciones_docente: { label: 'Máximo de materias por docente',         min: 1, max: 20, step: 1 },
};

const SettingsModal = ({ onClose }) => {
  const [config, setConfig]     = useState({});
  const [saving, setSaving]     = useState(false);
  const [fetching, setFetching] = useState(true);

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
    for (const [clave, meta] of Object.entries(CONFIG_LABELS)) {
      const v = parseFloat(config[clave]);
      if (isNaN(v) || v <= 0) {
        return toast.error(`Valor inválido para: ${meta.label}`);
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            <h2 className="text-base font-bold text-slate-800">Configuración del sistema</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {fetching ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            Object.entries(CONFIG_LABELS).map(([clave, meta]) => (
              <div key={clave}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{meta.label}</label>
                <input
                  type="number"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={config[clave] ?? ''}
                  onChange={e => setConfig(c => ({ ...c, [clave]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || fetching}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
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
        // ── Batch 1: datos base en paralelo ──
        const [resMaterias, resPeriodos, resUsers, /*resAulas*/, resAudit] = await Promise.all([
          api.get('/materias').catch(() => ({ data: [] })),
          api.get('/periodos').catch(() => ({ data: [] })),
          admin      ? api.get('/users').catch(() => ({ data: [] }))                                  : null,
          // --- AQUÍ COMENTAMOS TEMPORALMENTE LA LLAMADA A /aulas ---
          // admin      ? api.get('/aulas').catch(() => ({ data: [] }))                                  : null,
          null, // Pasamos null para mantener el orden del array resultante
          superAdmin ? api.get('/audit-logs', { params: { page: 1, limit: 1 } }).catch(() => null)    : null,
        ]);

        const materias    = Array.isArray(resMaterias.data) ? resMaterias.data : [];
        const periodosRaw = resPeriodos.data?.data ?? resPeriodos.data;
        const periodos    = Array.isArray(periodosRaw) ? periodosRaw : [];

        const activePeriodo = periodos.find(p => p.estatus === 'ACTIVO') ?? null;
        const totalMaterias = materias.filter(m => m.estatus === 'ACTIVO').length;

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

        // ── Batch 2: asignaciones vs docentes (depende de activePeriodo) ──
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
          } catch { /* no-op, card mostrará fallback */ }
        }

        setStats({ activeUsers, totalMaterias, activePeriodo, totalAulas, lastAuditDate, totalAuditLogs, docentesSinAsig });
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

      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 text-white shadow-xl">
        {/* blobs decorativos */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-blue-500 opacity-10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-24 w-40 h-40 rounded-full bg-indigo-400 opacity-10 blur-2xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-24 bg-blue-600 opacity-5 blur-3xl" />

        {isSuperAdmin && (
          <button
            onClick={() => setSettingsOpen(true)}
            title="Configuración del sistema"
            className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* izquierda: saludo */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 rounded-full text-xs font-bold bg-white/10 text-white/70 border border-white/10 backdrop-blur-sm">
              <Award className="w-3.5 h-3.5" />
              {rolLabel}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {getGreeting()},{' '}
              <span className="text-blue-300">
                {user?.nombres?.split(' ')[0]} {user?.apellido_paterno}
              </span>
            </h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-slate-400 font-medium">
              <Clock className="w-4 h-4 text-slate-500" />
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>

          {/* derecha: badge de periodo activo */}
          {loading ? (
            <div className="h-16 w-40 rounded-xl bg-white/5 animate-pulse" />
          ) : stats.activePeriodo ? (
            <div className="flex flex-col items-start sm:items-end gap-1">
              <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                Periodo activo
              </p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
                </span>
                <span className="text-emerald-300 font-black text-xl tracking-wide">
                  {stats.activePeriodo.codigo}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {formatDateRange(stats.activePeriodo.fecha_inicio, stats.activePeriodo.fecha_fin)}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-400/30">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 font-bold text-sm">Sin periodo activo</span>
            </div>
          )}
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

        <KpiCard
          title="Periodo en curso"
          value={loading ? '--' : (stats.activePeriodo?.codigo ?? 'Ninguno')}
          subtitle={
            loading ? null :
            stats.activePeriodo
              ? formatDateRange(stats.activePeriodo.fecha_inicio, stats.activePeriodo.fecha_fin)
              : 'No hay periodo activo'
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
            accentColor="bg-amber-500"
            iconBg="bg-amber-50"
            iconColor="text-amber-600"
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
        <div className="flex items-start gap-5 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-6">
          <div className="shrink-0 rounded-xl bg-emerald-100 p-3">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Portal docente</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Consulta tus asignaciones y descarga tu horario oficial en PDF desde el menú lateral.
            </p>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="flex items-start gap-5 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="shrink-0 rounded-xl bg-blue-100 p-3">
            <Sparkles className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">
              {isSuperAdmin ? 'Acceso completo al sistema' : 'Panel de administración'}
            </p>
            <p className="mt-0.5 text-sm text-slate-500">
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
