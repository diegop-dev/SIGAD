import { X, Mail, Calendar, Shield, User } from 'lucide-react';

export const UserModal = ({ user, onClose }) => {
  if (!user) return null;

  // Construcción robusta de la URL apuntando al servidor backend
  // Si VITE_API_URL falla o no está disponible, usamos localhost:3000 por defecto
  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
    
  const profileImageUrl = user.foto_perfil_url 
    ? `${API_BASE}${user.foto_perfil_url}` 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-100">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">Expediente de usuario</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="p-6">
          <div className="flex items-center space-x-6 mb-8">
            <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">
                {user.nombres} {user.apellido_paterno} {user.apellido_materno}
              </h4>
              <span className={`mt-2 inline-flex px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border ${
                user.estatus === 'ACTIVO' 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {user.estatus}
              </span>
            </div>
          </div>

          {/* Lista de detalles */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-100">
            <div className="flex items-center text-sm text-slate-700">
              <Shield className="w-5 h-5 mr-3 text-blue-500" />
              <span className="font-bold mr-2 min-w-[120px]">Rol del sistema:</span> 
              <span className="text-slate-600">{user.nombre_rol}</span>
            </div>
            <div className="flex items-center text-sm text-slate-700">
              <Mail className="w-5 h-5 mr-3 text-blue-500" />
              <span className="font-bold mr-2 min-w-[120px]">Institucional:</span> 
              <span className="text-slate-600">{user.institutional_email}</span>
            </div>
            <div className="flex items-center text-sm text-slate-700">
              <Mail className="w-5 h-5 mr-3 text-slate-400" />
              <span className="font-bold mr-2 min-w-[120px]">Personal:</span> 
              <span className="text-slate-600">{user.personal_email || 'No registrado'}</span>
            </div>
            <div className="flex items-center text-sm text-slate-700">
              <Calendar className="w-5 h-5 mr-3 text-blue-500" />
              <span className="font-bold mr-2 min-w-[120px]">Fecha de alta:</span> 
              <span className="text-slate-600">
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
                  : 'N/D'}
              </span>
            </div>
          </div>
        </div>
        
        {/* Pie del modal */}
        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm">
            Cerrar detalles
          </button>
        </div>
      </div>
    </div>
  );
};
