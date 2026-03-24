import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Users, Loader2, RotateCcw, GraduationCap } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AltaDocente } from './AltaDocente';
import { DocenteModal } from './DocenteModal';
import { DeactivateDocenteModal } from './DeactivateDocenteModal';
import { useAuth } from '../../hooks/useAuth';
import { TOAST_DOCENTES } from '../../../constants/toastMessages';
import { ReactivateDocenteModal } from './ReactivateDocenteModal';

export const DocenteManagement = () => {
  const { user: currentUser } = useAuth(); 
  
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create', 'view' o 'edit'
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [docenteToDeactivate, setDocenteToDeactivate] = useState(null);
  const [docenteToReactivate, setDocenteToReactivate] = useState(null);

  const [docentes, setDocentes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState(''); // <-- NUEVO FILTRO DE NIVEL ACADÉMICO
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredDocentes = useMemo(() => {
    return docentes.filter(docente => {
      const fullName = `${docente.nombres} ${docente.apellido_paterno} ${docente.apellido_materno}`.toLowerCase();
      const email = docente.institutional_email?.toLowerCase() || '';
      const matricula = docente.matricula_empleado?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower) || matricula.includes(searchLower);
      const matchesStatus = statusFilter ? docente.estatus === statusFilter : true;
      
      // Ajustamos para que coincida con el nivel del docente (o asuma licenciatura por defecto si estuviera vacío)
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

  // Vista de formulario (Crear y Editar)
  if (showForm && (formMode === 'create' || formMode === 'edit')) {
    return (
      <AltaDocente 
        onBack={handleCloseForm} 
        onSuccess={handleSuccessAction} 
        docenteToEdit={formMode === 'edit' ? selectedDocente : null}
      />
    );
  }

  // Vista principal: Tabla de Gestión
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de docentes
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra los expedientes y asignaciones académicas.</p>
        </div>
        <button 
          onClick={handleCreateNew} 
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo docente
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o matrícula..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>
        
        <div className="flex flex-wrap sm:flex-nowrap gap-4">
          {/* NUEVO FILTRO: NIVEL ACADÉMICO DEL DOCENTE */}
          <div className="relative flex items-center min-w-[180px]">
            <GraduationCap className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={nivelFilter}
              onChange={(e) => setNivelFilter(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Niveles: Todos</option>
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
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todos los estatus</option>
              <option value="ACTIVO">Activo</option>
              <option value="BAJA">Baja</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre completo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Matrícula</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Academia</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando base de datos...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedDocentes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">No se encontraron docentes que coincidan con la búsqueda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocentes.map((d) => {
                  const nivelStr = (d.nivel_academico || 'LICENCIATURA').toUpperCase();
                  return (
                    <tr key={d.id_docente} className="hover:bg-blue-50/50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">
                          {d.nombres} {d.apellido_paterno} {d.apellido_materno}
                        </div>
                        <div className="text-xs text-slate-500 mb-1">{d.institutional_email}</div>
                        {/* INSIGNIA DE NIVEL ACADÉMICO */}
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          nivelStr === 'DOCTORADO' ? 'bg-purple-100 text-purple-700' :
                          nivelStr === 'MAESTRIA' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {nivelStr}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                        {d.matricula_empleado}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                          {d.nombre_academia || 'Sin asignar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${
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
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            title="Actualizar expediente" 
                            onClick={() => handleEditClick(d)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                            {d.estatus === 'ACTIVO' ? (
                              <button
                                title="Dar de baja docente"
                                onClick={() => setDocenteToDeactivate(d)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            ) : (
                              <button
                                title="Reactivar docente"
                                onClick={() => setDocenteToReactivate(d)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
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

        {/* Paginación */}
        {!isLoading && filteredDocentes.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredDocentes.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredDocentes.length}</span> registros
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
    </div>
  );
};