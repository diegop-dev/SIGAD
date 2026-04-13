import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, Loader2, Edit, Trash2, ChevronLeft, ChevronRight, Hash, Layers, X, AlertTriangle, Ban, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CarreraForm } from './CarreraForm';
import { useAuth } from '../../hooks/useAuth';
import { TOAST_CARRERAS, TOAST_COMMON } from '../../../constants/toastMessages';

export const CarreraManagement = () => {
  const { user } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [carreras, setCarreras] = useState([]);
  const [academiasLista, setAcademiasLista] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [carreraAEditar, setCarreraAEditar] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carreraToDelete, setCarreraToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');
  
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [carreraToActivate, setCarreraToActivate] = useState(null);
  const [isActivating, setIsActivating] = useState(false);

  const [serverAction, setServerAction] = useState(null);
  const [serverMessage, setServerMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [academiaFilter, setAcademiaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCarreras = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/carreras');
      const data = response.data.data || response.data;
      setCarreras(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar programas:", error);
      toast.error(TOAST_CARRERAS.errorCarga);
      setCarreras([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAcademiasFiltro = async () => {
    try {
      const response = await api.get('/academias');
      setAcademiasLista(response.data || []);
    } catch (error) {
      console.error("Error al cargar academias para el filtro:", error);
    }
  };

  useEffect(() => {
    fetchCarreras();
    fetchAcademiasFiltro();
  }, []);

  const filteredCarreras = useMemo(() => {
    return carreras.filter(carrera => {
      const busqueda = searchTerm.toLowerCase();
      const nombreCarrera = carrera.nombre_carrera?.toLowerCase() || '';
      const codigoCarrera = carrera.codigo_unico?.toLowerCase() || '';

      const coincideBusqueda = nombreCarrera.includes(busqueda) || codigoCarrera.includes(busqueda);
      const coincideAcademia = academiaFilter ? carrera.nombre_academia === academiaFilter : true;
      const coincideEstatus = statusFilter ? carrera.estatus === statusFilter : true;
      const coincideNivel = nivelFilter ? carrera.nivel_academico === nivelFilter : true;

      return coincideBusqueda && coincideAcademia && coincideEstatus && coincideNivel;
    });
  }, [carreras, searchTerm, academiaFilter, statusFilter, nivelFilter]);

  const totalPages = Math.ceil(filteredCarreras.length / itemsPerPage) || 1;
  const paginatedCarreras = filteredCarreras.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, academiaFilter, statusFilter, nivelFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setCarreraAEditar(null);
    fetchCarreras();
  };

  const handleNuevaCarrera = () => {
    setCarreraAEditar(null);
    setShowForm(true);
  };

  const handleEditarCarrera = (carrera) => {
    setCarreraAEditar(carrera);
    setShowForm(true);
  };

  const handleEliminarRapido = (carrera) => {
    setCarreraToDelete(carrera);
    setMotivoBaja('');
    setServerAction(null);
    setServerMessage('');
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setServerAction(null);
    setServerMessage('');
  };

  const confirmDelete = async () => {
    if (!motivoBaja.trim()) {
      toast.error("El motivo de la baja es obligatorio.");
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Actualizando estatus...");

    try {
      await api.patch(`/carreras/${carreraToDelete.id_carrera}/desactivar`, {
        eliminado_por: user?.id_usuario,
        motivo_baja: motivoBaja
      });
      
      toast.success("Estatus actualizado correctamente", { id: toastId });
      handleCloseDeleteModal();
      fetchCarreras(); 
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};

      if (status === 409 && data.action === "BLOCK") {
        setServerAction("BLOCK");
        const detalles = data.detalles || "Conflicto de integridad referencial.";
        setServerMessage(detalles);
        toast.error("Operación denegada por reglas de integridad", { id: toastId, duration: 8000 });
      } else {
        const msg = data.message || data.error || "Error al actualizar el estatus";
        toast.error(msg, { id: toastId });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleActivarRapido = (carrera) => {
    setCarreraToActivate(carrera);
    setShowActivateModal(true);
  };

  const handleCloseActivateModal = () => {
    setShowActivateModal(false);
    setCarreraToActivate(null);
  };

  const confirmActivate = async () => {
    setIsActivating(true);
    const toastId = toast.loading("Reactivando programa...");

    try {
      await api.patch(`/carreras/${carreraToActivate.id_carrera}/activar`, {
        modificado_por: user?.id_usuario
      });
      
      toast.success("Programa reactivado correctamente", { id: toastId });
      handleCloseActivateModal();
      fetchCarreras(); 
    } catch (error) {
      const data = error.response?.data || {};
      const msg = data.message || data.error || "Error al reactivar el programa";
      toast.error(msg, { id: toastId });
    } finally {
      setIsActivating(false);
    }
  };

  if (showForm) {
    return (
      <CarreraForm 
        onBack={() => {
          setShowForm(false);
          setCarreraAEditar(null);
        }} 
        onSuccess={handleSuccessAction} 
        initialData={carreraAEditar}
      />
    );
  }

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 px-4 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <BookOpen className="w-7 h-7 mr-3 text-white/90" />
            Gestión de programas académicos
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">Administra el catálogo de carreras y maestrías de la institución.</p>
        </div>
        <button 
          onClick={handleNuevaCarrera} 
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo programa
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o código del programa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <div className="relative flex items-center w-full sm:w-auto min-w-[140px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={nivelFilter}
              onChange={(e) => setNivelFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Nivel: Todos</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="MAESTRIA">Maestría</option>
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[200px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={academiaFilter}
              onChange={(e) => setAcademiaFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todas las academias</option>
              {academiasLista.map(academia => (
                <option key={academia.id_academia} value={academia.nombre}>
                  {academia.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center w-full sm:w-auto min-w-[160px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los estatus</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Código</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Programa</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Modalidad</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Academia</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Estatus</th>
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
              ) : paginatedCarreras.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">No se encontraron programas con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCarreras.map((carrera) => (
                  <tr key={carrera.id_carrera} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-black text-[#0B1828]">
                          <Hash className="w-4 h-4 mr-1 text-slate-400" />
                          {carrera.codigo_unico || 'N/A'}
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${carrera.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                            {carrera.nivel_academico || 'LICENCIATURA'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[400px] whitespace-normal align-middle">
                      <div className="text-sm font-bold text-[#0B1828] leading-relaxed break-words">
                        {carrera.nombre_carrera}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg w-fit">
                        <Layers className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {carrera.modalidad || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-[#0B1828] bg-slate-100 px-3 py-1.5 rounded-lg">
                        {carrera.nombre_academia || 'Sin asignar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${
                        carrera.estatus === 'ACTIVO' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {carrera.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          title="Editar programa" 
                          onClick={() => handleEditarCarrera(carrera)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-95"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        {carrera.estatus === 'ACTIVO' ? (
                          <button 
                            title="Dar de baja" 
                            onClick={() => handleEliminarRapido(carrera)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            title="Reactivar programa" 
                            onClick={() => handleActivarRapido(carrera)}
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

        {!isLoading && filteredCarreras.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredCarreras.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{filteredCarreras.length}</span> registros
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

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            
            <div className={`flex justify-between items-center px-6 py-5 border-b ${serverAction === 'BLOCK' ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
               <div className={`flex items-center ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
                 {serverAction === 'BLOCK' ? <Ban className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
                 <h3 className="text-lg font-black tracking-tight">
                   {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar cambio de estatus'}
                 </h3>
               </div>
               <button onClick={handleCloseDeleteModal} disabled={isDeleting} className="text-slate-400 hover:text-[#0B1828] hover:bg-slate-200 p-2 rounded-xl transition-colors active:scale-95">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-sm text-slate-600 font-medium mb-4">
                ¿Estás seguro que deseas dar de baja el programa <span className="font-bold text-[#0B1828]">{carreraToDelete?.nombre_carrera}</span>?
              </p>
              
              {serverAction === 'BLOCK' ? (
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mb-2 shadow-sm">
                  <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
                  <p className="text-xs text-amber-700 font-medium">
                    Dirígete a la sección de asignaciones para liberar la carga académica vinculada a este programa antes de intentar darle de baja.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-2">
                  <label className="text-sm font-bold text-[#0B1828]">Motivo de la baja <span className="text-[#0B1828] ml-1">*</span></label>
                  <textarea
                    value={motivoBaja}
                    onChange={(e) => setMotivoBaja(e.target.value)}
                    placeholder="Escribe el motivo..."
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm focus:ring-1 focus:border-[#0B1828] focus:ring-[#0B1828] transition-all resize-none h-24 shadow-sm outline-none"
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] transition-all shadow-sm active:scale-95"
              >
                {serverAction === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
              </button>

              {serverAction !== 'BLOCK' && (
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting || !motivoBaja.trim()}
                  className="flex items-center px-6 py-3 rounded-xl text-sm font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all shadow-md hover:shadow-red-600/30 active:scale-95"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Confirmar baja
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-emerald-100 bg-emerald-50">
               <div className="flex items-center text-emerald-600">
                 <RefreshCw className="w-5 h-5 mr-2" />
                 <h3 className="text-lg font-black tracking-tight">Confirmar reactivación</h3>
               </div>
               <button onClick={handleCloseActivateModal} disabled={isActivating} className="text-slate-400 hover:text-[#0B1828] hover:bg-slate-200 p-2 rounded-xl transition-colors active:scale-95">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6 md:p-8">
              <p className="text-sm text-slate-600 font-medium">
                ¿Estás seguro que deseas reactivar el programa <span className="font-bold text-[#0B1828]">{carreraToActivate?.nombre_carrera}</span>? Volverá a estar disponible en los procesos académicos.
              </p>
            </div>

            <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={handleCloseActivateModal}
                disabled={isActivating}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] transition-all shadow-sm active:scale-95"
              >
                Cancelar
              </button>

              <button
                onClick={confirmActivate}
                disabled={isActivating}
                className="flex items-center px-6 py-3 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md hover:shadow-emerald-600/30 active:scale-95"
              >
                {isActivating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Confirmar reactivación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};