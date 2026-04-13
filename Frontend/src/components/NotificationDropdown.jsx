import { AlertCircle, BellRing, Check, Clock } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationDropdown = () => {
  const { notifications, clearNotifications, removeNotification } = useNotifications();

  // Función auxiliar para formatear la fecha que viene de la BD
  const formatearFecha = (fechaString) => {
    if (!fechaString) return '';
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      
      {/* Cabecera del Dropdown en Azul Navy */}
      <div className="bg-[#0B1828] px-4 py-3 flex justify-between items-center">
        <h3 className="font-black text-white flex items-center text-sm tracking-wide">
          <BellRing className="w-4 h-4 mr-2 text-white" />
          Notificaciones
          {notifications.length > 0 && (
            <span className="ml-2 bg-red-500 text-white py-0.5 px-2 rounded-full text-xs shadow-sm">
              {notifications.length}
            </span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button
            className="text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 px-2 py-1 rounded-md transition-colors flex items-center"
            onClick={() => clearNotifications()}
          >
            <Check className="w-3 h-3 mr-1" /> Marcar todas
          </button>
        )}
      </div>

      {/* Cuerpo del Dropdown */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500">
          <div className="bg-slate-100 p-3 rounded-full mb-3">
            <AlertCircle className="h-6 w-6 text-slate-400" />
          </div>
          <span className="text-sm font-medium">No tienes notificaciones nuevas.</span>
        </div>
      ) : (
        <ul className="max-h-[350px] overflow-y-auto divide-y divide-slate-100">
          {notifications.map(n => (
            <li 
              key={n.id} 
              className="flex items-start px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group" 
              onClick={() => removeNotification(n.id)}
            >
              <span
                className={`flex-shrink-0 inline-block h-2.5 w-2.5 rounded-full mt-1.5 mr-3 shadow-sm ${
                  n.severidad === 'ALTA'
                    ? 'bg-red-500 shadow-red-200'
                    : n.severidad === 'MEDIA'
                    ? 'bg-slate-600 shadow-slate-300'
                    : 'bg-emerald-500 shadow-emerald-200'
                }`}
              />
              <div className="flex flex-col flex-1">
                <span className="text-sm text-[#0B1828] font-medium leading-snug group-hover:text-black">
                  {n.mensaje}
                </span>
                {n.fecha_creacion && (
                  <span className="text-xs text-slate-400 mt-1 flex items-center font-medium">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatearFecha(n.fecha_creacion)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};