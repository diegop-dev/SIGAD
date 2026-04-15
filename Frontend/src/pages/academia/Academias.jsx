import { useEffect, useState, useMemo } from 'react';
import { Search, Pencil, Trash2, Plus, X, Filter, Loader2, BookOpen, UserCheck, Ban, ChevronLeft, ChevronRight, AlertTriangle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const Academias = ({ onNueva, onEditar }) => {
  const [academias, setAcademias] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [cargando, setCargando] = useState(true);

  // Estados para modales de reglas de negocio, confirmación y carga de acción
  const [academiaToToggle, setAcademiaToToggle] = useState(null);
  const [modalBloqueoEstatus, setModalBloqueoEstatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarAcademias();
  }, []);

  const cargarAcademias = async () => {
    try {
      setCargando(true);
      const res = await api.get('/academias');
      setAcademias(res.data);
    } catch {
      toast.error('Error al cargar academias');
    } finally {
      setCargando(false);
    }
  };

  const confirmToggleEstatus = async (academia) => {
    setIsSubmitting(true);
    const nuevoEstatus = academia.estatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    const toastId = toast.loading(`Cambiando estatus a ${nuevoEstatus}...`);
    
    try {
      await api.patch(`/academias/${academia.id_academia}/estatus`, { estatus: nuevoEstatus });
      toast.success(`Estatus cambiado a ${nuevoEstatus}`, { id: toastId });
      setAcademiaToToggle(null);
      cargarAcademias();
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};

      toast.dismiss(toastId);
      setAcademiaToToggle(null);

      if (status === 409 && data.action === "BLOCK") {
        setModalBloqueoEstatus({
          mensaje: data.detalles || "No se puede desactivar la academia debido a dependencias activas."
        });
      } else {
        toast.error(data.error || 'Error de conexión al cambiar el estatus');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const academiasFiltradas = useMemo(() => {
    return academias.filter(a =>
      a.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
      (filtroEstatus === '' || a.estatus === filtroEstatus)
    );
  }, [academias, busqueda, filtroEstatus]);

  // Lógica de Paginación
  const totalPages = Math.ceil(academiasFiltradas.length / itemsPerPage) || 1;
  const paginatedAcademias = academiasFiltradas.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [busqueda, filtroEstatus]);

  // Helper para construir la URL de foto de perfil (igual que UserManagement)
  const getFotoUrl = (fotoPath) => {
    if (!fotoPath) return null;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${fotoPath}`;
  };

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <BookOpen className="w-7 h-7 mr-3 text-white/90" />
            Academias
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Administra las academias y sus coordinadores.
          </p>
        </div>
        <button
          onClick={onNueva}
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nueva academia
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre de academia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[200px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los estatus</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Academia</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Coordinador</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Fecha de registro</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Consultando la base de datos de academias...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedAcademias.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">No se encontraron resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">
                        No hay academias registradas que coincidan con los filtros de búsqueda actuales.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAcademias.map(a => (
                  <tr key={a.id_academia} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-sm font-black text-[#0B1828]">{a.nombre}</span>
                      </div>
                    </td>

                    {/* ── Celda Coordinador con foto condicional ── */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center mr-4 text-slate-400 overflow-hidden shrink-0">
                          {a.coordinador_foto_perfil_url ? (
                            <img
                              src={getFotoUrl(a.coordinador_foto_perfil_url)}
                              alt={a.coordinador_nombre || 'Coordinador'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserCheck className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0B1828]">
                            {a.coordinador_nombre || 'Sin asignar'}
                          </span>
                          <span className="text-xs font-bold text-slate-500 flex items-center mt-0.5">
                            <Shield className="w-3 h-3 mr-1.5 text-slate-400" />
                            Coordinador asignado
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                      {a.fecha_creacion}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${
                        a.estatus === 'ACTIVO'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {a.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          title={a.estatus === 'ACTIVO' ? "Editar academia" : "No se puede editar una academia inactiva"}
                          onClick={() => a.estatus === 'ACTIVO' && onEditar(a)}
                          disabled={a.estatus === 'INACTIVO'}
                          className={`p-2 rounded-xl transition-all active:scale-95 ${
                            a.estatus === 'ACTIVO' 
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                              : 'text-slate-300 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <Pencil className="w-5 h-5" />
                        </button>

                        {a.estatus === 'ACTIVO' ? (
                          <button
                            title="Desactivar academia"
                            onClick={() => setAcademiaToToggle(a)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            title="Activar academia"
                            onClick={() => setAcademiaToToggle(a)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
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

        {/* Paginación */}
        {!cargando && academiasFiltradas.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, academiasFiltradas.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{academiasFiltradas.length}</span> registros
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

      {/* Modal Estandarizado de Confirmación de Baja / Alta */}
      {academiaToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Cabecera del modal */}
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <div className="flex items-center text-white">
                <AlertTriangle className="w-6 h-6 mr-3 text-white" />
                <h3 className="text-xl font-black tracking-tight">
                  {academiaToToggle.estatus === 'ACTIVO' ? 'Desactivar academia' : 'Activar academia'}
                </h3>
              </div>
              <button 
                onClick={() => setAcademiaToToggle(null)} 
                disabled={isSubmitting}
                className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95 disabled:opacity-50"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Cuerpo del modal */}
            <div className="p-8 overflow-y-auto flex-1">
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                A continuación, se visualizan los detalles de la academia cuyo estatus estás a punto de modificar:
              </p>

              <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-20 w-20 rounded-full bg-white border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
                  <BookOpen className="h-10 w-10 text-slate-300" />
                </div>
                <div className="pt-1">
                  <h4 className="text-xl font-black text-[#0B1828] leading-tight">
                    {academiaToToggle.nombre}
                  </h4>

                  {/* ── Coordinador en el modal con foto condicional ── */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                    {academiaToToggle.coordinador_foto_perfil_url ? (
                      <img
                        src={getFotoUrl(academiaToToggle.coordinador_foto_perfil_url)}
                        alt={academiaToToggle.coordinador_nombre || 'Coordinador'}
                        className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="text-sm font-bold text-slate-500">
                      {academiaToToggle.coordinador_nombre || 'Sin coordinador asignado'}
                    </span>
                  </div>

                  <span className={`mt-3 inline-flex px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border shadow-sm ${
                    academiaToToggle.estatus === 'ACTIVO' 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {academiaToToggle.estatus}
                  </span>
                </div>
              </div>

              {academiaToToggle.estatus === 'ACTIVO' ? (
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
                  <p className="text-sm text-red-800 font-medium">
                    <strong className="font-black">Aviso de seguridad:</strong> El estatus de la academia cambiará a <span className="font-black">INACTIVO</span>. Al dar de baja esta academia, no podrá ser modificada ni utilizada en futuras asignaciones del sistema.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                  <p className="text-sm text-emerald-800 font-medium">
                    <strong className="font-black">Aviso:</strong> El estatus de la academia cambiará a <span className="font-black">ACTIVO</span>. Volverá a estar disponible para modificaciones y nuevas asignaciones en el sistema.
                  </p>
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setAcademiaToToggle(null)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-700 hover:bg-slate-100 shadow-sm transition-all active:scale-95 disabled:opacity-50 hidden sm:block"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmToggleEstatus(academiaToToggle)}
                disabled={isSubmitting}
                className={`flex items-center justify-center px-6 py-3 text-sm font-black text-white shadow-md rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto ${
                  academiaToToggle.estatus === 'ACTIVO' 
                    ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-200 focus:ring-2 focus:ring-red-200' 
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200 focus:ring-2 focus:ring-emerald-200'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    {academiaToToggle.estatus === 'ACTIVO' ? (
                      <Trash2 className="w-5 h-5 mr-2" />
                    ) : (
                      <UserCheck className="w-5 h-5 mr-2" />
                    )}
                    Confirmar {academiaToToggle.estatus === 'ACTIVO' ? 'baja' : 'activación'}
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Estandarizado para Bloqueo de Estatus */}
      {modalBloqueoEstatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <div className="flex items-center text-amber-400">
                <Ban className="w-6 h-6 mr-3 text-amber-400" />
                <h3 className="text-xl font-black tracking-tight text-white">Acción bloqueada</h3>
              </div>
              <button 
                onClick={() => setModalBloqueoEstatus(null)} 
                className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-start gap-3">
                   <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                   <p className="text-sm text-amber-900 font-medium leading-relaxed">
                     {modalBloqueoEstatus.mensaje}
                   </p>
                </div>
              </div>
              <p className="text-sm text-slate-600 font-medium mt-6 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                <strong className="font-black text-[#0B1828]">Solución:</strong> Dirígete al módulo de Gestión de Asignaciones para liberar la carga académica vinculada antes de intentar dar de baja esta academia.
              </p>
            </div>
            
            <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setModalBloqueoEstatus(null)}
                className="flex items-center justify-center px-6 py-3 text-sm font-black text-white bg-[#0B1828] hover:bg-slate-800 shadow-md rounded-xl transition-all active:scale-95 w-full sm:w-auto"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};