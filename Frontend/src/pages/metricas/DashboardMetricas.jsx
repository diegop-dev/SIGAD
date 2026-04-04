import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, GraduationCap, Activity, Plus, Loader2, BookOpen, BarChart2, LineChart as LineChartIcon, Filter, Hash } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { MetricasForm } from './MetricasForm';

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchData(); // Recargamos las métricas para que se actualicen las gráficas
  };

  // ✨ FILTRO EN CASCADA PARA EL SELECTOR DE CARRERAS
  const carrerasDropdown = useMemo(() => {
    if (!nivelFilter) return carreras;
    return carreras.filter(c => (c.nivel_academico || 'LICENCIATURA') === nivelFilter);
  }, [carreras, nivelFilter]);

  // ✨ FILTRO MAESTRO (PERIODO + NIVEL + CARRERA) PARA LAS BARRAS Y KPIS
  const metricasFiltradas = useMemo(() => {
    return metricas.filter(m => {
      const matchPeriodo = m.periodo_id.toString() === graficaPeriodo;
      const matchNivel = nivelFilter ? m.nivel_academico === nivelFilter : true;
      const matchCarrera = carreraFilter ? m.carrera_id.toString() === carreraFilter : true;
      return matchPeriodo && matchNivel && matchCarrera;
    });
  }, [metricas, graficaPeriodo, nivelFilter, carreraFilter]);

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
  }, [metricas, nivelFilter, carreraFilter]);

  // Tabla historial filtrada por nivel y carrera
  const tablaHistorial = useMemo(() => {
    return metricas.filter(m => {
      const matchNivel = nivelFilter ? m.nivel_academico === nivelFilter : true;
      const matchCarrera = carreraFilter ? m.carrera_id.toString() === carreraFilter : true;
      return matchNivel && matchCarrera;
    });
  }, [metricas, nivelFilter, carreraFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando panel de control y métricas de red...</p>
      </div>
    );
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
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

  // ── MAIN DASHBOARD VIEW ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
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

      {/* Filtros Flexibles */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center text-sm font-bold text-slate-700 whitespace-nowrap w-full sm:w-auto">
          <Filter className="w-4 h-4 mr-2 text-slate-400" />
          Filtrar panel por:
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <div className="bg-blue-50 p-4 rounded-full mr-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total inscritos</p>
            <h3 className="text-3xl font-black text-slate-800">{resumenKPIs.totalInscritos}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <div className="bg-emerald-50 p-4 rounded-full mr-4">
            <GraduationCap className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total egresados</p>
            <h3 className="text-3xl font-black text-slate-800">{resumenKPIs.totalEgresados}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center">
          <div className="bg-amber-50 p-4 rounded-full mr-4">
            <TrendingUp className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Promedio institucional</p>
            <h3 className="text-3xl font-black text-slate-800">{resumenKPIs.promedioGlobal}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 mr-2 text-blue-500" /> Retención estudiantil
          </h3>
          <div className="h-[300px] w-full">
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
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                No hay métricas capturadas para estos filtros.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-center">
            <LineChartIcon className="w-5 h-5 mr-2 text-amber-500" /> Evolución del promedio histórico
          </h3>
          <div className="h-[300px] w-full">
            {datosGraficaLineas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGraficaLineas} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                  <YAxis domain={['auto', 10]} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                  <Line type="monotone" dataKey="Promedio" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                No hay datos históricos suficientes.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics history table */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-slate-400" /> Historial detallado de métricas
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