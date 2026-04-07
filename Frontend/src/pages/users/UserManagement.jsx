import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, ChevronLeft, ChevronRight, Filter, Users, Loader2, UserCheck, Shield, Mail } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserForm } from './UserForm';
import { UserModal } from './UserModal';
import { DeactivateUserModal } from './DeactivateUserModal';
import { ActivateUserModal } from './ActivateUserModal';
import { useAuth } from '../../hooks/useAuth';
import { TOAST_USUARIOS } from '../../../constants/toastMessages';

export const UserManagement = () => {
  const { user: currentUser } = useAuth(); 
  const navigate = useNavigate();
  
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDeactivate, setUserToDeactivate] = useState(null); 
  const [userToActivate, setUserToActivate] = useState(null); 
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast.error(TOAST_USUARIOS.errorCarga);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const fullName = `${user.nombres} ${user.apellido_paterno} ${user.apellido_materno}`.toLowerCase();
      const email = user.institutional_email?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower);
      const matchesRole = roleFilter ? user.nombre_rol === roleFilter : true;
      const matchesStatus = statusFilter ? user.estatus === statusFilter : true;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleSuccessAction = () => {
    setShowForm(false);
    setEditingUser(null);
    setUserToDeactivate(null); 
    setUserToActivate(null); 
    fetchUsers();
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleViewClick = (targetUser) => {
    const currentRoleId = Number(currentUser?.rol_id);
    const targetRoleId = Number(targetUser.rol_id);
    const isSelf = Number(currentUser?.id_usuario) === Number(targetUser.id_usuario);

    if (!isSelf) {
      if (currentRoleId === 1 && targetRoleId === 1) {
        toast.error(TOAST_USUARIOS.accesoDenegadoVerSuperAdmin);
        return;
      }
      if (currentRoleId === 2 && (targetRoleId === 1 || targetRoleId === 2)) {
        toast.error(TOAST_USUARIOS.accesoDenegadoVerRol);
        return;
      }
    }
    
    setSelectedUser(targetUser);
  };

  const handleProtectedAction = (targetUser, action) => {
    const currentRoleId = Number(currentUser?.rol_id);
    const targetRoleId = Number(targetUser.rol_id);
    const isSelf = Number(currentUser?.id_usuario) === Number(targetUser.id_usuario);

    if (isSelf) {
      if (action === 'edit') {
        navigate('/mi-perfil');
        return;
      }
      toast.error(TOAST_USUARIOS.accesoDenegadoPropioPerfil);
      return;
    }

    if (currentRoleId === 1 && targetRoleId === 1) {
      toast.error(TOAST_USUARIOS.accesoDenegadoModificarSuperAdmin);
      return;
    }

    if (currentRoleId === 2 && (targetRoleId === 1 || targetRoleId === 2)) {
      toast.error(TOAST_USUARIOS.accesoDenegadoModificarDirectivos);
      return;
    }

    if (action === 'edit') {
      setEditingUser(targetUser);
      setShowForm(true);
    } else if (action === 'delete') {
      if (targetUser.estatus === 'INACTIVO') {
        toast.error(TOAST_USUARIOS.yaInactivo);
        return;
      }
      setUserToDeactivate(targetUser);
    } else if (action === 'activate') {
      if (targetUser.estatus === 'ACTIVO') {
        toast.error(TOAST_USUARIOS.yaActivo);
        return;
      }
      setUserToActivate(targetUser);
    }
  };

  const getRoleBadgeStyle = (rol) => {
    if (rol === 'Superadministrador') return 'bg-purple-100 text-purple-800 border-purple-200';
    if (rol === 'Administrador') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  if (showForm) {
    return (
      <UserForm 
        userToEdit={editingUser} 
        onBack={handleCloseForm} 
        onSuccess={handleSuccessAction} 
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Users className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de usuarios
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Administra los accesos, roles y expedientes del personal institucional.</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setShowForm(true); }} 
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo usuario
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre completo o correo institucional..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[200px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="">Todos los roles</option>
              <option value="Superadministrador">Superadministrador</option>
              <option value="Administrador">Administrador</option>
              <option value="Docente">Docente</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full min-w-[180px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Todos los estatus</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Identidad Institucional</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Rol de Acceso</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando base de datos...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">No se encontraron usuarios que coincidan con la búsqueda actual.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-blue-50/50 transition-colors duration-150">
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center mr-3 text-slate-500 overflow-hidden shrink-0">
                          {u.foto_perfil_url ? (
                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${u.foto_perfil_url}`} alt="Perfil" className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">
                            {u.nombres} {u.apellido_paterno} {u.apellido_materno}
                          </span>
                          <span className="text-xs font-medium text-slate-500 flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1" />
                            {u.institutional_email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1 rounded-lg border ${getRoleBadgeStyle(u.nombre_rol)}`}>
                        <Shield className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-xs font-bold uppercase tracking-wider">{u.nombre_rol}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${
                        u.estatus === 'ACTIVO' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {u.estatus}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button 
                          title="Ver expediente completo" 
                          onClick={() => handleViewClick(u)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        <button 
                          title="Modificar usuario" 
                          onClick={() => handleProtectedAction(u, 'edit')}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {u.estatus === 'ACTIVO' ? (
                          <button 
                            title="Desactivar usuario (Baja lógica)" 
                            onClick={() => handleProtectedAction(u, 'delete')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            title="Reactivar usuario" 
                            onClick={() => handleProtectedAction(u, 'activate')}
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

        {!isLoading && filteredUsers.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de{' '}
                <span className="font-bold text-slate-900">{filteredUsers.length}</span> registros
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
      {selectedUser && (
        <UserModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}

      <DeactivateUserModal 
        userToDeactivate={userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onSuccess={handleSuccessAction}
      />

      <ActivateUserModal 
        userToActivate={userToActivate}
        onClose={() => setUserToActivate(null)}
        onSuccess={handleSuccessAction}
      />
    </div>
  );
};