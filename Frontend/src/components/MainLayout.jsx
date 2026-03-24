import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { Menu, X, Home, Users, Calendar, CalendarDays, LogOut, Bell, User, School, BookOpen, GraduationCap, HomeIcon, ShieldCheck } from 'lucide-react';
import { ForceChangePasswordModal } from '../pages/auth/ForceChangePasswordModal';
import { NotificationDropdown } from './NotificationDropdown';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications(); // Ya no necesitamos clearNotifications aquí
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  // cerrar el panel de notificaciones al hacer clic fuera
  useEffect(() => {
    const handle = e => {
      if (!e.target.closest('.notif-container')) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  const menuItems = [
    { name: 'Inicio', path: '/dashboard', icon: Home, roles: [1, 2, 3] },
    { name: 'Gestión de usuarios', path: '/usuarios', icon: Users, roles: [1, 2] },
    { name: 'Gestión de docentes', path: '/docentes', icon: Users, roles: [1, 2] },
    { name: 'Gestión de academias', path:'/academias', icon: School, roles:[1,2]},
    { name: 'Gestión de materias', path:'/materias', icon: BookOpen, roles:[1,2]},
    { name: 'Gestion de aulas y laboratorios', path: '/aulas', icon: HomeIcon, roles: [1,2]},
    { name: 'Gestión de carreras', path: '/carreras', icon: GraduationCap, roles: [1, 2] },
    { name: 'Gestión de grupos', path: '/grupos', icon: Users, roles: [1, 2]},
    { name: 'Periodos', path: '/periodos', icon: Calendar, roles: [1, 2]},
    { name: 'Gestión de asignaciones', path: '/asignaciones', icon: Calendar, roles: [1, 2]},
    { name: 'Métricas institucionales', path: '/metricas', icon: GraduationCap, roles: [1]},
    { name: 'Registro de auditoría', path: '/audit-logs', icon: ShieldCheck, roles: [1]},
    { name: 'Mis asignaciones', path: '/mis-asignaciones', icon: Calendar, roles: [3]},
    { name: 'Mi horario', path: '/horarios', icon: CalendarDays, roles: [3]},
    { name: 'Mi perfil', path: '/mi-perfil', icon: User, roles: [3] }
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user?.rol_id));

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';

  const profileImageUrl = user?.foto_perfil_url 
    ? `${API_BASE}${user?.foto_perfil_url}` 
    : null;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      <ForceChangePasswordModal />
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-6 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl">S</span>
            </div>
            <span className="text-2xl font-black tracking-widest text-white">SIGAD</span>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="px-6 py-8 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full bg-slate-800 border-2 border-blue-500 overflow-hidden flex items-center justify-center shrink-0">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-950 rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{user?.nombres.split(' ')[0]} {user?.apellido_paterno}</p>
              <p className="text-xs text-blue-400 font-medium truncate">
                {user?.rol_id === 1 ? 'Superadministrador' : user?.rol_id === 2 ? 'Administrador' : 'Docente'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div key={item.name}>
                <Link
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Icon className={`mr-4 h-5 w-5 transition-transform duration-200 ${
                    isActive ? 'text-white scale-110' : 'text-slate-500 group-hover:scale-110 group-hover:text-blue-400'
                  }`} />
                  {item.name}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-slate-400 bg-slate-900 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-slate-500 hover:text-blue-600 focus:outline-none transition-colors p-2 rounded-lg hover:bg-slate-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="hidden sm:block">
                <h2 className="text-lg font-bold text-slate-800 capitalize">
                  {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">Panel de administración institucional</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative notif-container">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)} // Forma correcta y limpia
                  className="relative p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          // Determinamos el color basado en la severidad real de la DB
                          (() => {
                            const rank = { BAJA: 1, MEDIA: 2, ALTA: 3 };
                            let top = 'BAJA';
                            notifications.forEach(n => {
                              if (rank[n.severidad] > rank[top]) top = n.severidad;
                            });
                            if (top === 'ALTA') return 'bg-red-500';
                            if (top === 'MEDIA') return 'bg-amber-400';
                            return 'bg-emerald-500';
                          })()
                        } border-2 border-white`}
                      />
                    </span>
                  )}
                </button>
                {isNotifOpen && <NotificationDropdown />}
              </div>
              
              <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
              
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-slate-400">En línea</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};