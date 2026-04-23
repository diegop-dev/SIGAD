import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, Download, Loader2, AlertCircle,
  Clock, MapPin, FileText, ChevronDown, CheckCircle2, Users,
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { TOAST_HORARIOS } from '../../../constants/toastMessages';

// ─── Constantes de la cuadrícula ─────────────────────────────────────────────
const SLOT_H_PX    = 22;
const START_MIN    = 7  * 60;
const END_MIN      = 22 * 60;
const TOTAL_SLOTS  = (END_MIN - START_MIN) / 30;
const TOTAL_GRID_H = SLOT_H_PX * TOTAL_SLOTS;

const DAYS = [
  { idx: 1, label: 'Lunes',     short: 'Lun' },
  { idx: 2, label: 'Martes',    short: 'Mar' },
  { idx: 3, label: 'Miércoles', short: 'Mié' },
  { idx: 4, label: 'Jueves',    short: 'Jue' },
  { idx: 5, label: 'Viernes',   short: 'Vie' },
  { idx: 6, label: 'Sábado',    short: 'Sáb' },
];

const PALETTE = [
  { bg: 'bg-blue-100',    border: 'border-blue-400',    text: 'text-blue-900',    accentBg: 'bg-blue-500'    },
  { bg: 'bg-violet-100',  border: 'border-violet-400',  text: 'text-violet-900',  accentBg: 'bg-violet-500'  },
  { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-900', accentBg: 'bg-emerald-500' },
  { bg: 'bg-amber-100',   border: 'border-amber-400',   text: 'text-amber-900',   accentBg: 'bg-amber-500'   },
  { bg: 'bg-red-100',     border: 'border-red-400',     text: 'text-red-900',     accentBg: 'bg-red-500'     },
  { bg: 'bg-cyan-100',    border: 'border-cyan-400',    text: 'text-cyan-900',    accentBg: 'bg-cyan-500'    },
  { bg: 'bg-green-100',   border: 'border-green-400',   text: 'text-green-900',   accentBg: 'bg-green-500'   },
  { bg: 'bg-orange-100',  border: 'border-orange-400',  text: 'text-orange-900',  accentBg: 'bg-orange-500'  },
  { bg: 'bg-pink-100',    border: 'border-pink-400',    text: 'text-pink-900',    accentBg: 'bg-pink-500'    },
  { bg: 'bg-indigo-100',  border: 'border-indigo-400',  text: 'text-indigo-900',  accentBg: 'bg-indigo-500'  },
];

const getColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
};

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  return String(timeStr).substring(0, 5);
};

const formatAMPM = (timeStr) => {
  if (!timeStr) return '--:--';
  const [hourStr, minuteStr] = String(timeStr).split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, '0')}:${minuteStr} ${ampm}`;
};

// ── Helpers de estilos — idénticos a TeacherAssignments ──────────────────────
const getNivelStyles = (nivel) => {
  const n = (nivel || 'LICENCIATURA').toUpperCase();
  if (n === 'DOCTORADO') return 'bg-purple-100 text-purple-800 border-purple-200';
  if (n === 'MAESTRIA')  return 'bg-amber-100  text-amber-800  border-amber-200';
  return                        'bg-blue-100   text-blue-800   border-blue-200';
};

const getTipoStyles = (tipo) => {
  if (tipo === 'TRONCO_COMUN') return 'bg-white       text-slate-700   border-slate-300';
  if (tipo === 'OBLIGATORIA')  return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (tipo === 'OPTATIVA')     return 'bg-purple-100  text-purple-700  border-purple-200';
  return                              'bg-slate-100   text-slate-700   border-slate-200';
};

// Abreviatura del nivel para bloques compactos del grid
const nivelAbrev = (nivel) => {
  const n = (nivel || 'LICENCIATURA').toUpperCase();
  if (n === 'DOCTORADO') return 'DOC';
  if (n === 'MAESTRIA')  return 'MAE';
  return 'LIC';
};

// ─── Componente principal ─────────────────────────────────────────────────────
export const HorariosManagement = () => {
  const [isLoading,     setIsLoading]     = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [horarios,      setHorarios]      = useState([]);
  const [periodo,       setPeriodo]       = useState(null);
  const [periodos,      setPeriodos]      = useState([]);
  const [periodoId,     setPeriodoId]     = useState(null);

  const fetchHorario = async (idPeriodo) => {
    setIsLoading(true);
    try {
      const params = idPeriodo ? `?periodo_id=${idPeriodo}` : '';
      const res    = await api.get(`/horarios${params}`);
      const data   = res.data;
      setHorarios(Array.isArray(data.horarios)            ? data.horarios            : []);
      setPeriodo( data.periodo   || null);
      setPeriodos(Array.isArray(data.periodosDisponibles) ? data.periodosDisponibles : []);
    } catch (error) {
      console.error('[HorariosManagement]', error);
      toast.error(TOAST_HORARIOS.errorCarga);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHorario(periodoId); }, [periodoId]);

  const handleCambioPeriodo = (e) => setPeriodoId(Number(e.target.value));

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

  const bloquesPorDia = useMemo(() => {
    const map = {};
    DAYS.forEach(d => { map[d.idx] = []; });
    horarios.forEach(h => {
      const dia = Number(h.dia_semana);
      if (!map[dia]) return;
      const startMin = timeToMinutes(h.hora_inicio);
      const endMin   = timeToMinutes(h.hora_fin);
      if (endMin <= startMin) return;
      if (endMin <= START_MIN || startMin >= END_MIN) return;
      const cs = Math.max(startMin, START_MIN);
      const ce = Math.min(endMin,   END_MIN);
      map[dia].push({
        ...h,
        topPx:    ((cs - START_MIN) / 30) * SLOT_H_PX,
        heightPx: ((ce - cs)        / 30) * SLOT_H_PX,
        color:    getColor(h.nombre_materia),
      });
    });
    return map;
  }, [horarios]);

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

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════════════════════════
          FIX 4 — Header responsivo
          • En móvil: título arriba, controles abajo apilados en columna
          • En sm+: fila única con título a la izquierda y controles a la derecha
         ════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          {/* Título */}
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
              <CalendarDays className="w-7 h-7 mr-3 text-white/90 shrink-0" />
              Mi Horario
            </h1>
            <p className="mt-1.5 text-sm text-white/70 font-medium">
              Visualiza y descarga tu carga académica por periodo escolar.
            </p>
          </div>

          {/* Controles — solo cuando hay datos */}
          {!isLoading && periodos.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              {/* Selector compacto */}
              <div className="relative">
                <select
                  value={periodo?.id_periodo ?? ""}
                  onChange={handleCambioPeriodo}
                  className="w-full sm:w-auto appearance-none pl-3 pr-8 py-2 text-sm font-semibold
                             text-[#0B1828] bg-white rounded-xl border border-white/20 shadow-sm
                             focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer
                             transition-all duration-200"
                >
                  {periodos.map((p) => (
                    <option key={p.id_periodo} value={p.id_periodo}>
                      {p.codigo} · {p.anio}
                      {p.estatus === "ACTIVO" ? " (activo)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>

              {/*
                FIX 3 — Botón PDF responsivo
                • Móvil       : icono + texto corto "Descargar PDF", ancho completo
                • sm+         : icono + texto completo "Descargar PDF oficial", ancho auto
              */}
              <button
                onClick={handleDescargarPDF}
                disabled={isDownloading || horarios.length === 0}
                className="flex items-center justify-center gap-2
                           px-5 py-2.5 sm:px-6 sm:py-3.5
                           bg-white text-[#0B1828] rounded-xl
                           hover:bg-slate-50 active:scale-95
                           transition-all duration-200 shadow-sm font-black
                           disabled:opacity-50 disabled:cursor-not-allowed
                           w-full sm:w-auto"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin shrink-0" />
                ) : (
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                )}
                <span className="sm:hidden text-sm">
                  {isDownloading ? "Generando…" : "Descargar PDF"}
                </span>
                <span className="hidden sm:inline text-sm">
                  {isDownloading ? "Generando…" : "Descargar PDF oficial"}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Estados vacíos ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 text-[#0B1828] animate-spin mb-4" />
          <p className="text-sm text-slate-500 font-medium">
            Cargando tu horario...
          </p>
        </div>
      ) : sinPeriodos ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-[#0B1828] mb-1">
            Sin horario asignado
          </h3>
          <p className="text-sm text-slate-500 font-medium max-w-sm text-center">
            No tienes asignaciones confirmadas en ningún periodo escolar. La
            coordinación te notificará cuando tu horario esté disponible.
          </p>
        </div>
      ) : horarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-[#0B1828] mb-1">
            Sin clases en este periodo
          </h3>
          <p className="text-sm text-slate-500 font-medium max-w-sm text-center">
            Selecciona otro periodo en el selector superior.
          </p>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════════════════════
              FIX 1 — Tarjetas con badges idénticos a TeacherAssignments
              Estructura: navy header → badges técnicos → grupo → bloques
             ════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
            {resumen.map((asig, i) => {
              const sesiones = horarios.filter(
                (h) =>
                  h.nombre_materia === asig.nombre_materia &&
                  h.nombre_grupo === asig.nombre_grupo,
              );
              const esTroncoComun = asig.nombre_grupo === "TRONCO COMÚN";
              const nivelStr = (
                asig.nivel_academico || "LICENCIATURA"
              ).toUpperCase();
              const tipoStr = asig.tipo_asignatura || "OBLIGATORIA";

              return (
                <div
                  key={i}
                  className="flex flex-col bg-white rounded-3xl shadow-sm border border-slate-100
                             hover:border-slate-200 hover:shadow-md transition-all duration-200"
                >
                  {/* ── Cabecera navy ── */}
                  <div className="bg-[#0B1828] p-5 rounded-t-3xl border-b border-slate-800 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2 w-full">
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black
                                       bg-white/10 text-white border border-white/10 uppercase tracking-wider shrink-0"
                      >
                        <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-white/70" />
                        {asig.codigo_periodo}
                      </span>
                      <span
                        className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black
                                       uppercase tracking-wider bg-emerald-500/20 text-emerald-400
                                       border border-emerald-500/30 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Aceptada
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white leading-tight">
                      {asig.nombre_materia}
                    </h3>
                  </div>

                  {/* ── Cuerpo ── */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    {/*
                      FIX 1 — Fila de badges técnicos, igual que TeacherAssignments:
                      código único | nivel académico | tipo asignatura
                    */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="flex items-center text-xs font-black text-slate-500
                                       bg-white px-2.5 py-1.5 rounded-lg border border-slate-200
                                       shadow-sm uppercase tracking-wider"
                      >
                        {asig.codigo_unico || "SIN CÓDIGO"}
                      </span>
                      <span
                        className={`px-2.5 py-1.5 rounded-lg border shadow-sm font-black
                                        text-[10px] uppercase tracking-wider ${getNivelStyles(nivelStr)}`}
                      >
                        {nivelStr}
                      </span>
                      <span
                        className={`px-2.5 py-1.5 rounded-lg border shadow-sm font-black
                                        text-[10px] uppercase tracking-wider ${getTipoStyles(tipoStr)}`}
                      >
                        {tipoStr.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Grupo — igual que TeacherAssignments */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center shadow-sm">
                      <Users className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
                      <p className="text-sm font-medium text-slate-600">
                        {esTroncoComun ? (
                          <>
                            Modalidad:
                            <span className="text-[#0B1828] font-black text-sm block mt-0.5">
                              Tronco Común (Multidisciplinar)
                            </span>
                          </>
                        ) : (
                          <>
                            Grupo asignado:
                            <span className="text-[#0B1828] font-black text-sm block mt-0.5">
                              {asig.nombre_grupo}
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Bloques de horario — igual que TeacherAssignments */}
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                        Bloques de Horario
                      </h4>
                      <div className="space-y-2.5">
                        {sesiones.map((s, j) => (
                          <div
                            key={j}
                            className="flex items-center justify-between p-3.5 rounded-2xl
                                       bg-white border border-slate-200 shadow-sm gap-3"
                          >
                            <div className="flex items-center text-sm font-black text-[#0B1828] min-w-0">
                              <div
                                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100
                                              flex items-center justify-center mr-3 shrink-0
                                              text-xs font-black text-[#0B1828]"
                              >
                                {DAYS.find(
                                  (d) => d.idx === Number(s.dia_semana),
                                )?.short ?? "—"}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm truncate">
                                  {DAYS.find(
                                    (d) => d.idx === Number(s.dia_semana),
                                  )?.label ?? "—"}
                                </span>
                                <span className="text-xs font-bold text-slate-500 flex items-center mt-0.5 whitespace-nowrap">
                                  <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                  {formatAMPM(s.hora_inicio)} –{" "}
                                  {formatAMPM(s.hora_fin)}
                                </span>
                              </div>
                            </div>
                            <div
                              className="text-xs font-black text-[#0B1828] flex items-center
                                            bg-slate-50 px-3 py-2 rounded-xl border border-slate-100
                                            whitespace-nowrap shrink-0"
                            >
                              <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-600 shrink-0" />
                              {s.nombre_aula}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Cuadrícula semanal ───────────────────────────────────────── */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-[#0B1828] rounded-t-3xl flex items-center">
              <h2 className="text-base font-black text-white flex items-center">
                <FileText className="w-4 h-4 mr-2 text-white/70" />
                Vista semanal — 07:00 a 22:00
              </h2>
            </div>

            {/* Header de días */}
            <div className="flex border-b-2 border-slate-200 bg-white">
              {/* Espaciado de columna-hora — responsivo */}
              <div className="shrink-0 bg-white border-r border-slate-200 w-10 sm:w-14" />
              {DAYS.map((day) => (
                <div
                  key={day.idx}
                  className={`flex-1 py-3 text-center text-xs font-black tracking-wider
                    border-r border-slate-200 last:border-r-0 ${
                      day.idx === 6
                        ? "bg-slate-50 text-slate-400"
                        : "bg-white text-[#0B1828]"
                    }`}
                >
                  <span className="hidden md:block">{day.label}</span>
                  <span className="md:hidden">{day.short}</span>
                </div>
              ))}
            </div>

            {/* Cuerpo — sin scrollbars */}
            <div className="flex">
              {/* Columna de horas */}
              <div
                className="shrink-0 border-r border-slate-200 bg-slate-50 w-10 sm:w-14"
                style={{
                  height: `${SLOT_H_PX * (TOTAL_SLOTS + 1)}px`,
                  position: "relative",
                }}
              >
                {Array.from({ length: TOTAL_SLOTS + 1 }, (_, slot) => {
                  const totalMin = START_MIN + slot * 30;
                  const isHour = slot % 2 === 0;
                  const h = Math.floor(totalMin / 60)
                    .toString()
                    .padStart(2, "0");
                  const m = (totalMin % 60).toString().padStart(2, "0");
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

              {/* Columnas de días */}
              {DAYS.map((day) => {
                const isWeekend = day.idx === 6;
                const bloques = bloquesPorDia[day.idx] || [];
                return (
                  <div
                    key={day.idx}
                    className="flex-1 border-r border-slate-200 last:border-r-0"
                  >
                    <div
                      style={{
                        height: `${TOTAL_GRID_H}px`,
                        position: "relative",
                      }}
                      className={isWeekend ? "bg-slate-50/60" : "bg-white"}
                    >
                      {/* Líneas de fondo */}
                      {Array.from({ length: TOTAL_SLOTS }, (_, slot) => (
                        <div
                          key={slot}
                          style={{ top: slot * SLOT_H_PX, height: SLOT_H_PX }}
                          className={`absolute w-full border-b ${
                            slot % 2 === 0
                              ? "border-slate-200"
                              : "border-slate-100"
                          }`}
                        />
                      ))}

                      {/* Bloques */}
                      {bloques.map((bloque, bi) => {
                        const { topPx, heightPx, color } = bloque;
                        const nivelStr = (
                          bloque.nivel_academico || "LICENCIATURA"
                        ).toUpperCase();
                        const tipoStr = bloque.tipo_asignatura || "OBLIGATORIA";

                        const showAula = heightPx >= 46;
                        const showNivel = heightPx >= 66;
                        const showTipo = heightPx >= 86;
                        const showTime = heightPx >= 106;

                        const nivelGridStyle =
                          nivelStr === "DOCTORADO"
                            ? "bg-purple-200 text-purple-900"
                            : nivelStr === "MAESTRIA"
                              ? "bg-amber-200  text-amber-900"
                              : "bg-blue-200   text-blue-900";

                        const tipoGridStyle =
                          tipoStr === "TRONCO_COMUN"
                            ? "bg-slate-200   text-slate-700"
                            : tipoStr === "OBLIGATORIA"
                              ? "bg-emerald-200 text-emerald-900"
                              : tipoStr === "OPTATIVA"
                                ? "bg-purple-200  text-purple-900"
                                : "bg-slate-200   text-slate-700";

                        return (
                          <div
                            key={bi}
                            title={`${bloque.nombre_materia} · ${bloque.nombre_grupo} · ${bloque.nombre_aula} · ${nivelStr} · ${tipoStr.replace(/_/g, " ")} · ${formatTime(bloque.hora_inicio)}–${formatTime(bloque.hora_fin)}`}
                            style={{
                              top: topPx + 1,
                              height: heightPx - 2,
                              left: 2,
                              right: 2,
                            }}
                            className={`absolute rounded-md border overflow-hidden ${color.bg} ${color.border}`}
                          >
                            <div
                              className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-sm ${color.accentBg}`}
                            />

                            <div className="pl-2.5 pr-1.5 py-0.5 h-full flex flex-col justify-center overflow-hidden gap-px">
                              <p
                                className={`text-[9px] font-black leading-tight truncate ${color.text}`}
                              >
                                {bloque.nombre_materia}
                              </p>
                              {showAula && (
                                <p
                                  className={`text-[8px] font-semibold leading-tight whitespace-nowrap overflow-hidden ${color.text} opacity-80`}
                                >
                                  {bloque.nombre_aula}
                                </p>
                              )}
                              {showNivel && (
                                <span
                                  className={`self-start text-[7px] font-black leading-none px-1 py-px rounded-sm ${nivelGridStyle}`}
                                >
                                  {nivelAbrev(nivelStr)}
                                </span>
                              )}
                              {showTipo && (
                                <span
                                  className={`self-start text-[7px] font-black leading-none px-1 py-px rounded-sm ${tipoGridStyle}`}
                                >
                                  {tipoStr === "TRONCO_COMUN"
                                    ? "T.COM"
                                    : tipoStr.slice(0, 3)}
                                </span>
                              )}
                              {showTime && (
                                <p
                                  className={`text-[8px] font-medium leading-tight whitespace-nowrap ${color.text} opacity-60`}
                                >
                                  {formatTime(bloque.hora_inicio)}–
                                  {formatTime(bloque.hora_fin)}
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
        </>
      )}
    </div>
  );
};