import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Activity, Users, BookOpen, Clock, TrendingUp } from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState('--');

  // Función para determinar el saludo según la hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Efecto para consultar estadísticas reales desde el backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Consultamos el listado y filtramos solo los activos
        const response = await api.get('/users');
        const count = response.data.filter(u => u.estatus === 'ACTIVO').length;
        setActiveUsers(count);
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };

    // Respetamos el control de acceso: solo administradores pueden consultar todos los usuarios
    if (user?.rol_id === 1 || user?.rol_id === 2) {
      fetchStats();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      
      {/* Cabecera del Dashboard */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Decoración geométrica sutil en el fondo de la cabecera */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 blur-xl"></div>
        <div className="absolute bottom-0 right-12 w-16 h-16 bg-blue-100 rounded-full opacity-50 blur-lg"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {getGreeting()}, <span className="text-blue-600">{user?.nombres.split(' ')[0]} {user?.apellido_paterno}</span>
          </h1>
          <p className="mt-2 text-slate-500 font-medium flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-400" />
            {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Grid de Tarjetas de Indicadores (KPIs) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        
        {/* KPI: Usuarios Activos */}
        <div className="group cursor-pointer">
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl border border-slate-100 relative h-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Usuarios activos
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-4xl font-black text-slate-900">{activeUsers}</p>
                    {user?.rol_id <= 2 && (
                      <span className="text-sm font-medium text-green-600 flex items-center bg-green-50 px-2 py-0.5 rounded-full">
                        <TrendingUp className="w-3 h-3 mr-1" /> Real
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl group-hover:bg-blue-600 transition-colors duration-300">
                  <Users className="h-8 w-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
            </div>
            {/* Barra de progreso inferior decorativa */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
              <div className="h-full bg-blue-600 w-3/4"></div>
            </div>
          </div>
        </div>

        {/* KPI: Materias Registradas */}
        <div className="group cursor-pointer">
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl border border-slate-100 relative h-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Materias registradas
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-4xl font-black text-slate-900">--</p>
                  </div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors duration-300">
                  <BookOpen className="h-8 w-8 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
              <div className="h-full bg-indigo-500 w-1/4"></div>
            </div>
          </div>
        </div>

        {/* KPI: Estado del Periodo */}
        <div className="group cursor-pointer">
          <div className="bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl border border-slate-100 relative h-full">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Estado del periodo
                  </p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-2xl font-black text-emerald-600">Activo</p>
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl group-hover:bg-emerald-500 transition-colors duration-300">
                  <Activity className="h-8 w-8 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50">
              <div className="h-full bg-emerald-500 w-full"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
