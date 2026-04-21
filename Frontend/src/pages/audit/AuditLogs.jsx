import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
  Download,
} from "lucide-react";
import api from "../../services/api";

/* ── Badges ── */
const BADGE = {
  CREACION: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MODIFICACION: "bg-amber-100   text-amber-800   border-amber-200",
  BAJA: "bg-red-100     text-red-800     border-red-200",
  LOGIN: "bg-blue-100    text-blue-800    border-blue-200",
  CAMBIO_CONTRASENA: "bg-violet-100  text-violet-800  border-violet-200",
  CUENTA_BLOQUEADA: "bg-orange-100  text-orange-800  border-orange-200",
};

const BADGE_LABEL = {
  CREACION: "Creación",
  MODIFICACION: "Modificación",
  BAJA: "Baja",
  LOGIN: "Login",
  CAMBIO_CONTRASENA: "Cambio contraseña",
  CUENTA_BLOQUEADA: "Cuenta bloqueada",
};

const MODULOS = [
  "AUTH",
  "USUARIOS",
  "DOCENTES",
  "ASIGNACIONES",
  "ACADEMIAS",
  "CARRERAS",
  "MATERIAS",
  "AULAS",
  "GRUPOS",
  "PERIODOS",
  "METRICAS",
  "CONFIGURACION",
];

const PAGE_SIZE = 20;

const filterInputClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white " +
  "focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 " +
  "transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

/* ─────────────────────────────────────────────────────────────── */

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [modulo, setModulo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  /* ── Sanitización de búsqueda ── */
  const handleSearchInput = (e) => {
    let val = e.target.value;
    val = val.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d10-9@._\-\s]/g, "");
    val = val.replace(/^\s+/g, "").replace(/\s{2,}/g, " ");
    const parts = val.split("@");
    if (parts.length > 2)
      val = parts[0] + "@" + parts.slice(1).join("").replace(/@/g, "");
    setSearchInput(val);
  };

  /* ── Debounce ── */
  useEffect(() => {
    const id = setTimeout(() => {
      const clean = searchInput.trim();
      if (clean.length >= 3 || clean.length === 0) {
        setSearchTerm(clean);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [modulo, desde, hasta]);

  /* ── Fetch automático ── */
  const fetchLogs = useCallback(async (currentPage, filters) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (filters.desde) params.desde = filters.desde;
      if (filters.hasta) params.hasta = filters.hasta;
      if (filters.modulo) params.modulo = filters.modulo;
      if (filters.texto) params.texto = filters.texto;
      const res = await api.get("/audit-logs", { params });
      setLogs(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch {
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (desde && hasta && new Date(desde) > new Date(hasta)) return;
    fetchLogs(page, { desde, hasta, modulo, texto: searchTerm });
  }, [page, searchTerm, modulo, desde, hasta, fetchLogs]);

  /* ── Exportar PDF — mismos filtros activos ── */
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (desde) params.desde = desde;
      if (hasta) params.hasta = hasta;
      if (modulo) params.modulo = modulo;
      if (searchTerm) params.texto = searchTerm;

      // ← usa la instancia api (axios) — el interceptor agrega el token automáticamente
      const response = await api.get("/audit-logs/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `auditoria_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
    } finally {
      setExporting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const fmtDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <ShieldCheck className="w-7 h-7 mr-3 text-white/90" />
            Registro de Auditoría
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            {total.toLocaleString()} eventos registrados en el sistema.
          </p>
        </div>

        {/* Botón exportar PDF */}
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Download className="w-5 h-5 mr-2" />
          )}
          {exporting ? "Generando…" : "Exportar PDF"}
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        {/* Búsqueda — ancho acotado para dar espacio a los filtros de fecha */}
        <div className="relative md:w-64 lg:w-72 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            maxLength={100}
            placeholder="Buscar usuario o registro…"
            value={searchInput}
            onChange={handleSearchInput}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>

        {/* Filtros secundarios */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Desde */}
          <div className="relative flex items-center flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-400 absolute left-4 z-10 pointer-events-none select-none">
              Desde
            </span>
            <input
              type="date"
              value={desde}
              max={hasta || today}
              onChange={(e) => setDesde(e.target.value)}
              className={`pl-16 cursor-pointer ${filterInputClass}`}
            />
          </div>

          {/* Hasta */}
          <div className="relative flex items-center flex-1 min-w-0">
            <span className="text-xs font-bold text-slate-400 absolute left-4 z-10 pointer-events-none select-none">
              Hasta
            </span>
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              max={today}
              onChange={(e) => setHasta(e.target.value)}
              className={`pl-16 cursor-pointer ${filterInputClass}`}
            />
          </div>

          {/* Módulo */}
          <div className="relative flex items-center flex-1 min-w-0">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10 pointer-events-none" />
            <select
              value={modulo}
              onChange={(e) => setModulo(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los módulos</option>
              {MODULOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-4 py-5 text-left text-xs font-black text-white uppercase tracking-wider w-28">
                  Módulo
                </th>
                <th className="px-4 py-5 text-left text-xs font-black text-white uppercase tracking-wider w-36">
                  Acción
                </th>
                <th className="px-4 py-5 text-left text-xs font-black text-white uppercase tracking-wider">
                  Registro afectado
                </th>
                <th className="px-4 py-5 text-center text-xs font-black text-white uppercase tracking-wider w-20">
                  ID
                </th>
                <th className="px-4 py-5 text-left text-xs font-black text-white uppercase tracking-wider w-44">
                  Usuario / Rol
                </th>
                <th className="px-4 py-5 text-left text-xs font-black text-white uppercase tracking-wider w-32">
                  IP
                </th>
                <th className="px-4 py-5 text-left text-xs font-black text-white uppercase tracking-wider w-36">
                  Fecha y hora
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">
                        Consultando el registro de auditoría…
                      </p>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <ShieldCheck className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">
                        Sin resultados
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        No hay eventos que coincidan con los filtros actuales.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id_log}
                    className="hover:bg-slate-50/80 transition-colors duration-150 align-top"
                  >
                    <td className="px-4 py-4">
                      <span className="font-black text-sm text-[#0B1828]">
                        {log.modulo}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-black whitespace-nowrap ${BADGE[log.accion] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {BADGE_LABEL[log.accion] ?? log.accion}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-700 break-words leading-snug">
                        {log.registro_afectado ?? "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-center">
                      {log.usuario_id ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-[#0B1828] text-xs font-black border border-slate-200">
                          {log.usuario_id}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {log.nombre_usuario ? (
                        <>
                          <span className="block text-sm font-black text-[#0B1828] break-words leading-snug">
                            {log.nombre_usuario}
                          </span>
                          <span className="block text-xs font-medium text-slate-400 mt-0.5">
                            {log.nombre_rol}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-xs font-mono text-slate-500 break-all">
                        {log.ip_address ?? "—"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-500 whitespace-nowrap">
                        {fmtDate(log.fecha)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginación ── */}
        {!loading && total > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Página <span className="font-black text-[#0B1828]">{page}</span>{" "}
              de <span className="font-black text-[#0B1828]">{totalPages}</span>{" "}
              —{" "}
              <span className="font-black text-[#0B1828]">
                {total.toLocaleString()}
              </span>{" "}
              registros
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] hover:border-[#0B1828]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-xl bg-white border border-slate-200 text-sm font-black text-[#0B1828] shadow-sm">
                {page} / {totalPages}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] hover:border-[#0B1828]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
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