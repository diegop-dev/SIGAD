import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Printer, Search, FileText, Calendar, X, MapPin, Loader2, Download } from 'lucide-react';

const DIAS_SEMANA = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom'
};

const ReporteAsignaciones = ({ alCerrar }) => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [agruparPor, setAgruparPor] = useState('docente'); // docente, aula, o ''

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const response = await api.get('/reportes/asignaciones');
        setAsignaciones(response.data);
      } catch (error) {
        toast.error('Error al cargar el reporte de asignaciones');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const handleExportarPDF = async () => {
    if (asignaciones.length === 0) return;
    setExportando(true);
    try {
      const params = {};
      if (busqueda.trim()) params.texto = busqueda.trim();
      if (agruparPor) params.agruparPor = agruparPor;

      const response = await api.get('/reportes/exportar-pdf', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_asignaciones_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setExportando(false);
    }
  };

  const datosFiltrados = asignaciones.filter(item => 
    item.docente.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.materia.toLowerCase().includes(busqueda.toLowerCase())
  );

  const formatHora = (hora) => hora ? hora.substring(0, 5) : '';

  const getStatusBadge = (estatus) => {
    const statusMap = {
      'ENVIADA': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACEPTADA': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'RECHAZADA': 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${statusMap[estatus] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {estatus || 'DESCONOCIDO'}
      </span>
    );
  };

  const getTipoAsignaturaStyles = (tipo) => {
    if (tipo === 'TRONCO_COMUN') return 'bg-white text-slate-700 border-slate-300';
    if (tipo === 'OBLIGATORIA') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tipo === 'OPTATIVA') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 transition-all">
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-7xl p-5 max-h-[95vh] overflow-y-auto">
        
        {/* ── Header Estilo Audit Log ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-[#0B1828] p-6 rounded-2xl shadow-md border border-slate-800 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
              <FileText className="w-8 h-8 mr-3 text-white/90" />
              Informe de Asignaciones
            </h1>
            <p className="mt-1.5 text-sm text-white/60 font-medium">
              Consulta y exportación profesional de cargas horarias.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-center relative z-10">
             <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Buscar docente o materia..." 
                    className="w-full pl-11 pr-4 py-2.5 border-slate-700 bg-slate-800 text-white focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 rounded-xl text-sm transition-all outline-none border"
                    value={busqueda} 
                    onChange={(e) => setBusqueda(e.target.value)}
                  />
                </div>

                <div className="relative flex-1 md:w-48">
                  <select
                    value={agruparPor}
                    onChange={(e) => setAgruparPor(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 border-slate-700 bg-slate-800 text-white focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-900/50 rounded-xl text-sm transition-all outline-none border appearance-none font-bold"
                  >
                    <option value="">Sin agrupación</option>
                    <option value="docente">Por Docente</option>
                    <option value="aula">Por Aula</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <Printer className="w-4 h-4" />
                  </div>
                </div>
             </div>
            
            <button 
              onClick={handleExportarPDF}
              disabled={exportando || datosFiltrados.length === 0}
              className="flex items-center gap-2 bg-white text-[#0B1828] px-6 py-2.5 rounded-xl hover:bg-slate-100 transition-all text-sm font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 whitespace-nowrap"
            >
              {exportando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {exportando ? "Generando..." : "Exportar PDF"}
            </button>
            
            <button 
              onClick={alCerrar} 
              className="ml-2 p-2.5 text-white/50 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>


        {/* ── Tabla ── */}
        <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-[#0B1828]">
                <tr>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Docente titular
                  </th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Materia y Grupo
                  </th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Horario y Aula
                  </th>
                  <th scope="col" className="px-4 py-4 text-left text-xs font-black text-white uppercase tracking-wider">
                    Estatus
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-50">
                {cargando ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 text-[#0B1828] animate-spin mb-4" />
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Generando vista preeliminar...</p>
                      </div>
                    </td>
                  </tr>
                ) : datosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-20 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-slate-50 p-6 rounded-full mb-4 border border-slate-100">
                          <FileText className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin resultados</h3>
                        <p className="text-sm text-slate-400 font-medium">No se encontraron asignaciones para mostrar.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  datosFiltrados.map((item) => {
                    const materiaType = item.tipo_materia || 'DESCONOCIDO';
                    const academicLevel = item.nivel_academico || 'LICENCIATURA';
                    const esGrupoGlobal = item.grupo === 'N/A' || item.grupo === 'TRONCO COMÚN / GLOBAL';

                    return (
                      <tr key={item.id_asignacion} className="hover:bg-slate-50/80 transition-colors duration-150">
                        <td className="px-4 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-[#0B1828]">{item.docente}</div>
                          <div className="text-xs text-slate-400 mt-1 font-medium">Matrícula: {item.matricula_empleado}</div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="text-sm font-black text-slate-800 break-words max-w-[250px]">{item.materia}</div>
                          <div className="text-xs text-slate-500 font-medium mt-2 flex flex-wrap items-center gap-2">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                              {esGrupoGlobal ? item.periodo : `Grupo: ${item.grupo} • ${item.periodo}`}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border shadow-sm ${academicLevel === 'MAESTRIA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                              {academicLevel}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border shadow-sm ${getTipoAsignaturaStyles(materiaType)}`}>
                              {materiaType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center text-xs font-black px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 w-max shadow-sm">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-[#0B1828]" />
                              {DIAS_SEMANA[item.dia_semana]}: {formatHora(item.hora_inicio)} - {formatHora(item.hora_fin)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 font-bold flex items-center gap-1.5 ml-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              Aula: <span className="text-[#0B1828]">{item.aula}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 whitespace-nowrap">
                          {getStatusBadge(item.estatus_confirmacion)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReporteAsignaciones;