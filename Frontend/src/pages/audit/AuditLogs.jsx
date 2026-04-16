import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";
import api from "../../services/api";

const BADGE = {
  CREACION: "bg-emerald-100 text-emerald-800 border-emerald-200",
  MODIFICACION: "bg-amber-100   text-amber-800   border-amber-200",
  BAJA: "bg-red-100     text-red-800     border-red-200",
  LOGIN: "bg-blue-100    text-blue-800    border-blue-200",
  CAMBIO_CONTRASENA: "bg-violet-100  text-violet-800  border-violet-200",
  CUENTA_BLOQUEADA: "bg-orange-100  text-orange-800  border-orange-200", // ← nuevo
};

const BADGE_LABEL = {
  CREACION: "Creación",
  MODIFICACION: "Modificación",
  BAJA: "Baja",
  LOGIN: "Login",
  CAMBIO_CONTRASENA: "Cambio contraseña",
  CUENTA_BLOQUEADA: "Cuenta bloqueada", // ← nuevo
};

const MODULOS = [
  "AUTH",
  "ASIGNACIONES",
  "USUARIOS",
  "DOCENTES",
  "ACADEMIAS",
  "MATERIAS",
  "PERIODOS",
  "AULAS",
  "CARRERAS",
  "GRUPOS",
  "METRICAS",
];

const PAGE_SIZE = 20;

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    desde: "",
    hasta: "",
    modulo: "",
    texto: "",
  });
  const [applied, setApplied] = useState({
    desde: "",
    hasta: "",
    modulo: "",
    texto: "",
  });

  const fetchLogs = useCallback(async (currentPage, f) => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: PAGE_SIZE };
      if (f.desde) params.desde = f.desde;
      if (f.hasta) params.hasta = f.hasta;
      if (f.modulo) params.modulo = f.modulo;
      if (f.texto) params.texto = f.texto;

      const res = await api.get("/audit-logs", { params });
      setLogs(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch (err) {
      console.error("Error al cargar audit logs:", err);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page, applied);
  }, [page, applied, fetchLogs]);

  const handleApply = () => {
    setPage(1);
    setApplied({ ...filters });
  };

  const handleReset = () => {
    const empty = { desde: "", hasta: "", modulo: "", texto: "" };
    setFilters(empty);
    setPage(1);
    setApplied(empty);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Registro de auditoría
            </h1>
            <p className="text-sm text-slate-500">
              {total.toLocaleString()} eventos registrados
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-600">
          <Filter className="w-4 h-4" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filters.desde}
              onChange={(e) =>
                setFilters((f) => ({ ...f, desde: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filters.hasta}
              onChange={(e) =>
                setFilters((f) => ({ ...f, hasta: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Módulo
            </label>
            <select
              value={filters.modulo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, modulo: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos</option>
              {MODULOS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Búsqueda
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Usuario, registro…"
                value={filters.texto}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, texto: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && handleApply()}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Aplicar filtros
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Módulo
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Registro afectado
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  ID Usuario
                </th>{" "}
                {/* ← nuevo, reemplaza Detalle */}
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Usuario / Rol
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Fecha y hora
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                    <p className="mt-2 text-sm text-slate-400">
                      Cargando registros…
                    </p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-16 text-slate-400 text-sm"
                  >
                    No se encontraron registros con los filtros actuales.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id_log}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {log.modulo}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${BADGE[log.accion] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {BADGE_LABEL[log.accion] ?? log.accion}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-slate-600 max-w-xs truncate"
                      title={log.registro_afectado}
                    >
                      {log.registro_afectado ?? "—"}
                    </td>

                    {/* ← detalle eliminado; ID Usuario en su lugar */}
                    <td className="px-4 py-3 text-center">
                      {log.usuario_id ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                          {log.usuario_id}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {/* ← fix: antes era log.nombre_usuario (undefined), ahora viene del CONCAT del modelo */}
                      {log.nombre_usuario ? (
                        <>
                          <span className="font-medium text-slate-700">
                            {log.nombre_usuario}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {log.nombre_rol}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {log.ip_address ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {fmtDate(log.fecha)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Página {page} de {totalPages} — {total.toLocaleString()} registros
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};