import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, GraduationCap, Activity, Plus, Loader2, BookOpen, BarChart2, LineChart as LineChartIcon, Filter, Hash, ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [carreraFilter, setCarreraFilter] = useState(''); 

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resMetricas, resPeriodos, resCarreras] = await Promise.all([
        api.get('/metricas').catch(e => { console.error("Error métricas:", e); return { data: [] }; }),
        api.get('/periodos').catch(e => { console.error("Error periodos:", e); return { data: [] }; }),
        api.get('/carreras').catch(e => { console.error("Error carreras:", e); return { data: [] }; })
      ]);

      const rawM = resMetricas.data?.data || resMetricas.data;
      const rawP = resPeriodos.data?.data || resPeriodos.data;
      const rawC = resCarreras.data?.data || resCarreras.data;

      const metricasDataRaw = Array.isArray(rawM) ? rawM : [];
      const periodosData = Array.isArray(rawP) ? rawP : [];
      const carrerasData = Array.isArray(rawC) ? rawC : [];

      const metricasEnriquecidas = metricasDataRaw.map(m => {
        const carreraAsociada = carrerasData.find(c => Number(c.id_carrera) === Number(m.carrera_id));
        return {
          ...m,
          codigo_unico: carreraAsociada?.codigo_unico || m.nombre_carrera,
          nivel_academico: carreraAsociada?.nivel_academico || 'LICENCIATURA'
        };
      });

      setMetricas(metricasEnriquecidas);
      setPeriodos(periodosData);
      setCarreras(carrerasData);

      if (periodosData.length > 0 && !graficaPeriodo) {
        setGraficaPeriodo(periodosData[0].id_periodo.toString());
      }
    } catch (error) {
      console.error("Error crítico al cargar datos del dashboard:", error);
      toast.error("Ocurrió un error al cargar el panel de control institucional.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchData(); 
  };

  const carrerasDropdown = useMemo(() => {
    if (!nivelFilter) return carreras;
    return carreras.filter(c => (c.nivel_academico || 'LICENCIATURA') === nivelFilter);
  }, [carreras, nivelFilter]);

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

  const tablaHistorial = useMemo(() => {
    return metricas.filter(m => {
      const matchNivel = nivelFilter ? m.nivel_academico === nivelFilter : true;
      const matchCarrera = carreraFilter ? m.carrera_id.toString() === carreraFilter : true;
      return matchNivel && matchCarrera;
    });
  }, [metricas, nivelFilter, carreraFilter]);

  const totalPages = Math.ceil(tablaHistorial.length / itemsPerPage) || 1;
  const paginatedHistorial = tablaHistorial.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [graficaPeriodo, nivelFilter, carreraFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="h-10 w-10 text-[#0B1828] animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Consultando el panel de control y métricas de red...</p>
      </div>
    );
  }

  if (showForm && isSuperAdmin) {
    return (
      <MetricasForm 
        periodos={periodos} 
        onBack={() => setShowForm(false)} 
        onSuccess={handleFormSuccess} 
      />
    );
  }

  // Clase unificada para los selects de filtro
  const filterInputClass = "block w-full pl-11 pr-10 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm py-3.5 transition-all duration-200 text-[#0B1828] font-medium shadow-sm outline-none appearance-none cursor-pointer";

  return (
    <div className="space-y-6 relative animate-in fade-in duration-200">

      {/* Encabezado Navy Estandarizado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Activity className="w-7 h-7 mr-3 text-white/90" />
            Métricas institucionales
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Métricas de rendimiento académico y retención estudiantil.
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center px-6 py-3.5 bg-white text-[#0B1828] rounded-xl hover:bg-slate-50 transition-all duration-200 shadow-sm active:scale-95 font-black text-sm shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5 mr-2" /> Nueva métrica
          </button>
        )}
      </div>

      {/* Filtros Estandarizados */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        
        <div className="flex-1 relative flex items-center">
          <Calendar className="h-5 w-5 text-slate-400 absolute left-4 z-10 pointer-events-none" />
          <select
            value={graficaPeriodo}
            onChange={(e) => setGraficaPeriodo(e.target.value)}
            className={filterInputClass}
          >
            {periodos.length === 0 && <option value="">Sin periodos</option>}
            {periodos.map(p => (
              <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex-1 relative flex items-center">
          <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
          <select
            value={nivelFilter}
            onChange={(e) => {
              setNivelFilter(e.target.value);
              setCarreraFilter(''); 
            }}
            className={filterInputClass}
          >
            <option value="">Todos los niveles</option>
            <option value="LICENCIATURA">Licenciatura</option>
            <option value="MAESTRIA">Maestría</option>
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>

        <div className="flex-1 relative flex items-center">
          <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
          <select
            value={carreraFilter}
            onChange={(e) => setCarreraFilter(e.target.value)}
            className={filterInputClass}
          >
            <option value="">Todas las carreras</option>
            {carrerasDropdown.map(c => (
              <option key={c.id_carrera} value={c.id_carrera}>{c.codigo_unico || c.nombre_carrera}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>

      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center transition-all hover:shadow-md">
          <div className="bg-blue-50 p-4 rounded-2xl mr-5 border border-blue-100">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total inscritos</p>
            <h3 className="text-3xl font-black text-[#0B1828] leading-none">{resumenKPIs.totalInscritos}</h3>
          </div>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center transition-all hover:shadow-md">
          <div className="bg-emerald-50 p-4 rounded-2xl mr-5 border border-emerald-100">
            <GraduationCap className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total egresados</p>
            <h3 className="text-3xl font-black text-[#0B1828] leading-none">{resumenKPIs.totalEgresados}</h3>
          </div>
        </div>
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center transition-all hover:shadow-md">
          <div className="bg-amber-50 p-4 rounded-2xl mr-5 border border-amber-100">
            <TrendingUp className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Promedio global</p>
            <h3 className="text-3xl font-black text-[#0B1828] leading-none">{resumenKPIs.promedioGlobal}</h3>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-[#0B1828] mb-6 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 mr-2 text-blue-600" /> Retención Estudiantil
          </h3>
          <div className="h-[300px] w-full">
            {datosGraficaBarras.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGraficaBarras} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="carrera" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label, payload) => payload[0]?.payload?.carreraCompleta || label}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Bar dataKey="Inscritos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Egresados" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                No hay métricas capturadas para los filtros actuales.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-[#0B1828] mb-6 flex items-center justify-center">
            <LineChartIcon className="w-5 h-5 mr-2 text-amber-500" /> Evolución del Promedio Histórico
          </h3>
          <div className="h-[300px] w-full">
            {datosGraficaLineas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGraficaLineas} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 'bold' }} />
                  <YAxis domain={['auto', 100]} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Promedio" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b' }} activeDot={{ r: 6, fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                No hay datos históricos suficientes para trazar la evolución.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabla Histórica Estandarizada Paginada */}
      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-[#0B1828]">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Periodo</th>
                <th className="px-6 py-5 text-left text-xs font-black text-white uppercase tracking-wider">Programa Educativo</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Inscritos</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Egresados</th>
                <th className="px-6 py-5 text-center text-xs font-black text-white uppercase tracking-wider">Promedio</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {paginatedHistorial.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
                        <BarChart2 className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin registros históricos</h3>
                      <p className="text-sm text-slate-500 font-medium">No hay métricas capturadas que coincidan con tus filtros actuales.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistorial.map((m) => (
                  <tr key={m.id_metrica} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-[#0B1828]">{m.nombre_periodo}</td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-sm font-black text-[#0B1828]">{m.nombre_carrera}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-slate-500 flex items-center">
                            <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {m.codigo_unico}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider border shadow-sm ${m.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                            {m.nivel_academico || 'LICENCIATURA'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center font-bold">{m.total_inscritos}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center font-bold">{m.total_egresados}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 shadow-sm">
                        {Number(m.promedio_general).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Estandarizada */}
        {!isLoading && tablaHistorial.length > 0 && (
          <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mostrando <span className="font-bold text-[#0B1828]">{(currentPage - 1) * itemsPerPage + 1}</span> al{' '}
                <span className="font-bold text-[#0B1828]">{Math.min(currentPage * itemsPerPage, tablaHistorial.length)}</span> de{' '}
                <span className="font-bold text-[#0B1828]">{tablaHistorial.length}</span> registros
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

    </div>
  );
};