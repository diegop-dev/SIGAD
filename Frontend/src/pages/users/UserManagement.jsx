import { useState, useEffect, useMemo } from 'react';
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
  
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDeactivate, setUserToDeactivate] = useState(null); 
  const [userToActivate, setUserToActivate] = useState(null); 
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const [searchInput, setSearchInput] = useState(''); 
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
      toast.error(TOAST_USUARIOS.errorCarga || "Ocurrió un error al cargar la lista de usuarios.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Validación y debounce de búsqueda
  const handleSearchInput = (e) => {
    let val = e.target.value;
    
    // 1. Permitir solo letras, números, espacios y caracteres válidos para correo (sin + ni %)
    val = val.replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d10-9@._\-\s]/g, '');
    
    // 2. Sin espacios al inicio y máximo un espacio consecutivo
    val = val.replace(/^\s+/g, '').replace(/\s{2,}/g, ' ');
    
    // 3. Limitar a un solo '@'
    const parts = val.split('@');
    if (parts.length > 2) {
      val = parts[0] + '@' + parts.slice(1).join('').replace(/@/g, '');
    }

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
        toast.error(TOAST_USUARIOS.accesoDenegadoVerSuperAdmin || "Acceso denegado: No puedes ver el expediente de otros superadministradores.");
        return;
      }
      if (currentRoleId === 2 && (targetRoleId === 1 || targetRoleId === 2)) {
        toast.error(TOAST_USUARIOS.accesoDenegadoVerRol || "Acceso denegado: Nivel de jerarquía insuficiente para ver este perfil.");
        return;
      }
    }
    
    setSelectedUser(targetUser);
  };

  const handleProtectedAction = (targetUser, action) => {
    const currentRoleId = Number(currentUser?.rol_id);
    const targetRoleId = Number(targetUser.rol_id);
    const isSelf = Number(currentUser?.id_usuario) === Number(targetUser.id_usuario);

    if (isSelf && (currentRoleId === 1 || currentRoleId === 2)) {
      toast.error(TOAST_USUARIOS.accesoDenegadoPropioPerfil || "Para modificar tu propio perfil, utiliza la sección de 'Mi Perfil' en la configuración.");
      return;
    }

    if (currentRoleId === 1 && targetRoleId === 1) {
      toast.error(TOAST_USUARIOS.accesoDenegadoModificarSuperAdmin || "Acceso denegado: No puedes modificar a otros superadministradores.");
      return;
    }

    if (currentRoleId === 2 && (targetRoleId === 1 || targetRoleId === 2)) {
      toast.error(TOAST_USUARIOS.accesoDenegadoModificarDirectivos || "Acceso denegado: Nivel de jerarquía insuficiente para modificar este perfil.");
      return;
    }

    if (action === 'edit') {
      setEditingUser(targetUser);
      setShowForm(true);
    } else if (action === 'delete') {
      if (targetUser.estatus === 'INACTIVO') {
        toast.error(TOAST_USUARIOS.yaInactivo || "Este usuario ya se encuentra inactivo en el sistema.");
        return;
      }
      setUserToDeactivate(targetUser);
    } else if (action === 'activate') {
      if (targetUser.estatus === 'ACTIVO') {
        toast.error(TOAST_USUARIOS.yaActivo || "Este usuario ya se encuentra activo en el sistema.");
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

  const filterInputClass = "block w-full rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Users className="w-7 h-7 mr-3 text-white/90" />
            Usuarios
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Administra los accesos, roles y expedientes del personal institucional.
          </p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setShowForm(true); }} 
          className="flex items-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black shrink-0"
        >
          <Plus className="w-5 h-5 mr-2" /> Nuevo usuario
        </button>
      </div>

      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            maxLength="100"
            placeholder="Buscar por nombre o correo (Mínimo 3 Caracteres)..."
            value={searchInput}
            onChange={handleSearchInput}
            className={`pl-11 ${filterInputClass}`}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex items-center min-w-[200px]">
            <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`pl-11 appearance-none cursor-pointer ${filterInputClass}`}
            >
              <option value="">Todos los roles</option>
              <option value="Superadministrador">Superadministrador</option>
              <option value="Administrador">Administrador</option>
              <option value="Docente">Docente</option>
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
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Identidad Institucional</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Rol de Acceso</th>
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
                      <p className="text-sm text-slate-500 font-medium">Consultando la base de datos de usuarios...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">No se encontraron resultados</h3>
                      <p className="text-sm text-slate-500 font-medium">No hay usuarios registrados que coincidan con los filtros de búsqueda actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => (
                  <tr key={u.id_usuario} className="hover:bg-slate-50/80 transition-colors duration-150">
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center mr-4 text-slate-400 overflow-hidden shrink-0">
                          {u.foto_perfil_url ? (
                            <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000'}${u.foto_perfil_url}`} alt="Perfil" className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-[#0B1828]">
                            {u.nombres} {u.apellido_paterno} {u.apellido_materno}
                          </span>
                          <span className="text-xs font-bold text-slate-500 flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1.5 text-slate-400" />
                            {u.institutional_email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${getRoleBadgeStyle(u.nombre_rol)}`}>
                        <Shield className="w-3.5 h-3.5 mr-1.5" />
                        <span className="text-xs font-black uppercase tracking-wider">{u.nombre_rol}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1.5 inline-flex text-xs font-black uppercase tracking-wider rounded-lg border ${
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
                          className="p-2 text-slate-400 hover:text-[#0B1828] hover:bg-slate-100 rounded-xl transition-all active:scale-95"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        <button 
                          title="Modificar usuario" 
                          onClick={() => handleProtectedAction(u, 'edit')}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all active:scale-95"
                        >
                          <Edit className="w-5 h-5" />
                        </button>

                        {u.estatus === 'ACTIVO' ? (
                          <button 
                            title="Desactivar usuario (Baja lógica)" 
                            onClick={() => handleProtectedAction(u, 'delete')}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button 
                            title="Reactivar usuario" 
                            onClick={() => handleProtectedAction(u, 'activate')}
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

        {!isLoading && filteredUsers.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{filteredUsers.length}</span> registros
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