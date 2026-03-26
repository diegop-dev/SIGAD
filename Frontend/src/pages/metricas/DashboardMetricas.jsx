import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line,
  PieChart, Pie
} from 'recharts';
import {
  TrendingUp, Users, GraduationCap, Activity,
  Plus, Loader2, BookOpen, BarChart2,
  LineChart as LineChartIcon, Filter,
  PieChart as PieChartIcon
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { MetricasForm } from './MetricasForm';


/* ── Tooltip personalizado del donut ────────────────────────── */
const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const total = item.payload.total;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-2.5 text-sm">
      <p className="font-bold text-slate-700">{item.name}</p>
      <p className="text-slate-500">
        <span className="font-black text-slate-800 text-base">{item.value}</span>
        {total > 0 && (
          <span className="text-slate-400 ml-1">
            ({((item.value / total) * 100).toFixed(1)}%)
          </span>
        )}
      </p>
    </div>
  );
};

/* ── Placeholder vacío para gráficos ────────────────────────── */
const EmptyChart = ({ label }) => (
  <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
    <BarChart2 className="w-8 h-8 opacity-40" />
    <p className="text-sm font-medium text-center">{label}</p>
  </div>
);

/* ── Componente principal ───────────────────────────────────── */
export const DashboardMetricas = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.rol_id === 1;

  const [metricas, setMetricas] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [graficaPeriodo, setGraficaPeriodo] = useState('');
  const [nivelFilter, setNivelFilter] = useState(''); 
  const [carreraFilter, setCarreraFilter] = useState(''); // ✨ NUEVO ESTADO PARA EL FILTRO DE CARRERA

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resMetricas, resPeriodos, resCarreras] = await Promise.all([
        api.get('/metricas').catch(e => { console.error("Error métricas:", e); return { data: [] }; }),
        api.get('/periodos').catch(e => { console.error("Error periodos:", e); return { data: [] }; }),
        api.get('/carreras').catch(e => { console.error("Error carreras:", e); return { data: [] }; })
      ]);

      const metricasDataRaw = resMetricas.data?.data || resMetricas.data || [];
      const periodosData = resPeriodos.data?.data || resPeriodos.data || [];
      const carrerasData = resCarreras.data?.data || resCarreras.data || [];

      // ENRIQUECEMOS LAS MÉTRICAS CRUZÁNDOLAS CON SU CARRERA PARA OBTENER EL CÓDIGO Y NIVEL
      const metricasEnriquecidas = metricasDataRaw.map(m => {
        const carreraAsociada = carrerasData.find(c => Number(c.id_carrera) === Number(m.carrera_id));
        return {
          ...m,
          codigo_unico: carreraAsociada?.codigo_unico || m.nombre_carrera,
          nivel_academico: carreraAsociada?.nivel_academico || 'LICENCIATURA'
        };
      });

      setMetricas(Array.isArray(metricasEnriquecidas) ? metricasEnriquecidas : []);
      setPeriodos(Array.isArray(periodosData) ? periodosData : []);
      setCarreras(Array.isArray(carrerasData) ? carrerasData : []);

      if (Array.isArray(periodosData) && periodosData.length > 0 && !graficaPeriodo) {
        setGraficaPeriodo(periodosData[0].id_periodo.toString());
      }
    } catch (error) {
      console.error("Error crítico al cargar datos del dashboard:", error);
      toast.error("Error al cargar el panel de control.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchData();
  };

  /* ── Datos derivados ──────────────────────────────────────── */
  const datosGraficaBarras = useMemo(() => {
    if (!graficaPeriodo) return [];
    return metricasFiltradas.map(m => ({
      carrera: m.codigo_unico, 
      carreraCompleta: m.nombre_carrera,
      Inscritos: m.total_inscritos,
      Egresados: m.total_egresados
    }));
  }, [metricasFiltradas]);

  const resumenKPIs = useMemo(() => {
    const totalInscritos = metricasFiltradas.reduce((acc, m) => acc + m.total_inscritos, 0);
    const totalEgresados = metricasFiltradas.reduce((acc, m) => acc + m.total_egresados, 0);
    const promedioSuma = metricasFiltradas.reduce((acc, m) => acc + parseFloat(m.promedio_general), 0);
    const promedioGlobal = metricasFiltradas.length > 0 ? (promedioSuma / metricasFiltradas.length).toFixed(2) : 0;

    return { totalInscritos, totalEgresados, promedioGlobal };
  }, [metricasFiltradas]);

  // ✨ EVOLUCIÓN HISTÓRICA: Se filtra por nivel y carrera (ignora periodo para ver la línea de tiempo completa)
  const datosGraficaLineas = useMemo(() => {
    const promediosPorPeriodo = {};
    
    const metricasHistorial = metricas.filter(m => {
      const matchNivel = nivelFilter ? m.nivel_academico === nivelFilter : true;
      const matchCarrera = carreraFilter ? m.carrera_id.toString() === carreraFilter : true;
      return matchNivel && matchCarrera;
    });

    metricasHistorial.forEach(m => {
      if (!promediosPorPeriodo[m.nombre_periodo]) {
        promediosPorPeriodo[m.nombre_periodo] = { suma: 0, count: 0 };
      }
      promediosPorPeriodo[m.nombre_periodo].suma += parseFloat(m.promedio_general);
      promediosPorPeriodo[m.nombre_periodo].count += 1;
    });
    return Object.keys(promediosPorPeriodo).map(periodo => ({
      periodo,
      Promedio: (promediosPorPeriodo[periodo].suma / promediosPorPeriodo[periodo].count).toFixed(2)
    })).reverse();
  }, [metricas]);

  const resumenKPIs = useMemo(() => {
    const dataFiltrada = metricas.filter(m => m.periodo_id.toString() === graficaPeriodo);
    const totalInscritos = dataFiltrada.reduce((acc, m) => acc + m.total_inscritos, 0);
    const totalEgresados = dataFiltrada.reduce((acc, m) => acc + m.total_egresados, 0);
    const promedioSuma = dataFiltrada.reduce((acc, m) => acc + parseFloat(m.promedio_general), 0);
    const promedioGlobal = dataFiltrada.length > 0 ? (promedioSuma / dataFiltrada.length).toFixed(2) : 0;
    return { totalInscritos, totalEgresados, promedioGlobal };
  }, [metricas, graficaPeriodo]);

  const datosGraficaPastel = useMemo(() => {
    const { totalInscritos, totalEgresados } = resumenKPIs;
    if (totalInscritos === 0) return [];
    const enCurso = Math.max(0, totalInscritos - totalEgresados);
    return [
      { name: 'Egresados', value: totalEgresados, total: totalInscritos, fill: '#10b981' },
      { name: 'En curso', value: enCurso, total: totalInscritos, fill: '#3b82f6' },
    ];
  }, [resumenKPIs]);

  /* ── Loading ──────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando panel de control y métricas...</p>
      </div>
    );
  }

  /* ── Vista formulario ─────────────────────────────────────── */
  if (showForm && isSuperAdmin) {
    return (
      <MetricasForm
        periodos={periodos}
        carreras={carreras}
        onBack={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
      />
    );
  }

  /* ── Vista principal ──────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Activity className="w-8 h-8 mr-3 text-blue-600" />
            Panel de control institucional
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Métricas de rendimiento académico y retención estudiantil de SIGAD.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
          >
            <Plus className="w-5 h-5 mr-2" /> Nueva métrica
          </button>
        )}
      </div>

      {/* Filtro de periodo */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 whitespace-nowrap">
          <Filter className="w-4 h-4 text-slate-400" />
          Viendo estadísticas del periodo:
        </div>
        
        <select
          value={graficaPeriodo}
          onChange={(e) => setGraficaPeriodo(e.target.value)}
          className="block w-full sm:flex-1 min-w-[150px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer font-bold text-slate-700"
        >
          {periodos.map(p => (
            <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>
          ))}
        </select>

        <select
          value={nivelFilter}
          onChange={(e) => {
            setNivelFilter(e.target.value);
            setCarreraFilter(''); // Limpiamos la carrera si cambia el nivel
          }}
          className="block w-full sm:flex-1 min-w-[150px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer font-bold text-slate-700"
        >
          <option value="">Niveles: Todos</option>
          <option value="LICENCIATURA">Licenciatura</option>
          <option value="MAESTRIA">Maestría</option>
        </select>

        {/* ✨ NUEVO SELECTOR DE CARRERA (Usando solo el Código Único) */}
        <select
          value={carreraFilter}
          onChange={(e) => setCarreraFilter(e.target.value)}
          className="block w-full sm:flex-1 min-w-[150px] rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 px-4 transition-all duration-200 appearance-none cursor-pointer font-bold text-slate-700"
        >
          <option value="">Programa: Todos</option>
          {carrerasDropdown.map(c => (
            <option key={c.id_carrera} value={c.id_carrera}>{c.codigo_unico || c.nombre_carrera}</option>
          ))}
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total inscritos', value: resumenKPIs.totalInscritos, icon: Users, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Total egresados', value: resumenKPIs.totalEgresados, icon: GraduationCap, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Promedio institucional', value: resumenKPIs.promedioGlobal, icon: TrendingUp, bg: 'bg-amber-50', color: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <div key={label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`${bg} p-4 rounded-xl`}>
              <Icon className={`w-8 h-8 ${color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
              <h3 className="text-3xl font-black text-slate-800">{value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos fila 1: Barras + Pastel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Barras */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" /> Retención estudiantil por carrera
          </h3>
          <div className="h-[280px]">
            {datosGraficaBarras.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGraficaBarras} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="carrera" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.carreraCompleta || label}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="Inscritos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresados" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No hay métricas capturadas para el periodo actual." />
            )}
          </div>
        </div>

        {/* Pastel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-500" /> Distribución inscritos vs. egresados
          </h3>
          <div className="h-[280px]">
            {datosGraficaPastel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosGraficaPastel}
                    cx="50%"
                    cy="50%"
                    innerRadius="52%"
                    outerRadius="78%"
                    paddingAngle={3}
                    dataKey="value"
                  />
                  <Tooltip content={<CustomPieTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No hay métricas para calcular la distribución." />
            )}
          </div>
        </div>
      </div>

      {/* Gráfico fila 2: Líneas (ancho completo) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
          <LineChartIcon className="w-5 h-5 text-amber-500" /> Evolución del promedio histórico
        </h3>
        <div className="h-[240px]">
          {datosGraficaLineas.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosGraficaLineas} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={['auto', 10]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="Promedio" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No hay datos históricos suficientes en el sistema." />
          )}
        </div>
      </div>

      {/* Tabla historial */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-400" /> Historial detallado de métricas
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[300px]">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Periodo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Programa Educativo</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Inscritos</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Egresados</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Promedio</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {tablaHistorial.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <BarChart2 className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin registros históricos</h3>
                      <p className="text-sm text-slate-500">No hay métricas capturadas que coincidan con tu filtro.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tablaHistorial.map((m) => (
                  <tr key={m.id_metrica} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-bold text-slate-700">{m.nombre_periodo}</td>
                    
                    <td className="px-6 py-3 whitespace-nowrap">
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-slate-900 flex items-center">
                          <Hash className="w-3 h-3 mr-1 text-slate-400" />
                          {m.codigo_unico}
                        </span>
                        <span className={`mt-1.5 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${m.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                          {m.nivel_academico || 'LICENCIATURA'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-center font-bold">{m.total_inscritos}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600 text-center font-bold">{m.total_egresados}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        {m.promedio_general}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
