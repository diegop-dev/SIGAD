import { AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationDropdown = () => {
  const { notifications, clearNotifications, removeNotification } = useNotifications();

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl z-50">
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 text-slate-500">
          <AlertCircle className="h-12 w-12 mb-2 text-slate-400" />
          <span>No hay alertas</span>
        </div>
      ) : (
        <div>
          <div className="flex justify-end p-2">
            <button
              className="text-xs text-blue-500 hover:underline"
              onClick={() => clearNotifications()}
            >
              Limpiar
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.map(n => (
              <li key={n.id} className="flex items-center px-4 py-2 hover:bg-slate-100 cursor-pointer" onClick={() => removeNotification(n.id)}>
                <span
                  className={`inline-block h-3 w-3 rounded-full mr-3 ${
                    n.severity === 'alta'
                      ? 'bg-red-500'
                      : n.severity === 'media'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                />
                <span className="text-sm text-slate-700">{n.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
