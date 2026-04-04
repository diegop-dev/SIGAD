import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, Download, Loader2, AlertCircle,
  Clock, MapPin, BookOpen, FileText, ChevronDown,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { TOAST_HORARIOS } from '../../../constants/toastMessages';

// ─── Constantes de la cuadrícula ─────────────────────────────────────────────
const SLOT_H_PX   = 22;
const TOTAL_SLOTS = 48;
const TOTAL_GRID_H = SLOT_H_PX * TOTAL_SLOTS;

const DAYS = [
  { idx: 1, label: 'Lunes',     short: 'Lun' },
  { idx: 2, label: 'Martes',    short: 'Mar' },
  { idx: 3, label: 'Miércoles', short: 'Mié' },
  { idx: 4, label: 'Jueves',    short: 'Jue' },
  { idx: 5, label: 'Viernes',   short: 'Vie' },
  { idx: 6, label: 'Sábado',    short: 'Sáb' },
  { idx: 7, label: 'Domingo',   short: 'Dom' },
];

// ─── Paleta de colores (debe coincidir con la del worker) ────────────────────
const PALETTE = [
  { bg: 'bg-blue-100',   border: 'border-blue-500',   text: 'text-blue-800',   accentBg: 'bg-blue-500'   },
  { bg: 'bg-violet-100', border: 'border-violet-500',  text: 'text-violet-800', accentBg: 'bg-violet-500' },
  { bg: 'bg-emerald-100',border: 'border-emerald-500', text: 'text-emerald-800',accentBg: 'bg-emerald-500'},
  { bg: 'bg-amber-100',  border: 'border-amber-500',   text: 'text-amber-800',  accentBg: 'bg-amber-500'  },
  { bg: 'bg-red-100',    border: 'border-red-500',     text: 'text-red-800',    accentBg: 'bg-red-500'    },
  { bg: 'bg-cyan-100',   border: 'border-cyan-500',    text: 'text-cyan-800',   accentBg: 'bg-cyan-500'   },
  { bg: 'bg-green-100',  border: 'border-green-500',   text: 'text-green-800',  accentBg: 'bg-green-500'  },
  { bg: 'bg-orange-100', border: 'border-orange-500',  text: 'text-orange-800', accentBg: 'bg-orange-500' },
  { bg: 'bg-pink-100',   border: 'border-pink-500',    text: 'text-pink-800',   accentBg: 'bg-pink-500'   },
  { bg: 'bg-indigo-100', border: 'border-indigo-500',  text: 'text-indigo-800', accentBg: 'bg-indigo-500' },
];

const getColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
};

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  return String(timeStr).substring(0, 5);
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const HorariosManagement = () => {
  const [isLoading,     setIsLoading]     = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [horarios,      setHorarios]      = useState([]);
  const [periodo,       setPeriodo]       = useState(null);
  const [periodos,      setPeriodos]      = useState([]);
  const [docente,       setDocente]       = useState(null);
  const [periodoId,     setPeriodoId]     = useState(null);

  // ── Carga de datos (se re-ejecuta al cambiar de periodo) ───────────────────
  const fetchHorario = async (idPeriodo) => {
    setIsLoading(true);
    try {
      const params = idPeriodo ? `?periodo_id=${idPeriodo}` : '';
      const res  = await api.get(`/horarios${params}`);
      const data = res.data;
      setHorarios(Array.isArray(data.horarios)            ? data.horarios            : []);
      setPeriodo(data.periodo   || null);
      setPeriodos(Array.isArray(data.periodosDisponibles) ? data.periodosDisponibles : []);
      setDocente(data.docente   || null);
    } catch (error) {
      console.error('[HorariosManagement] Error al cargar horario:', error);
      toast.error(TOAST_HORARIOS.errorCarga);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHorario(periodoId);
  }, [periodoId]);

  // ── Cambio de periodo desde el selector ────────────────────────────────────
  const handleCambioPeriodo = (e) => {
    setPeriodoId(Number(e.target.value));
  };

  // ── Descarga del PDF ────────────────────────────────────────────────────────
  const handleDescargarPDF = async () => {
    const toastId = toast.loading(TOAST_HORARIOS.loadingPDF);
    setIsDownloading(true);
    try {
      const params   = periodo?.id_periodo ? `?periodo_id=${periodo.id_periodo}` : '';
      const response = await api.get(`/horarios/pdf${params}`, { responseType: 'blob' });
      const blob     = new Blob([response.data], { type: 'application/pdf' });
      const url      = window.URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `horario_${periodo?.codigo || 'oficial'}_${periodo?.anio || ''}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(TOAST_HORARIOS.pdfDescargadoOk, { id: toastId });
    } catch (error) {
      const mensaje = error.response?.data instanceof Blob
        ? TOAST_HORARIOS.errorPDF
        : error.response?.data?.error || TOAST_HORARIOS.errorPDF;
      toast.error(mensaje, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Bloques de asignación por día ──────────────────────────────────────────
  const bloquesPorDia = useMemo(() => {
    const map = {};
    DAYS.forEach(d => { map[d.idx] = []; });
    horarios.forEach(h => {
      const dia = Number(h.dia_semana);
      if (!map[dia]) return;
      const startMin = timeToMinutes(h.hora_inicio);
      const endMin   = timeToMinutes(h.hora_fin);
      if (endMin <= startMin) return;
      map[dia].push({
        ...h,
        topPx:    (startMin / 30) * SLOT_H_PX,
        heightPx: ((endMin - startMin) / 30) * SLOT_H_PX,
        color:    getColor(h.nombre_materia),
      });
    });
    return map;
  }, [horarios]);

  // ── Resumen de materias únicas ─────────────────────────────────────────────
  const resumen = useMemo(() => {
    const vistas = new Set();
    return horarios.filter(h => {
      const key = `${h.nombre_materia}__${h.nombre_grupo}`;
      if (vistas.has(key)) return false;
      vistas.add(key);
      return true;
    });
  }, [horarios]);

  const sinPeriodos = !isLoading && periodos.length === 0;

  // ── Renderizado ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Cabecera del módulo ─────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <CalendarDays className="w-7 h-7 mr-3 text-blue-600" />
              Mi Horario Oficial
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">
              Visualiza y descarga tu carga académica por periodo escolar.
            </p>
          </div>

          {/* Controles: selector de periodo + botón PDF */}
          {!isLoading && periodos.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              {/* Selector de periodo */}
              <div className="relative">
                <select
                  value={periodo?.id_periodo ?? ''}
                  onChange={handleCambioPeriodo}
                  className="appearance-none pl-3 pr-8 py-2 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  {periodos.map(p => (
                    <option key={p.id_periodo} value={p.id_periodo}>
                      {p.codigo} · {p.anio}
                      {p.estatus === 'ACTIVO' ? ' (activo)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              {/* Botón descarga PDF */}
              <button
                onClick={handleDescargarPDF}
                disabled={isDownloading || horarios.length === 0}
                className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
              >
                {isDownloading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Download className="w-4 h-4 mr-2" />
                }
                {isDownloading ? 'Generando PDF...' : 'Descargar PDF oficial'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Estado de carga ─────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Cargando tu horario...</p>
        </div>

      ) : sinPeriodos ? (
        /* ── Sin ningún periodo con asignaciones ───────────────────────── */
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Sin horario asignado
          </h3>
          <p className="text-sm text-slate-500 max-w-sm text-center">
            No tienes asignaciones activas en ningún periodo escolar.
            La coordinación te notificará cuando tu horario esté disponible.
          </p>
        </div>

      ) : horarios.length === 0 ? (
        /* ── Periodo sin asignaciones (no debería ocurrir, pero cubre el caso) */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Sin clases en este periodo
          </h3>
          <p className="text-sm text-slate-500 max-w-sm text-center">
            Selecciona otro periodo en el selector superior.
          </p>
        </div>

      ) : (
        <>
          {/* ── Tarjetas de resumen ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {resumen.map((asig, i) => {
              const color   = getColor(asig.nombre_materia);
              const sesiones = horarios.filter(
                h => h.nombre_materia === asig.nombre_materia &&
                     h.nombre_grupo  === asig.nombre_grupo
              );
              return (
                <div
                  key={i}
                  className={`bg-white rounded-xl border-l-4 ${color.border} border border-slate-100 shadow-sm p-4`}
                >
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold mb-2 ${color.bg} ${color.text}`}>
                    <BookOpen className="w-3 h-3 mr-1" />
                    Grupo: {asig.nombre_grupo}
                  </div>
                  <p className={`text-sm font-black leading-tight mb-3 ${color.text}`}>
                    {asig.nombre_materia}
                  </p>
                  <div className="space-y-1.5">
                    {sesiones.map((s, j) => (
                      <div key={j} className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium">
                          {DAYS.find(d => d.idx === Number(s.dia_semana))?.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center font-medium">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(s.hora_inicio)}–{formatTime(s.hora_fin)}
                          </span>
                          <span className="flex items-center font-medium">
                            <MapPin className="w-3 h-3 mr-0.5 text-emerald-500" />
                            {s.nombre_aula}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Cuadrícula semanal ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-800 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                Vista semanal — bloques de 30 minutos
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Desplázate para ver todas las horas
              </span>
            </div>

            <div className="overflow-auto">
              <div className="flex" style={{ minWidth: '700px' }}>

                {/* ── Columna de horas ──────────────────────────────────── */}
                <div
                  className="shrink-0 border-r border-slate-200 bg-slate-50"
                  style={{ width: '56px', height: `${TOTAL_GRID_H}px`, position: 'relative' }}
                >
                  {Array.from({ length: TOTAL_SLOTS }, (_, slot) => {
                    const isHour = slot % 2 === 0;
                    const h = Math.floor((slot * 30) / 60).toString().padStart(2, '0');
                    const m = ((slot * 30) % 60).toString().padStart(2, '0');
                    return (
                      <div
                        key={slot}
                        style={{ top: slot * SLOT_H_PX, height: SLOT_H_PX }}
                        className="absolute w-full flex items-center justify-center border-b border-slate-100"
                      >
                        {isHour && (
                          <span className="text-[10px] font-medium text-slate-400 leading-none">
                            {h}:{m}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ── Columnas de días ──────────────────────────────────── */}
                {DAYS.map((day) => {
                  const isWeekend = day.idx >= 6;
                  const bloques   = bloquesPorDia[day.idx] || [];
                  return (
                    <div
                      key={day.idx}
                      className="flex-1 border-r border-slate-200 last:border-r-0"
                      style={{ minWidth: '100px' }}
                    >
                      {/* Encabezado del día */}
                      <div
                        className={`sticky top-0 z-10 text-center py-2 border-b border-slate-200 text-xs font-black tracking-wide ${
                          isWeekend
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <span className="hidden sm:block">{day.label}</span>
                        <span className="sm:hidden">{day.short}</span>
                      </div>

                      {/* Área de la cuadrícula */}
                      <div
                        style={{ height: `${TOTAL_GRID_H}px`, position: 'relative' }}
                        className={isWeekend ? 'bg-slate-50/50' : 'bg-white'}
                      >
                        {/* Líneas de fondo */}
                        {Array.from({ length: TOTAL_SLOTS }, (_, slot) => (
                          <div
                            key={slot}
                            style={{ top: slot * SLOT_H_PX, height: SLOT_H_PX }}
                            className={`absolute w-full border-b ${
                              slot % 2 === 0 ? 'border-slate-200' : 'border-slate-100'
                            }`}
                          />
                        ))}

                        {/* Bloques de asignación */}
                        {bloques.map((bloque, bi) => {
                          const { topPx, heightPx, color } = bloque;
                          return (
                            <div
                              key={bi}
                              title={`${bloque.nombre_materia} · ${bloque.nombre_grupo} · ${bloque.nombre_aula}`}
                              style={{ top: topPx + 1, height: heightPx - 2, left: 2, right: 2 }}
                              className={`absolute rounded-md border overflow-hidden ${color.bg} ${color.border}`}
                            >
                              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${color.accentBg}`} />
                              <div className="pl-2.5 pr-1 pt-0.5 h-full flex flex-col justify-center overflow-hidden">
                                <p className={`text-[9px] font-black leading-tight truncate ${color.text}`}>
                                  {bloque.nombre_materia}
                                </p>
                                {heightPx >= 44 && (
                                  <p className={`text-[8px] font-medium leading-tight truncate mt-0.5 ${color.text} opacity-80`}>
                                    {bloque.nombre_grupo} · {bloque.nombre_aula}
                                  </p>
                                )}
                                {heightPx >= 62 && (
                                  <p className={`text-[8px] font-medium leading-tight mt-0.5 ${color.text} opacity-70`}>
                                    {formatTime(bloque.hora_inicio)}–{formatTime(bloque.hora_fin)}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
