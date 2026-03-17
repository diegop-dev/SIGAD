import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Loader2,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { PeriodosForm } from "./periodosForm";
import { PeriodosDelete } from "./periodosDelete";

export const PeriodosManagement = () => {

  const [showForm, setShowForm] = useState(false);
  const [periodos, setPeriodos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodoToEdit, setPeriodoToEdit] = useState(null);
  const [periodoToDelete, setPeriodoToDelete] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const fetchPeriodos = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/periodos");
      const data = response.data.data || response.data;
      setPeriodos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Error cargando periodos");
      setPeriodos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-MX", { timeZone: "UTC" });
  };

  const filteredPeriodos = useMemo(() => {
    return periodos.filter((p) => {
      const busqueda = searchTerm.toLowerCase();

      return (
        (p.codigo?.toLowerCase().includes(busqueda) ||
          p.anio?.toString().includes(busqueda)) &&
        (filterYear ? p.anio.toString() === filterYear : true) &&
        (filterStatus ? p.estatus === filterStatus : true)
      );
    });
  }, [periodos, searchTerm, filterYear, filterStatus]);

  const totalPages = Math.ceil(filteredPeriodos.length / itemsPerPage) || 1;

  const paginatedPeriodos = filteredPeriodos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterYear, filterStatus]);

  const handleSuccess = () => {
    setShowForm(false);
    setPeriodoToEdit(null);
    fetchPeriodos();
  };

  const uniqueYears = [...new Set(periodos.map((p) => p.anio))].sort((a, b) => b - a);

  if (showForm) {
    return (
      <PeriodosForm
        periodoToEdit={periodoToEdit}
        onBack={() => {
          setShowForm(false);
          setPeriodoToEdit(null);
        }}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center">
            <CalendarDays className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de periodos
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Administra los periodos académicos y su disponibilidad.
          </p>
        </div>

        <button
          onClick={() => {
            setPeriodoToEdit(null);
            setShowForm(true);
          }}
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo periodo
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">

        <div className="flex-1 relative">
          <Search className="absolute left-4 top-3 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código o año..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 py-3 transition"
          />
        </div>

        <div className="flex gap-4">

          <div className="relative">
            <Filter className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="pl-10 rounded-xl border-slate-200 bg-slate-50 focus:bg-white py-3 pr-4"
            >
              <option value="">Todos los años</option>
              {uniqueYears.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border-slate-200 bg-slate-50 py-3 px-4"
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>

        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">

        <table className="min-w-full divide-y divide-slate-200">

          <thead className="bg-slate-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Código</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Inicio</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Fin</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Límite</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Estatus</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">

            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-blue-500 mb-3" />
                  <p className="text-sm text-slate-500">Cargando periodos...</p>
                </td>
              </tr>
            ) : paginatedPeriodos.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center">
                  <CalendarDays className="mx-auto mb-3 text-slate-400" />
                  <p className="font-bold text-slate-700">Sin resultados</p>
                  <p className="text-sm text-slate-500">
                    No hay periodos que coincidan con la búsqueda.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedPeriodos.map((p) => (
                <tr key={p.id_periodo} className="hover:bg-blue-50/50 transition">

                  <td className="px-6 py-4 font-bold text-slate-900">{p.codigo}</td>
                  <td className="px-6 py-4">{formatDate(p.fecha_inicio)}</td>
                  <td className="px-6 py-4">{formatDate(p.fecha_fin)}</td>
                  <td className="px-6 py-4">{formatDate(p.fecha_limite_calif)}</td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                      p.estatus === "ACTIVO"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    }`}>
                      {p.estatus}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center space-x-2">

                      <button
                        onClick={() => {
                          setPeriodoToEdit(p);
                          setShowForm(true);
                        }}
                        className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition"
                      >
                        <Edit className="w-5 h-5" />
                      </button>

                      {p.estatus === "ACTIVO" ? (
                        <button
                          onClick={() => setPeriodoToDelete(p)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setPeriodoToDelete(p)}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        >
                          <UserCheck className="w-5 h-5" />
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))
            )}

          </tbody>
        </table>

        {/* Paginación */}
        {!isLoading && filteredPeriodos.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 border-t flex justify-between items-center">

            <p className="text-sm text-slate-500">
              Página <span className="font-bold">{currentPage}</span> de{" "}
              <span className="font-bold">{totalPages}</span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-2 border rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="p-2 border rounded-lg hover:bg-slate-100"
              >
                <ChevronRight />
              </button>
            </div>

          </div>
        )}
      </div>

      {periodoToDelete && (
        <PeriodosDelete
          periodo={periodoToDelete}
          onClose={() => setPeriodoToDelete(null)}
          onSuccess={() => {
            setPeriodoToDelete(null);
            fetchPeriodos();
          }}
        />
      )}
    </div>
  );
};