import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Users, Loader2, RotateCcw, GraduationCap, Mail, History } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AltaDocente } from './AltaDocente';
import { DocenteModal } from './DocenteModal';
import { DeactivateDocenteModal } from './DeactivateDocenteModal';
import { useAuth } from '../../hooks/useAuth';
import { TOAST_DOCENTES } from '../../../constants/toastMessages';
import { ReactivateDocenteModal } from './ReactivateDocenteModal';
import HistorialDocente from './HistorialDocente';
export const DocenteManagement = () => {
  const { user: currentUser } = useAuth(); 
  
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); 
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [docenteToDeactivate, setDocenteToDeactivate] = useState(null);
  const [docenteToReactivate, setDocenteToReactivate] = useState(null);

  const [docentes, setDocentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState(''); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [modalHistorial, setModalHistorial] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);

  const fetchDocentes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/docentes'); 
      setDocentes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(TOAST_DOCENTES.errorCarga);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocentes();
  }, []);

  const handleSearchChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^a-zA-Z0-9\s@._-áéíóúÁÉÍÓÚñÑüÜ]/g, '');
    value = value.trimStart().replace(/\s{2,}/g, ' ');
    const atCount = (value.match(/@/g) || []).length;
    if (atCount > 1) {
      const parts = value.split('@');
      value = parts[0] + '@' + parts.slice(1).join('').replace(/@/g, '');
    }
    setSearchTerm(value);
  };

  const filteredDocentes = useMemo(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    return docentes.filter(docente => {
      const fullName = `${docente.nombres} ${docente.apellido_paterno} ${docente.apellido_materno}`.toLowerCase();
      const email = docente.institutional_email?.toLowerCase() || '';
      const matricula = docente.matricula_empleado?.toLowerCase() || '';

      let matchesSearch = true;
      if (cleanSearch.length >= 3) {
        matchesSearch = fullName.includes(cleanSearch) || email.includes(cleanSearch) || matricula.includes(cleanSearch);
      }

      const matchesStatus = statusFilter ? docente.estatus === statusFilter : true;
      const matchesNivel = nivelFilter ? (docente.nivel_academico || 'LICENCIATURA').toUpperCase() === nivelFilter : true;

      return matchesSearch && matchesStatus && matchesNivel;
    });
  }, [docentes, searchTerm, statusFilter, nivelFilter]);

  const totalPages = Math.ceil(filteredDocentes.length / itemsPerPage) || 1;
  const paginatedDocentes = filteredDocentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, nivelFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setSelectedDocente(null);
    setDocenteToDeactivate(null);
    setDocenteToReactivate(null);
    fetchDocentes();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedDocente(null);
  };

  const handleCreateNew = () => {
    setFormMode('create');
    setSelectedDocente(null);
    setShowForm(true);
  };

  const handleViewClick = (docente) => {
    setFormMode('view');
    setSelectedDocente(docente);
  };

  const handleEditClick = (docente) => {
    setFormMode('edit');
    setSelectedDocente(docente);
    setShowForm(true);
  };

  const handleDeactivateClick = (docente) => {
    if (docente.estatus === 'INACTIVO') {
      toast.error(TOAST_DOCENTES.yaInactivo);
      return;
    }
    setDocenteToDeactivate(docente);
  };

  if (showForm && (formMode === 'create' || formMode === 'edit')) {
    return (
      <AltaDocente 
        onBack={handleCloseForm} 
        onSuccess={handleSuccessAction} 
        docenteToEdit={formMode === 'edit' ? selectedDocente : null}
      />
    );
  }

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Users className="w-7 h-7 mr-3 text-white/90" />
            Docentes
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">Administra los expedientes docente y el historial académico.</p>
        </div>
        <button 
          onClick={handleCreateNew} 
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo docente
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o matrícula..."
            value={searchTerm}
            onChange={handleSearchChange} 
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[200px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={nivelFilter}
              onChange={(e) => setNivelFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los niveles</option>
              <option value="LICENCIATURA">Licenciatura</option>
              <option value="MAESTRIA">Maestría</option>
              <option value="DOCTORADO">Doctorado</option>
            </select>
          </div>

          <div className="relative flex items-center min-w-[180px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los estatus</option>
              <option value="ACTIVO">Activo</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Identidad Institucional</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Perfil Académico</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-[#0B1828] animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando base de datos...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedDocentes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">No se encontraron resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">No se encontraron docentes que coincidan con la búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocentes.map((d) => {
                  const nivelStr = (d.nivel_academico || 'LICENCIATURA').toUpperCase();
                  return (
                    <tr key={d.id_docente} className="hover:bg-slate-50/80 transition-colors duration-150">
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center mr-4 text-slate-400 overflow-hidden shrink-0">
                            {d.foto_perfil_url ? (
                              <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${d.foto_perfil_url}`} alt="Perfil" className="h-full w-full object-cover" />
                            ) : (
                              <Users className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-[#0B1828]">
                              {d.nombres} {d.apellido_paterno} {d.apellido_materno}
                            </span>
                            <span className="text-xs font-bold text-slate-500 flex items-center mt-0.5">
                              <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                              {d.institutional_email || 'Sin correo institucional'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1.5">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${
                            nivelStr === 'DOCTORADO' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                            nivelStr === 'MAESTRIA' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-blue-100 text-blue-800 border-blue-200'
                          }`}>
                            <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
                            <span className="text-xs font-black uppercase tracking-wider">{nivelStr}</span>
                          </div>
                          <div className="flex flex-col mt-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Matrícula / Academia</span>
                            <span className="text-xs font-medium text-slate-600">
                              {d.matricula_empleado} • {d.nombre_academia || 'Sin academia'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${
                          d.estatus === 'ACTIVO' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {d.estatus}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            title="Consultar expediente" 
                            onClick={() => handleViewClick(d)}
                            className="p-2 text-slate-400 hover:text-[#0B1828] hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            title="Actualizar expediente" 
                            onClick={() => handleEditClick(d)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-95"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => { setDocenteSeleccionado(d); setModalHistorial(true); }}
                            className="p-2 text-slate-400 hover:bg-purple-100 rounded-xl transition-all active:scale-95" title="Ver Historial"
                          >
                            <History className="w-5 h-5" />
                          </button>
                            {d.estatus === 'ACTIVO' ? (
                              <button
                                title="Dar de baja docente"
                                onClick={() => handleDeactivateClick(d)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                title="Reactivar docente"
                                onClick={() => setDocenteToReactivate(d)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
                              >
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && filteredDocentes.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredDocentes.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{filteredDocentes.length}</span> registros
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

      {formMode === 'view' && selectedDocente && (
        <DocenteModal 
          docente={selectedDocente} 
          onClose={handleCloseForm} 
        />
      )}

      <DeactivateDocenteModal
        docente={docenteToDeactivate}
        onClose={() => setDocenteToDeactivate(null)}
        onSuccess={handleSuccessAction}
      />

      <ReactivateDocenteModal
        docente={docenteToReactivate}
        onClose={() => setDocenteToReactivate(null)}
        onSuccess={handleSuccessAction}
      />
      
      {modalHistorial && (
        <HistorialDocente 
          docenteId={docenteSeleccionado.id_docente} 
          alCerrar={() => setModalHistorial(false)} 
        />
      )}
    </div>
  );
};