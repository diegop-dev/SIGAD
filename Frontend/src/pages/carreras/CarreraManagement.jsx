import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, Loader2, Edit, Trash2, ChevronLeft, ChevronRight, Hash, Layers, X, AlertTriangle, Ban } from 'lucide-react';
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

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCarrera, setSelectedCarrera] = useState(null);
  const [actionType, setActionType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');
  
  // ESTADOS PARA INTERCEPTAR INTEGRIDAD RELACIONAL
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
      console.error("Error al cargar academias:", error);
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
  const paginatedCarreras = filteredCarreras.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, academiaFilter, statusFilter, nivelFilter]);

  const handleNuevaCarrera = () => {
    setCarreraAEditar(null);
    setShowForm(true);
  };

  const handleEditarCarrera = (carrera) => {
    setCarreraAEditar(carrera);
    setShowForm(true);
  };

  // FUNCIONES PARA ELIMINAR 
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

    setIsProcessing(true);
    const toastId = toast.loading("Actualizando estatus...");

    try {
      if (actionType === 'deactivate') {
        await api.patch(`/carreras/${selectedCarrera.id_carrera}/deactivate`, {
          eliminado_por: user?.id_usuario,
          motivo_baja: motivoBaja
        });
      } else {
        await api.patch(`/carreras/${selectedCarrera.id_carrera}/activate`, {
          modificado_por: user?.id_usuario
        });
      }
      
      toast.success("Estatus actualizado correctamente", { id: toastId });
      handleCloseDeleteModal();
      fetchCarreras(); 
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};

      // Intercepción del bloqueo por integridad relacional de la HU
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
      setIsProcessing(false);
    }
  };

  if (showForm) {
    return (
      <CarreraForm 
        onBack={() => { setShowForm(false); setCarreraAEditar(null); }} 
        onSuccess={() => { setShowForm(false); setCarreraAEditar(null); fetchCarreras(); }} 
        initialData={carreraAEditar}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de programas académicos
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra el catálogo de carreras y maestrías de la institución.</p>
        </div>
        <button 
          onClick={handleNuevaCarrera} 
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo programa
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o código del programa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          <select
            value={nivelFilter}
            onChange={(e) => setNivelFilter(e.target.value)}
            className="block w-full sm:w-auto min-w-[140px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Nivel: Todos</option>
            <option value="LICENCIATURA">Licenciatura</option>
            <option value="MAESTRIA">Maestría</option>
          </select>

          <div className="relative flex items-center w-full sm:w-auto min-w-[200px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select value={academiaFilter} onChange={(e) => setAcademiaFilter(e.target.value)} className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all appearance-none cursor-pointer">
              <option value="">Todas las academias</option>
              {academiasLista.map(a => <option key={a.id_academia} value={a.nombre}>{a.nombre}</option>)}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full sm:w-auto min-w-[160px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Todos los estatus</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Programa</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Modalidad</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Academia</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" /></td></tr>
              ) : paginatedCarreras.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">No se encontraron programas con los filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCarreras.map((carrera) => (
                  <tr key={carrera.id_carrera} className={`transition-colors duration-150 ${carrera.estatus === 'INACTIVO' ? 'bg-slate-50/50' : 'hover:bg-blue-50/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-bold text-slate-700">
                          <Hash className="w-4 h-4 mr-1 text-slate-400" />
                          {carrera.codigo_unico || 'N/A'}
                        </div>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${carrera.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {carrera.nivel_academico || 'LICENCIATURA'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[400px] whitespace-normal align-middle">
                      <div className={`text-sm font-bold leading-relaxed break-words ${carrera.estatus === 'INACTIVO' ? 'text-slate-500' : 'text-slate-900'}`}>
                        {carrera.nombre_carrera}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-slate-600">
                        <Layers className="w-4 h-4 mr-1 text-slate-400" />
                        {carrera.modalidad || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                        {carrera.nombre_academia || 'Sin asignar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${
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
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        {carrera.estatus === 'ACTIVO' ? (
                          <button 
                            title="Dar de baja" 
                            onClick={() => handleToggleStatus(carrera, 'deactivate')} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            title="Reactivar programa" 
                            onClick={() => handleToggleStatus(carrera, 'activate')} 
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          >
                            <RefreshCcw className="w-5 h-5" />
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
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredCarreras.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredCarreras.length}</span> registros
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center px-4 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-700 shadow-sm">
                {currentPage} / {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 transition-all shadow-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BAJA O BLOQUEO DE INTEGRIDAD */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden border border-slate-100">
            
            <div className={`flex justify-between items-center px-6 py-5 border-b ${serverAction === 'BLOCK' ? 'border-amber-100 bg-amber-50' : 'border-red-100 bg-red-50'}`}>
               <div className={`flex items-center ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
                 {serverAction === 'BLOCK' ? <Ban className="w-5 h-5 mr-2" /> : <AlertTriangle className="w-5 h-5 mr-2" />}
                 <h3 className="text-lg font-black tracking-tight">
                   {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar cambio de estatus'}
                 </h3>
               </div>
               <button onClick={handleCloseDeleteModal} disabled={isDeleting} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                {actionType === 'deactivate' 
                  ? <>¿Estás seguro que deseas dar de baja el programa <span className="font-bold text-slate-900">{selectedCarrera?.nombre_carrera}</span>?</>
                  : <>¿Deseas volver a activar el programa <span className="font-bold text-slate-900">{selectedCarrera?.nombre_carrera}</span> en el sistema?</>
                }
              </p>
              
              {serverAction === 'BLOCK' ? (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-6">
                  <p className="text-sm text-amber-900 font-bold mb-2">{serverMessage}</p>
                  <p className="text-xs text-amber-700 font-medium">
                    Dirígete a la sección de asignaciones para liberar la carga académica vinculada a este programa antes de intentar darle de baja.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-bold text-slate-700">Motivo de la baja *</label>
                  <textarea
                    value={motivoBaja}
                    onChange={(e) => setMotivoBaja(e.target.value)}
                    placeholder="Escribe el motivo..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-100 transition-all resize-none h-24"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {serverAction === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
                </button>

                {serverAction !== 'BLOCK' && (
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting || !motivoBaja.trim()}
                    className="flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                    Confirmar baja
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};