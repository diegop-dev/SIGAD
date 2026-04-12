import { X, Mail, Calendar, Shield, User } from 'lucide-react';

export const UserModal = ({ user, onClose }) => {
  if (!user) return null;

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
    
  const profileImageUrl = user.foto_perfil_url 
    ? `${API_BASE}${user.foto_perfil_url}` 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      {/* Contenedor principal con esquinas más redondas */}
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del modal (Navy Estandarizado) */}
        <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
          <h3 className="text-xl font-black text-white tracking-tight">Expediente de usuario</h3>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="p-8 overflow-y-auto flex-1">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-8">
            <div className="h-28 w-28 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-slate-300" />
              )}
            </div>
            <div className="pt-2">
              <h4 className="text-2xl font-black text-[#0B1828] leading-tight">
                {user.nombres} <br className="hidden sm:block" /> {user.apellido_paterno} {user.apellido_materno}
              </h4>
              <span className={`mt-3 inline-flex px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border shadow-sm ${
                user.estatus === 'ACTIVO' 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {user.estatus}
              </span>
            </div>
          </div>

          {/* Lista de detalles */}
          <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center text-sm">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Shield className="w-5 h-5 text-[#0B1828]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1828] mb-0.5">Rol del sistema</span> 
                <span className="text-slate-600 font-medium">{user.nombre_rol}</span>
              </div>
            </div>
            
            {/* Correo personal */}
            <div className="flex items-center text-sm">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Mail className="w-5 h-5 text-[#0B1828]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1828] mb-0.5">Correo personal</span> 
                <span className="text-slate-600 font-medium">{user.personal_email || 'No registrado'}</span>
              </div>
            </div>

            {/* Correo institucional */}
            <div className="flex items-center text-sm">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Mail className="w-5 h-5 text-[#0B1828]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1828] mb-0.5">Correo institucional</span> 
                <span className="text-slate-600 font-medium">{user.institutional_email}</span>
              </div>
            </div>
            
            {/* Fecha de alta */}
            <div className="flex items-center text-sm">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Calendar className="w-5 h-5 text-[#0B1828]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1828] mb-0.5">Fecha de alta en el sistema</span> 
                <span className="text-slate-600 font-medium">
                  {user.fecha_creacion 
                    ? new Date(user.fecha_creacion).toLocaleString('es-MX', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                      }) 
                    : 'Fecha no disponible'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};