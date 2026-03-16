  import { useState, useEffect, useMemo } from "react";
  import {
    Plus,
    Search,
    Filter,
    Loader2,
    Eye,
    Edit,
    Trash2,
    ChevronLeft,
    ChevronRight,
    CalendarDays,
    UserCheck,
    Hash,
    Layers,
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
      } catch (error) {
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
        const coincideBusqueda =
          p.codigo?.toLowerCase().includes(busqueda) ||
          p.anio?.toString().includes(busqueda);

        const coincideYear = filterYear
          ? p.anio.toString() === filterYear
          : true;

        const coincideStatus = filterStatus
          ? p.estatus === filterStatus
          : true;

        return coincideBusqueda && coincideYear && coincideStatus;
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

    const toggleStatus = async (periodo) => {

      try {

        await api.patch(`/periodos/${periodo.id_periodo}/estatus`);

        toast.success(
          periodo.estatus === "ACTIVO"
            ? "Periodo desactivado"
            : "Periodo activado"
        );

        fetchPeriodos();

      } catch (error) {

        const msg =
          error.response?.data?.mensaje ||
          "No se pudo cambiar el estatus";

        toast.error(msg);
      }
    };

    const uniqueYears = [...new Set(periodos.map((p) => p.anio))].sort(
      (a, b) => b - a
    );

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

        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow border">

          <h1 className="text-2xl font-black flex items-center">
            <CalendarDays className="mr-3 text-blue-600" />
            Gestión de periodos
          </h1>

          <button
            onClick={() => {
              setPeriodoToEdit(null);
              setShowForm(true);
            }}
            className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <Plus className="mr-2 w-5 h-5" />
            Nuevo periodo
          </button>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow border flex flex-wrap gap-4">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-3 text-slate-400 w-5 h-5" />

            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border rounded-xl py-2"
            />
          </div>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="">Todos los años</option>

            {uniqueYears.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-xl px-3 py-2"
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow border overflow-hidden">

          <table className="w-full">

            <thead className="bg-slate-50">

              <tr>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Inicio</th>
                <th className="p-3 text-left">Fin</th>
                <th className="p-3 text-left">Límite</th>
                <th className="p-3 text-left">Estatus</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>

            </thead>

            <tbody>

              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center">
                    <Loader2 className="animate-spin mx-auto" />
                  </td>
                </tr>
              ) : paginatedPeriodos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center">
                    Sin registros
                  </td>
                </tr>
              ) : (
                paginatedPeriodos.map((p) => (
                  <tr key={p.id_periodo} className="border-t">

                    <td className="p-3 font-bold">{p.codigo}</td>

                    <td className="p-3">{formatDate(p.fecha_inicio)}</td>

                    <td className="p-3">{formatDate(p.fecha_fin)}</td>

                    <td className="p-3">{formatDate(p.fecha_limite_calif)}</td>

                    <td className="p-3">

                      <button
                        onClick={() => toggleStatus(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          p.estatus === "ACTIVO"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {p.estatus}
                      </button>

                    </td>

                    <td className="p-3 text-center">

<div className="flex justify-center space-x-2">

<button
  onClick={() => {
    setPeriodoToEdit(p);
    setShowForm(true);
  }}
  className="p-2 hover:text-amber-600"
>
  <Edit className="w-5 h-5" />
</button>

{p.estatus === "ACTIVO" ? (

<button
  title="Desactivar periodo"
  onClick={() => setPeriodoToDelete(p)}
  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
>
  <Trash2 className="w-5 h-5" />
</button>

) : (

<button
  title="Reactivar periodo"
  onClick={async () => {

    const toastId = toast.loading("Reactivando...");

    try{

      await api.patch(`/periodos/${p.id_periodo}/toggle`);

      toast.success("Periodo reactivado",{id:toastId});

      fetchPeriodos();

    }catch{

      toast.error("Error reactivando",{id:toastId});

    }

  }}
  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
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

          <div className="flex justify-between p-4 border-t">

            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft />
            </button>

            <span>
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
            >
              <ChevronRight />
            </button>

          </div>
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