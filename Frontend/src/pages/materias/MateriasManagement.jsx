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
  BookOpen, 
  Hash, 
  Layers, 
  Calendar, 
  UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

import { MateriasForm } from "./MateriasForm";
import { MateriasModal } from "./MateriasModal";
import { MateriasDelete } from "./MateriasDelete.jsx";

export const MateriasManagement = () => {
  const [materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCarrera, setFilterCarrera] = useState("");
  const [filterPeriodo, setFilterPeriodo] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedMateria, setSelectedMateria] = useState(null);
  const [editingMateria, setEditingMateria] = useState(null);
  const [deletingMateria, setDeletingMateria] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const fetchMaterias = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/materias");
      const data = res.data.data || res.data;
      setMaterias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar materias:", error);
      toast.error("Error al cargar el listado de materias");
      setMaterias([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const filteredMaterias = useMemo(() => {
    return materias.filter(m => {
      const busqueda = searchTerm.toLowerCase();
      const codigo = m.codigo_unico?.toLowerCase() || '';
      const nombre = m.nombre?.toLowerCase() || '';

      const coincideBusqueda = codigo.includes(busqueda) || nombre.includes(busqueda);
      const coincideTipo = filterTipo ? m.tipo_asignatura === filterTipo : true;
      const coincideCarrera = filterCarrera ? String(m.carrera_id) === filterCarrera : true;
      const coincidePeriodo = filterPeriodo ? String(m.periodo_id) === filterPeriodo : true;

      return coincideBusqueda && coincideTipo && coincideCarrera && coincidePeriodo;
    });
  }, [materias, searchTerm, filterTipo, filterCarrera, filterPeriodo]);

  const totalPages = Math.ceil(filteredMaterias.length / itemsPerPage) || 1;
  const paginatedMaterias = filteredMaterias.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Regresar a la página 1 si cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTipo, filterCarrera, filterPeriodo]);

  const handleSuccessAction = () => {
    setIsCreating(false);
    setEditingMateria(null);
    fetchMaterias();
  };

  const tipoLabels = {
    TRONCO_COMUN: "Tronco común",
    OPTATIVA: "Optativa",
    OBLIGATORIA: "Obligatoria"
  };

  const tipoStyles = {
    TRONCO_COMUN: "bg-slate-100 text-slate-800 border-slate-200",
    OPTATIVA: "bg-purple-100 text-purple-800 border-purple-200",
    OBLIGATORIA: "bg-emerald-100 text-emerald-800 border-emerald-200"
  };

  if (isCreating || editingMateria) {
    return (
      <MateriasForm
        initialData={editingMateria}
        onBack={() => {
          setIsCreating(false);
          setEditingMateria(null);
        }}
        onSuccess={handleSuccessAction}
      />
    );
  }

  // Extracción dinámica de catálogos únicos para los filtros basados en la data actual
  const uniqueCarreras = [...new Map(materias.map(m => [m.carrera_id, m])).values()];
  const uniquePeriodos = [...new Map(materias.map(m => [m.periodo_id, m])).values()];

  return (
    <div className="space-y-6">
      
      {/* Encabezado estandarizado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de materias
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra el catálogo de asignaturas del plan de estudios.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva materia
        </button>
      </div>

      {/* Barra de filtros avanzados */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código único o nombre de la materia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[160px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todos los tipos</option>
              <option value="TRONCO_COMUN">Tronco común</option>
              <option value="OPTATIVA">Optativa</option>
              <option value="OBLIGATORIA">Obligatoria</option>
            </select>
          </div>

          <select
            value={filterCarrera}
            onChange={(e) => setFilterCarrera(e.target.value)}
            className="block w-full min-w-[180px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Todas las carreras</option>
            {uniqueCarreras.map(m => (
              <option key={m.carrera_id} value={m.carrera_id}>
                {m.nombre_carrera || `Carrera ${m.carrera_id}`}
              </option>
            ))}
          </select>

          <select
            value={filterPeriodo}
            onChange={(e) => setFilterPeriodo(e.target.value)}
            className="block w-full min-w-[160px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Todos los periodos</option>
            {uniquePeriodos.map(m => (
              <option key={m.periodo_id} value={m.periodo_id}>
                {m.periodo_codigo || `Periodo ${m.periodo_id}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de datos */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Materia</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación curricular</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Clasificación</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Créditos/Cupo</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando catálogo...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedMaterias.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">No se encontraron materias con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMaterias.map((m) => (
                  <tr key={m.id_materia} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 truncate max-w-[250px]" title={m.nombre}>
                          {m.nombre}
                        </span>
                        <div className="flex items-center mt-1 text-xs font-medium text-slate-500">
                          <Hash className="w-3 h-3 mr-1" />
                          {m.codigo_unico}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700 flex items-center truncate max-w-[200px]" title={m.nombre_carrera}>
                          <Layers className="w-3 h-3 mr-1 text-slate-400" />
                          {m.nombre_carrera || `Carrera ${m.carrera_id}`}
                        </span>
                        <span className="text-xs text-slate-500 mt-1 flex items-center">
                          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                          {m.periodo_codigo || `Periodo ${m.periodo_id}`} • {m.cuatrimestre_nombre || `Cuatri ${m.cuatrimestre_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${tipoStyles[m.tipo_asignatura] || tipoStyles.TRONCO_COMUN}`}>
                        {tipoLabels[m.tipo_asignatura] || m.tipo_asignatura}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-slate-700">
                        {m.creditos} <span className="text-slate-400 font-normal mx-1">CR</span>
                        <span className="text-slate-300 mx-2">|</span>
                        {m.cupo_maximo} <span className="text-slate-400 font-normal mx-1">MAX</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
  {m.estatus === "ACTIVO" ? (
    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-100 text-emerald-800">
      ACTIVO
    </span>
  ) : (
    <span className="px-3 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-800">
      INACTIVO
    </span>
  )}
</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          title="Ver detalles"
                          onClick={() => setSelectedMateria(m)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          title="Editar materia"
                          onClick={() => setEditingMateria(m)}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                       {m.estatus === "ACTIVO" ? (

<button
  title="Desactivar materia"
  onClick={() => setDeletingMateria(m)}
  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
>
  <Trash2 className="w-5 h-5" />
</button>

) : (

<button
  title="Reactivar materia"
  onClick={async () => {

    const toastId = toast.loading("Reactivando...");

    try{

      await api.patch(`/materias/${m.id_materia}/toggle`);

      toast.success("Materia reactivada",{id:toastId});

      fetchMaterias();

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
        </div>

        {/* Paginación estandarizada */}
        {!isLoading && filteredMaterias.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredMaterias.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredMaterias.length}</span> registros
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {selectedMateria && (
        <MateriasModal
          materia={selectedMateria}
          onClose={() => setSelectedMateria(null)}
          onEdit={(m) => {
            setSelectedMateria(null);
            setEditingMateria(m);
          }}
          onDelete={(m) => {
            setSelectedMateria(null);
            setDeletingMateria(m);
          }}
        />
      )}

      {deletingMateria && (
        <MateriasDelete
          materia={deletingMateria}
          onClose={() => setDeletingMateria(null)}
          onSuccess={() => {
            setDeletingMateria(null);
            fetchMaterias();
          }}
        />
      )}
    </div>
  );
};