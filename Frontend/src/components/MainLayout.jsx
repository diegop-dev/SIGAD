import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';
import { 
  Menu, X, Home, Users, Calendar, CalendarDays, LogOut, Bell, User, 
  School, BookOpen, GraduationCap, HomeIcon, ShieldCheck, Activity, 
  ChevronLeft, ChevronRight, Layers, Settings, Shield
} from 'lucide-react';
import { ForceChangePasswordModal } from '../pages/auth/ForceChangePasswordModal';
import { NotificationDropdown } from './NotificationDropdown';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const closeSidebarMobile = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handle = e => {
      if (!e.target.closest('.notif-container')) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('click', handle);
    return () => document.removeEventListener('click', handle);
  }, []);

  const menuCategories = [
    {
      category: "Principal",
      icon: Home,
      roles: [1, 2, 3],
      items: [
        { name: 'Inicio', path: '/dashboard', icon: Home, roles: [1, 2, 3] },
      ]
    },
    {
      category: "Control de Personal",
      icon: Shield,
      roles: [1, 2],
      items: [
        { name: 'Usuarios', path: '/usuarios', icon: Users, roles: [1, 2] },
        { name: 'Docentes', path: '/docentes', icon: Users, roles: [1, 2] },
        { name: 'Asignaciones', path: '/asignaciones', icon: CalendarDays, roles: [1, 2]},
      ]
    },
    {
      category: "Gestión Académica",
      icon: School,
      roles: [1, 2],
      items: [
        { name: 'Academias', path:'/academias', icon: School, roles:[1,2]},
        { name: 'Carreras', path: '/carreras', icon: GraduationCap, roles: [1, 2] },
        { name: 'Materias', path:'/materias', icon: BookOpen, roles:[1,2]},
        { name: 'Aulas', path: '/aulas', icon: HomeIcon, roles: [1,2]},
        { name: 'Grupos', path: '/grupos', icon: Users, roles: [1, 2]},
        { name: 'Periodos', path: '/periodos', icon: Calendar, roles: [1, 2]},
      ]
    },
    {
      category: "Metricas y Seguridad",
      icon: Activity,
      roles: [1],
      items: [
        { name: 'Métricas Institucionales', path: '/metricas', icon: Activity, roles: [1]},
        { name: 'Registro de Auditoría', path: '/audit-logs', icon: ShieldCheck, roles: [1]},
      ]
    },
    {
      category: "Mi Espacio",
      icon: User,
      roles: [3],
      items: [
        { name: 'Mis Asignaciones', path: '/mis-asignaciones', icon: Calendar, roles: [3]},
        { name: 'Mi Horario', path: '/horarios', icon: CalendarDays, roles: [3]},
      ]
    }
  ];

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';

  const profileImageUrl = user?.foto_perfil_url 
    ? `${API_BASE}${user?.foto_perfil_url}` 
    : null;

  // Tamaño del sidebar reducido y estandarizado
  const sidebarWidth = isSidebarCollapsed ? 'w-[72px]' : 'w-[240px]';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      <ForceChangePasswordModal />
      
      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={closeSidebarMobile}
        />
      )}

      {/* Sidebar Navy Estandarizado*/}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-[#0B1828] text-slate-300 shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col ${sidebarWidth} ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 bg-white text-[#0B1828] border border-slate-200 shadow-lg rounded-full p-1.5 z-50 hover:bg-slate-50 hover:scale-110 transition-all focus:outline-none"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Logo */}
        <div className={`flex items-center h-20 bg-[#0B1828] shrink-0 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between px-6'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black/50 rounded-xl flex items-center justify-center shrink-0 shadow-md">
              <span className="text-white font-black text-xl">U</span>
            </div>
            {!isSidebarCollapsed && (
              <span className="text-2xl font-black tracking-widest text-white animate-in fade-in duration-200">SIGAD</span>
            )}
          </div>
          {!isSidebarCollapsed && (
            <button onClick={closeSidebarMobile} className="lg:hidden text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Perfil Tarjeta */}
        <div className={`shrink-0 flex justify-center mb-4 ${isSidebarCollapsed ? 'px-2 mt-4' : 'px-4 mt-4'}`}>
          <div 
            onClick={() => { navigate('/mi-perfil'); closeSidebarMobile(); }}
            className={`flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors group w-full ${isSidebarCollapsed ? 'p-2 justify-center border-transparent bg-transparent hover:bg-white/5' : 'p-3'}`}
            title={isSidebarCollapsed ? "Ir a mi perfil" : ""}
          >
            <div className="relative shrink-0">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-[#0B1828] border-2 border-slate-600 overflow-hidden flex items-center justify-center group-hover:border-slate-400 transition-colors shadow-md">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 group-hover:text-white transition-colors" />
                )}
              </div>
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0B1828] rounded-full"></span>
            </div>
            
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-200">
                <p className="text-sm font-bold text-white truncate group-hover:text-slate-200 transition-colors leading-tight">
                  {user?.nombres.split(' ')[0]} {user?.apellido_paterno}
                </p>
                <p className="text-[11px] text-slate-400 font-bold truncate group-hover:text-slate-300 transition-colors mt-0.5 tracking-wider">
                  {user?.rol_id === 1 ? 'Superadministrador' : user?.rol_id === 2 ? 'Administrador' : 'Docente'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-visible py-2 px-3 space-y-2">
          {menuCategories.filter(cat => cat.roles.includes(user?.rol_id)).map((category, catIdx) => {
            const CategoryIcon = category.icon;
            const isCategoryActive = category.items.some(item => location.pathname.startsWith(item.path));
            const isPrincipal = category.category === "Principal";

            return (
              <div key={catIdx} className="relative group">
                
                {/* Boton de Categoría (Principal Lleva a Inicio) */}
                <div 
                  onClick={() => {
                    if (isPrincipal) {
                      navigate(category.items[0].path);
                      closeSidebarMobile();
                    }
                  }}
                  className={`flex items-center ${isPrincipal ? 'cursor-pointer' : 'cursor-default'} rounded-2xl transition-all duration-200 ${
                  isSidebarCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'
                } ${
                  isCategoryActive 
                    ? 'bg-black/50 text-white shadow-md shadow-black/20' 
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}>
                  <CategoryIcon className={`shrink-0 transition-transform duration-200 ${isSidebarCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'} ${
                    isCategoryActive ? 'text-white' : 'text-slate-400 group-hover:text-white group-hover:scale-110'
                  }`} />
                  
                  {!isSidebarCollapsed && (
                    <span className="text-sm font-bold truncate">
                      {category.category}
                    </span>
                  )}
                </div>

                {/* Modal Flotante Estandarizado (Header Azul Navy) */}
                {!isPrincipal && (
                  <div className="absolute left-full top-0 pl-3 hidden group-hover:block z-50">
                    <div className="absolute left-0 top-0 w-3 h-full bg-transparent"></div>
                    
                    <div className="w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
                      
                      {/* Cabecera del Modal Flotante */}
                      <div className="bg-[#0B1828] px-4 py-3">
                        <h4 className="font-black text-white flex items-center text-sm tracking-wide">
                          <CategoryIcon className="w-4 h-4 mr-2 text-white" />
                          {category.category}
                        </h4>
                      </div>

                      {/* Cuerpo del Modal Flotante */}
                      <div className="p-2 space-y-1">
                        {category.items.filter(item => item.roles.includes(user?.rol_id)).map(item => {
                          const ItemIcon = item.icon;
                          const isActive = location.pathname.startsWith(item.path);
                          return (
                            <Link
                              key={item.name}
                              to={item.path}
                              onClick={closeSidebarMobile}
                              className={`flex items-center px-3 py-2.5 rounded-xl transition-all text-sm font-bold ${
                                isActive 
                                  ? 'bg-[#0B1828] text-white shadow-sm' 
                                  : 'text-[#0B1828] hover:bg-slate-100'
                              }`}
                            >
                              <ItemIcon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer (Cerrar Sesión) */}
        <div className={`p-4 border-t border-white/10 shrink-0 bg-[#0B1828] ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          <button
            onClick={handleLogout}
            title={isSidebarCollapsed ? "Cerrar sesión" : ""}
            className={`flex items-center justify-center text-sm font-bold text-white/50 bg-white/5 rounded-2xl hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-95 ${
              isSidebarCollapsed ? 'p-3.5 w-full' : 'px-4 py-3.5 w-full'
            }`}
          >
            <LogOut className={`shrink-0 ${isSidebarCollapsed ? 'h-6 w-6' : 'h-5 w-5 mr-3'}`} />
            {!isSidebarCollapsed && <span className="animate-in fade-in duration-200">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header Superior Blanco */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center justify-between h-20 px-6 lg:px-8">
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden text-slate-400 hover:text-[#0B1828] focus:outline-none transition-colors p-2 rounded-xl hover:bg-slate-100"
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="hidden sm:block">
                <h2 className="text-xl font-black text-[#0B1828] capitalize">
                  {location.pathname.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                  Panel de Administración Institucional
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Notificaciones */}
              <div className="relative notif-container">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-3 text-slate-400 hover:text-[#0B1828] hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          (() => {
                            const rank = { BAJA: 1, MEDIA: 2, ALTA: 3 };
                            let top = 'BAJA';
                            notifications.forEach(n => {
                              if (rank[n.severidad] > rank[top]) top = n.severidad;
                            });
                            // Se elimina el color amarillo (amber) según los estándares de UI definidos
                            if (top === 'ALTA') return 'bg-red-500';
                            if (top === 'MEDIA') return 'bg-slate-600';
                            return 'bg-emerald-500';
                          })()
                        } border-2 border-white`}
                      />
                    </span>
                  )}
                </button>
                {isNotifOpen && <NotificationDropdown />}
              </div>
            </div>
          </div>
        </header>

        {/* Renderizado de Pantallas (Outlet) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};