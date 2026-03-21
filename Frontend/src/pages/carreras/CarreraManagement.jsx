import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, Loader2, Edit, Trash2, ChevronLeft, ChevronRight, Hash, Layers, RefreshCcw } from 'lucide-react';
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

  const [searchTerm, setSearchTerm] = useState('');
  const [academiaFilter, setAcademiaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchCarreras = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/carreras');
      const data = response.data.data || response.data;
      setCarreras(Array.isArray(data) ? data : []);
    } catch (error) {
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

      return coincideBusqueda && coincideAcademia && coincideEstatus;
    });
  }, [carreras, searchTerm, academiaFilter, statusFilter]);

  const totalPages = Math.ceil(filteredCarreras.length / itemsPerPage) || 1;
  const paginatedCarreras = filteredCarreras.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, academiaFilter, statusFilter]);

  const handleNuevaCarrera = () => {
    setCarreraAEditar(null);
    setShowForm(true);
  };

  const handleEditarCarrera = (carrera) => {
    setCarreraAEditar(carrera);
    setShowForm(true);
  };

  const handleToggleStatus = (carrera, type) => {
    setSelectedCarrera(carrera);
    setActionType(type);
    setMotivoBaja('');
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (actionType === 'deactivate' && !motivoBaja.trim()) {
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
      setShowStatusModal(false);
      fetchCarreras();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar el estatus", { id: toastId });
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
            Gestión de carreras
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra el catálogo de carreras de la institución.</p>
        </div>
        <button onClick={handleNuevaCarrera} className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold">
          <Plus className="w-5 h-5 mr-2" /> Nueva carrera
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input type="text" placeholder="Buscar por nombre o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all" />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[220px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select value={academiaFilter} onChange={(e) => setAcademiaFilter(e.target.value)} className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all appearance-none cursor-pointer">
              <option value="">Todas las academias</option>
              {academiasLista.map(a => <option key={a.id_academia} value={a.nombre}>{a.nombre}</option>)}
            </select>
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="block w-full min-w-[180px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all appearance-none cursor-pointer">
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
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Código</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Carrera</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Modalidad</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Academia</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" /></td></tr>
              ) : paginatedCarreras.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-16 text-center text-slate-500">No se encontraron resultados</td></tr>
              ) : (
                paginatedCarreras.map((carrera) => (
                  <tr key={carrera.id_carrera} className={`transition-colors duration-150 ${carrera.estatus === 'INACTIVO' ? 'bg-slate-50/50' : 'hover:bg-blue-50/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm font-bold text-slate-700"><Hash className="w-4 h-4 mr-1 text-slate-400" />{carrera.codigo_unico || 'N/A'}</div></td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[400px] whitespace-normal"><div className={`text-sm font-bold leading-relaxed break-words ${carrera.estatus === 'INACTIVO' ? 'text-slate-500' : 'text-slate-900'}`}>{carrera.nombre_carrera}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center text-sm font-medium text-slate-600"><Layers className="w-4 h-4 mr-1 text-slate-400" />{carrera.modalidad || 'N/A'}</div></td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">{carrera.nombre_academia || 'Sin asignar'}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase rounded-lg border ${
                        carrera.estatus === 'ACTIVO' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-red-100 text-red-800 border-red-200'
                      }`}>{carrera.estatus}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button title="Editar carrera" onClick={() => handleEditarCarrera(carrera)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all">
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        {/* LÓGICA DE BOTONES DINÁMICOS */}
                        {carrera.estatus === 'ACTIVO' ? (
                          <button title="Dar de baja" onClick={() => handleToggleStatus(carrera, 'deactivate')} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button title="Reactivar carrera" onClick={() => handleToggleStatus(carrera, 'activate')} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
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
      </div>

      {/* MODAL PARA BAJA O REACTIVACIÓN) */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {actionType === 'deactivate' ? 'Confirmar baja' : 'Confirmar reactivación'}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {actionType === 'deactivate' 
                  ? <>¿Estás seguro que deseas dar de baja la carrera <span className="font-bold text-slate-900">{selectedCarrera?.nombre_carrera}</span>?</>
                  : <>¿Deseas volver a activar la carrera <span className="font-bold text-slate-900">{selectedCarrera?.nombre_carrera}</span> en el sistema?</>
                }
              </p>
              
              {actionType === 'deactivate' && (
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-bold text-slate-700">Motivo de la baja *</label>
                  <textarea value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} placeholder="Escribe el motivo..." className="w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-red-100 transition-all resize-none h-24" />
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setShowStatusModal(false)} disabled={isProcessing} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">
                  Cancelar
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={isProcessing}
                  className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all ${
                    actionType === 'deactivate' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (actionType === 'deactivate' ? <Trash2 className="w-4 h-4 mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />)}
                  {actionType === 'deactivate' ? 'Confirmar baja' : 'Reactivar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};