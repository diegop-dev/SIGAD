import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, BookOpen, Loader2, Edit, Trash2, ChevronLeft, ChevronRight, Hash, Layers } from 'lucide-react';
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

  // ESTADOS PARA EL MODAL DE ELIMINAR
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [carreraToDelete, setCarreraToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [academiaFilter, setAcademiaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState(''); // <-- NUEVO ESTADO PARA NIVEL ACADÉMICO
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
      const coincideNivel = nivelFilter ? carrera.nivel_academico === nivelFilter : true; // <-- NUEVO FILTRO

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

  // FUNCIONES PARA ELIMINAR 
  const handleEliminarRapido = (carrera) => {
    setCarreraToDelete(carrera);
    setMotivoBaja(''); // Limpiar el motivo anterior
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!motivoBaja.trim()) {
      toast.error("El motivo de la baja es obligatorio.");
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Actualizando estatus...");

    try {
      await api.patch(`/carreras/${carreraToDelete.id_carrera}/deactivate`, {
        eliminado_por: user?.id_usuario,
        motivo_baja: motivoBaja
      });
      
      toast.success("Estatus actualizado correctamente", { id: toastId });
      setShowDeleteModal(false);
      fetchCarreras(); // Recargar la tabla
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar el estatus", { id: toastId });
    } finally {
      setIsDeleting(false);
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
        
        {/* CONTENEDOR DE SELECTORES CON FLEX-WRAP */}
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          
          {/* NUEVO FILTRO: NIVEL ACADÉMICO */}
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
            <select
              value={academiaFilter}
              onChange={(e) => setAcademiaFilter(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todas las academias</option>
              {academiasLista.map(academia => (
                <option key={academia.id_academia} value={academia.nombre}>
                  {academia.nombre}
                </option>
              ))}
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
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando catálogo...</p>
                    </div>
                  </td>
                </tr>
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
                  <tr key={carrera.id_carrera} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm font-bold text-slate-700">
                          <Hash className="w-4 h-4 mr-1 text-slate-400" />
                          {carrera.codigo_unico || 'N/A'}
                        </div>
                        {/* INSIGNIA DE NIVEL ACADÉMICO */}
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${carrera.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {carrera.nivel_academico || 'LICENCIATURA'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px] max-w-[400px] whitespace-normal align-middle">
                      <div className="text-sm font-bold text-slate-900 leading-relaxed break-words">
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
                          : carrera.estatus === 'INACTIVO'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
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
                        <button 
                          title="Cambiar estatus" 
                          onClick={() => handleEliminarRapido(carrera)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
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

      {/* MODAL DE CONFIRMACIÓN DE BAJA */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-black text-slate-900 mb-2">Confirmar cambio de estatus</h3>
              <p className="text-sm text-slate-600 mb-4">
                ¿Estás seguro que deseas dar de baja el programa <span className="font-bold text-slate-900">{carreraToDelete?.nombre_carrera}</span>?
              </p>
              
              <div className="space-y-2 mb-6">
                <label className="text-sm font-bold text-slate-700">Motivo de la baja *</label>
                <textarea
                  value={motivoBaja}
                  onChange={(e) => setMotivoBaja(e.target.value)}
                  placeholder="Escribe el motivo..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-100 transition-all resize-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex items-center px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Confirmar baja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};