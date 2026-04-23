import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Filter, BookOpen, Loader2, UserCheck, Shield, AlertTriangle, Ban } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Importaremos estos componentes en los siguientes pasos
import { AcademiaForm } from './AcademiaForm';
import { AcademiaModal } from './AcademiaModal';
import { DeactivateAcademiaModal } from './DeactivateAcademiaModal';
import { ActivateAcademiaModal } from './ActivateAcademiaModal';
import { useAuth } from '../../hooks/useAuth';


export const AcademiaManagement = () => {
  const { user: currentUser } = useAuth(); 
  
  // Estados de navegación y modales
  const [showForm, setShowForm] = useState(false);
  const [editingAcademia, setEditingAcademia] = useState(null);
  const [selectedAcademia, setSelectedAcademia] = useState(null);
  const [academiaToDeactivate, setAcademiaToDeactivate] = useState(null); 
  const [academiaToActivate, setAcademiaToActivate] = useState(null); 
  const [modalBloqueoEstatus, setModalBloqueoEstatus] = useState(null);
  
  // Estados de datos
  const [academias, setAcademias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de filtros y búsqueda
  const [searchInput, setSearchInput] = useState(''); 
  const [searchTerm, setSearchTerm] = useState('');   
  const [statusFilter, setStatusFilter] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAcademias = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/academias');
      setAcademias(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error("Ocurrió un error al cargar la lista de academias.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademias();
  }, []);

  // Validación y debounce de búsqueda (Idéntico a Usuarios)
  const handleSearchInput = (e) => {
    let val = e.target.value;
    val = val.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d10-9\s]/g, '');
    val = val.replace(/^\s+/g, '').replace(/\s{2,}/g, ' ');
    setSearchInput(val);
  };

  useEffect(() => {
    const timerId = setTimeout(() => {
      const cleanTerm = searchInput.trim();
      if (cleanTerm.length >= 3 || cleanTerm.length === 0) {
        setSearchTerm(cleanTerm);
      }
    }, 400);

    return () => clearTimeout(timerId);
  }, [searchInput]);

  const filteredAcademias = useMemo(() => {
    return academias.filter(academia => {
      const nombreAcademia = academia.nombre?.toLowerCase() || '';
      const nombreCoordinador = academia.coordinador_nombre?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = nombreAcademia.includes(searchLower) || nombreCoordinador.includes(searchLower);
      const matchesStatus = statusFilter ? academia.estatus === statusFilter : true;

      return matchesSearch && matchesStatus;
    });
  }, [academias, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredAcademias.length / itemsPerPage) || 1;
  const paginatedAcademias = filteredAcademias.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setEditingAcademia(null);
    setAcademiaToDeactivate(null); 
    setAcademiaToActivate(null); 
    fetchAcademias();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAcademia(null);
  };

  const handleProtectedAction = (targetAcademia, action) => {
    // Aquí puedes agregar lógica de roles si los docentes no pueden editar academias, etc.
    if (action === 'edit') {
      if (targetAcademia.estatus === 'INACTIVO') {
        toast.error("No se puede editar una academia inactiva.");
        return;
      }
      setEditingAcademia(targetAcademia);
      setShowForm(true);
    } else if (action === 'delete') {
      setAcademiaToDeactivate(targetAcademia);
    } else if (action === 'activate') {
      setAcademiaToActivate(targetAcademia);
    }
  };

  // Construcción segura de URL de imagen
  const getFotoUrl = (fotoPath) => {
    if (!fotoPath) return null;
    return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${fotoPath}`;
  };

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  // Si showForm es true, mostramos el formulario
  if (showForm) {
    return (
      <AcademiaForm 
        academiaToEdit={editingAcademia} 
        onBack={handleCloseForm} 
        onSuccess={handleSuccessAction} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <BookOpen className="w-7 h-7 mr-3 text-white/90" />
            Academias
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Administra las academias institucionales y sus coordinadores asignados.
          </p>
        </div>
        <button 
          onClick={() => { setEditingAcademia(null); setShowForm(true); }} 
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nueva academia
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            maxLength="100"
            placeholder="Buscar por nombre de academia o coordinador..."
            value={searchInput}
            onChange={handleSearchInput}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[180px]">
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
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Consultando la base de datos...</p>
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
                      <p className="text-sm text-slate-500 font-medium">No hay academias que coincidan con los filtros de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedAcademias.map((a) => (
                  <tr key={a.id_academia} className="hover:bg-slate-50/80 transition-colors duration-150">
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                          <BookOpen className="w-5 h-5 text-slate-400" />
                        </div>
                        <span className="text-sm font-black text-[#0B1828]">{a.nombre}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center mr-4 text-slate-400 overflow-hidden shrink-0">
                          {a.coordinador_foto_perfil_url ? (
                            <img src={getFotoUrl(a.coordinador_foto_perfil_url)} alt="Perfil" className="h-full w-full object-cover" />
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
                            Coordinador
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                      {a.fecha_creacion || '---'}
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
                          title="Ver detalle" 
                          onClick={() => setSelectedAcademia(a)}
                          className="p-2 text-slate-400 hover:text-[#0B1828] hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        <button 
                          title={a.estatus === 'ACTIVO' ? "Modificar academia" : "Academia inactiva"} 
                          onClick={() => handleProtectedAction(a, 'edit')}
                          className={`p-2 rounded-xl transition-all active:scale-95 ${
                            a.estatus === 'ACTIVO' 
                              ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' 
                              : 'text-slate-300 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {a.estatus === 'ACTIVO' ? (
                          <button 
                            title="Desactivar academia" 
                            onClick={() => handleProtectedAction(a, 'delete')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            title="Reactivar academia" 
                            onClick={() => handleProtectedAction(a, 'activate')}
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

        {/* Paginador */}
        {!isLoading && filteredAcademias.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredAcademias.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{filteredAcademias.length}</span> registros
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
      
      {/* Modales (se crearán en los siguientes pasos) */}
      {selectedAcademia && (
        <AcademiaModal 
          academia={selectedAcademia} 
          onClose={() => setSelectedAcademia(null)} 
        />
      )}

      {academiaToDeactivate && (
        <DeactivateAcademiaModal 
          academiaToDeactivate={academiaToDeactivate}
          onClose={() => setAcademiaToDeactivate(null)}
          onSuccess={handleSuccessAction}
          onErrorBlock={(msg) => setModalBloqueoEstatus({ mensaje: msg })}
        />
      )}

      {academiaToActivate && (
        <ActivateAcademiaModal 
          academiaToActivate={academiaToActivate}
          onClose={() => setAcademiaToActivate(null)}
          onSuccess={handleSuccessAction}
        />
      )}

      {/* Modal Estandarizado de Bloqueo (Conflictos 409) */}
      {modalBloqueoEstatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <div className="flex items-center text-amber-400">
                <Ban className="w-6 h-6 mr-3 text-amber-400" />
                <h3 className="text-xl font-black tracking-tight text-white">Acción denegada</h3>
              </div>
              <button 
                onClick={() => setModalBloqueoEstatus(null)} 
                className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 shadow-sm flex flex-col gap-4">
                <div className="flex items-start gap-3">
                   <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                   <p className="text-sm text-amber-900 font-medium leading-relaxed">
                     {modalBloqueoEstatus.mensaje}
                   </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setModalBloqueoEstatus(null)}
                className="px-6 py-3 text-sm font-black text-white bg-[#0B1828] hover:bg-slate-800 shadow-md rounded-xl transition-all active:scale-95 w-full sm:w-auto"
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