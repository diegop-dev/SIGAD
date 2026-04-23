import { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, Filter, Loader2, Eye, Edit, Trash2, 
  ChevronLeft, ChevronRight, BookOpen, Hash, Layers, 
  Calendar, RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

import { MateriasForm } from "./MateriasForm";
import { MateriasModal } from "./MateriasModal";
import { DesactivarMateriaModal } from "./DesactivarMateriasModal";
import { ReactivarMateriaModal } from "./ReactivarMateriasModal";

export const MateriasManagement = () => {
  const [materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCarrera, setFilterCarrera] = useState("");
  const [filterPeriodo, setFilterPeriodo] = useState("");
  const [filterNivel, setFilterNivel] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Estados para vistas y modales
  const [selectedMateria, setSelectedMateria] = useState(null);
  const [editingMateria, setEditingMateria] = useState(null);
  const [materiaToDesactivar, setMateriaToDesactivar] = useState(null);
  const [materiaToReactivar, setMateriaToReactivar] = useState(null);
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
      const coincideNivel = filterNivel ? m.nivel_academico === filterNivel : true;

      return coincideBusqueda && coincideTipo && coincideCarrera && coincidePeriodo && coincideNivel;
    });
  }, [materias, searchTerm, filterTipo, filterCarrera, filterPeriodo, filterNivel]);

  const totalPages = Math.ceil(filteredMaterias.length / itemsPerPage) || 1;
  const paginatedMaterias = filteredMaterias.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTipo, filterCarrera, filterPeriodo, filterNivel]);

  const handleSuccessAction = () => {
    setIsCreating(false);
    setEditingMateria(null);
    setMateriaToDesactivar(null);
    setMateriaToReactivar(null);
    fetchMaterias();
  };

  const tipoLabels = {
    TRONCO_COMUN: "Tronco común",
    OPTATIVA: "Optativa",
    OBLIGATORIA: "Obligatoria"
  };

  const tipoStyles = {
    TRONCO_COMUN: "bg-slate-100 text-[#0B1828] border-slate-200",
    OPTATIVA: "bg-purple-100 text-purple-800 border-purple-200",
    OBLIGATORIA: "bg-[#0B1828]/10 text-[#0B1828] border-[#0B1828]/20"
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

  const uniqueCarreras = [...new Map(materias.map(m => [m.carrera_id, m])).values()].filter(c => c.carrera_id != null);
  const uniquePeriodos = [...new Map(materias.map(m => [m.periodo_id, m])).values()].filter(p => p.periodo_id != null);

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 px-4 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <BookOpen className="w-7 h-7 mr-3 text-white/90" />
            Materias
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">Administra el catálogo de asignaturas del plan de estudios.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva materia
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por código único o nombre de la materia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <div className="relative flex items-center w-full sm:w-auto min-w-[140px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterNivel}
              onChange={(e) => setFilterNivel(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Nivel: Todos</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="MAESTRIA">Maestría</option>
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[160px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Tipo: Todos</option>
              <option value="TRONCO_COMUN">Tronco común</option>
              <option value="OPTATIVA">Optativa</option>
              <option value="OBLIGATORIA">Obligatoria</option>
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[150px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterCarrera}
              onChange={(e) => setFilterCarrera(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Carrera: Todas</option>
              {uniqueCarreras.map(m => {
                const partesCodigo = m.codigo_unico ? m.codigo_unico.split('-') : [];
                const codigoCarreraStr = partesCodigo.length >= 3 ? `${partesCodigo[1]}-${partesCodigo[2].charAt(0)}` : `ID: ${m.carrera_id}`;
                return (
                  <option key={m.carrera_id} value={m.carrera_id}>
                    {codigoCarreraStr}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[160px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filterPeriodo}
              onChange={(e) => setFilterPeriodo(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Periodo: Todos</option>
              {uniquePeriodos.map(m => (
                <option key={m.periodo_id} value={m.periodo_id}>
                  {m.periodo_codigo || `Periodo ${m.periodo_id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Materia</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Ubicación curricular</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Clasificación</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Créditos/Cupo</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Consultando catálogo...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedMaterias.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">No se encontraron materias con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMaterias.map((m) => (
                  <tr key={m.id_materia} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 min-w-[250px] max-w-[350px] whitespace-normal align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-[#0B1828] break-words leading-snug">
                          {m.nombre}
                        </span>
                        <div className="flex items-center mt-1 text-xs font-bold text-slate-500">
                          <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {m.codigo_unico}
                        </div>
                        <div className="mt-1.5 flex items-center">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${m.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {m.nivel_academico || 'LICENCIATURA'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[350px] whitespace-normal align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 flex items-start break-words leading-snug">
                          {m.nombre_carrera || 'Tronco común'}
                        </span>
                        <span className="text-xs text-slate-500 mt-2 flex items-center font-medium">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {m.periodo_codigo || `Periodo ${m.periodo_id}`} • {m.cuatrimestre_nombre || `Cuatri ${m.cuatrimestre_id}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${tipoStyles[m.tipo_asignatura] || tipoStyles.TRONCO_COMUN}`}>
                        {tipoLabels[m.tipo_asignatura] || m.tipo_asignatura}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-[#0B1828]">
                        {m.creditos} <span className="text-slate-400 font-medium mx-1">CR</span>
                        <span className="text-slate-200 mx-2">|</span>
                        {m.cupo_maximo} <span className="text-slate-400 font-medium mx-1">MAX</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {m.estatus === "ACTIVO" ? (
                        <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 text-xs font-black rounded-lg bg-red-100 text-red-800 border border-red-200">
                          INACTIVO
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          title="Ver detalles"
                          onClick={() => setSelectedMateria(m)}
                          className="p-2 text-slate-400 hover:text-[#0B1828] hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          title={m.estatus === 'INACTIVO' ? "No se puede editar una materia inactiva" : "Editar materia"}
                          onClick={() => setEditingMateria(m)}
                          disabled={m.estatus === 'INACTIVO'}
                          className={`p-2 rounded-xl transition-all ${
                            m.estatus === 'INACTIVO'
                              ? 'text-slate-200 cursor-not-allowed'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:scale-95'
                          }`}
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        {m.estatus === "ACTIVO" ? (
                          <button
                            title="Desactivar materia"
                            onClick={() => setMateriaToDesactivar(m)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            title="Reactivar materia"
                            onClick={() => setMateriaToReactivar(m)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
                          >
                            <RefreshCw className="w-5 h-5" />
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

        {!isLoading && filteredMaterias.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredMaterias.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{filteredMaterias.length}</span> registros
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] hover:border-[#0B1828]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-xl bg-white border border-slate-200 text-sm font-black text-[#0B1828] shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-[#0B1828] hover:border-[#0B1828]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedMateria && (
        <MateriasModal
          materia={selectedMateria}
          onClose={() => setSelectedMateria(null)}
        />
      )}

      {/* MODALES SEPARADOS */}
      <DesactivarMateriaModal
        materia={materiaToDesactivar}
        onClose={() => setMateriaToDesactivar(null)}
        onSuccess={handleSuccessAction}
      />

      <ReactivarMateriaModal
        materia={materiaToReactivar}
        onClose={() => setMateriaToReactivar(null)}
        onSuccess={handleSuccessAction}
      />
    </div>
  );
};