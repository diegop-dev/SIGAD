import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Award, BookOpen, Clock, X, Loader2, BarChart2, 
  GraduationCap, AlertCircle, Hash, Calendar, Filter 
} from 'lucide-react';

const HistorialDocente = ({ docenteId, alCerrar }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [filtroActivo, setFiltroActivo] = useState('todos');

  useEffect(() => {
    const cargarHistorial = async () => {
      setCargando(true);
      try {
        const response = await api.get(`/docentes/historial/${docenteId}`);
        setDatos(response.data.data || response.data);
      } catch (error) {
        console.error("Error en la petición:", error);
        toast.error("Error al cargar el historial del docente");
        setDatos(null);
      } finally {
        setCargando(false);
      }
    };

    if (docenteId) cargarHistorial();
  }, [docenteId]);

  const handleExportarPDF = async () => {
    if (!datos || !docenteId) return;
    setExportando(true);
    try {
      const response = await api.get(`/docentes/historial/exportar-pdf/${docenteId}`, {
        responseType: 'blob',
      });

      const now = new Date();
      const fecha = now.toISOString().split('T')[0];
      const hora = now.toTimeString().split(' ')[0].replace(/:/g, '-').substring(0, 5);
      const nombreDocente = `${datos.perfil.nombres}_${datos.perfil.apellido_paterno}`.replace(/\s+/g, '_');

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `historial_${fecha}_${hora}_${nombreDocente}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success('Historial exportado correctamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al generar el PDF del historial');
    } finally {
      setExportando(false);
    }
  };

  const getTipoAsignaturaStyles = (tipo) => {
    const mapping = {
      'TRONCO_COMUN': 'bg-slate-100 text-[#0B1828] border-slate-200',
      'OBLIGATORIA': 'bg-[#0B1828]/10 text-[#0B1828] border-[#0B1828]/20',
      'OPTATIVA': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return mapping[tipo] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const agruparHistorial = (historial) => {
    if (!historial || !Array.isArray(historial)) return [];

    const grupos = [
      { id: 'pendientes', titulo: 'Pendiente por aceptar', icono: <Clock className="w-5 h-5 text-amber-500 mr-2" />, data: [] },
      { id: 'actuales', titulo: 'Actuales / cursando', icono: <BookOpen className="w-5 h-5 text-blue-500 mr-2" />, data: [] },
      { id: 'concluidas', titulo: 'Clases Concluidas', icono: <Award className="w-5 h-5 text-emerald-500 mr-2" />, data: [] },
      { id: 'rechazadas', titulo: 'Asignaciones Rechazadas', icono: <X className="w-5 h-5 text-red-500 mr-2" />, data: [] },
      { id: 'otros', titulo: 'Rechazadas por administrador', icono: <AlertCircle className="w-5 h-5 text-slate-500 mr-2" />, data: [] }
    ];

    historial.forEach(clase => {
      const conf = (clase.estatus_confirmacion || '').toUpperCase();
      const acta = (clase.estatus_acta || '').toUpperCase();
      
      if (conf === 'ENVIADA' && acta === 'ABIERTA') {
        grupos[0].data.push(clase);
      } else if (conf === 'ACEPTADA' && acta === 'ABIERTA') {
        grupos[1].data.push(clase);
      } else if (conf === 'ACEPTADA' && acta === 'CERRADA') {
        grupos[2].data.push(clase);
      } else if (conf === 'RECHAZADA') { 
        grupos[3].data.push(clase);
      } else {
        grupos[4].data.push(clase);
      }
    });

    return grupos
      .filter(g => g.data.length > 0)
      .filter(g => filtroActivo === 'todos' || g.id === filtroActivo);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh]">
        
        <div className="flex justify-between items-center px-6 py-5 border-b bg-[#0B1828] shrink-0">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-white/90" />
            <div>
              <h2 className="text-xl font-black text-white">Historial Académico</h2>
              <p className="text-sm font-medium text-white/60">Consulta de clases y rendimiento</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
               onClick={handleExportarPDF}
               disabled={exportando || cargando || !datos}
               className="flex items-center px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50 text-sm font-bold border border-white/10 shadow-sm"
             >
               {exportando ? (
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" />
               ) : (
                 <Award className="w-4 h-4 mr-2" />
               )}
               {exportando ? "Preparando..." : "Exportar PDF"}
            </button>

            <button 
              onClick={alCerrar} 
              className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-[#0B1828] animate-spin mb-4" />
              <p className="text-sm font-bold text-slate-500">Consultando archivos...</p>
            </div>
          ) : !datos || !datos.perfil ? (
            <div className="text-center py-20">
              <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-lg font-black text-[#0B1828]">No se pudo cargar la información</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-16 w-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center shrink-0">
                  <Award className="w-8 h-8 text-slate-300" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0B1828] tracking-tight">
                    {datos.perfil.nombres} {datos.perfil.apellido_paterno} {datos.perfil.apellido_materno}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold text-slate-600">
                    <span className="flex items-center px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                      Nivel: {datos.perfil.nivel_academico || 'N/A'}
                    </span>
                    <span className="flex items-center px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                      <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                      Antigüedad: {datos.perfil.anos_antiguedad} años
                    </span>
                    <span className="flex items-center px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                       <Hash className="w-3.5 h-3.5 mr-1 text-slate-400" /> 
                      {datos.perfil.matricula_empleado}
                    </span>
                  </div>
                </div>
              </div>

              {datos.historial && datos.historial.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <div className="flex items-center text-slate-400 mr-2 shrink-0">
                    <Filter className="w-4 h-4 mr-1" />
                    <span className="text-xs font-bold uppercase tracking-wider">Filtros:</span>
                  </div>
                  {[
                    { id: 'todos', label: 'Todas' },
                    { id: 'actuales', label: 'Cursando' },
                    { id: 'pendientes', label: 'Pendientes' },
                    { id: 'concluidas', label: 'Concluidas' },
                    { id: 'rechazadas', label: 'Rechazadas' },
                    { id: 'otros', label: 'Rechazadas (Admin)' }
                  ].map(filtro => (
                    <button
                      key={filtro.id}
                      onClick={() => setFiltroActivo(filtro.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border shrink-0 ${
                        filtroActivo === filtro.id 
                          ? 'bg-[#0B1828] text-white border-[#0B1828] shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {filtro.label}
                    </button>
                  ))}
                </div>
              )}

              {!datos.historial || datos.historial.length === 0 ? (
                <div className="bg-slate-50 rounded-3xl border border-slate-100 text-center py-16 mt-4">
                  <div className="bg-white shadow-sm w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin historial</h3>
                  <p className="text-sm font-medium text-slate-500">No hay registro de clases asignadas.</p>
                </div>
              ) : (
                agruparHistorial(datos.historial).length === 0 ? (
                  <div className="bg-slate-50 rounded-3xl border border-slate-100 text-center py-16 mt-4 animate-in fade-in duration-300">
                    <div className="bg-white shadow-sm w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Filter className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin coincidencias</h3>
                    <p className="text-sm font-medium text-slate-500 mb-4">No hay asignaciones en esta categoría.</p>
                    <button 
                      onClick={() => setFiltroActivo('todos')}
                      className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0B1828] hover:bg-slate-50 shadow-sm transition-all"
                    >
                      Ver todas las clases
                    </button>
                  </div>
                ) : (
                  agruparHistorial(datos.historial).map((grupo) => (
                    <div key={grupo.id} className="mb-10 last:mb-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      
                      <div className="flex items-center mb-4">
                        {grupo.icono}
                        <h3 className="text-lg font-black text-[#0B1828] tracking-tight">{grupo.titulo}</h3>
                        <span className="ml-3 px-3 py-1 bg-slate-100 text-[#0B1828] rounded-lg text-xs font-black">
                          {grupo.data.length}
                        </span>
                      </div>
                      
                      <div className="bg-white shadow-sm rounded-3xl border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-slate-100">
                            <thead className="bg-[#0B1828]">
                              <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">Periodo</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">Materia</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-white uppercase tracking-wider">Grupo</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-white uppercase tracking-wider">Rendimiento</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50 text-sm">
                              {grupo.data.map((clase, idx) => {
                                const esGrupoGlobal = !clase.grupo || clase.grupo === 'N/A' || clase.grupo === 'TRONCO COMÚN / GLOBAL';

                                return (
                                  <tr key={clase.id_historial || idx} className="hover:bg-slate-50/80 transition-colors duration-150">
                                    
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg border bg-slate-50 text-[#0B1828] border-slate-200 text-xs font-bold shadow-sm">
                                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                        {clase.periodo}
                                      </span>
                                    </td>
                                    
                                    <td className="px-6 py-5 min-w-[250px] max-w-[350px] whitespace-normal">
                                      <div className="font-black text-[#0B1828] mb-2 leading-snug">
                                        {clase.materia}
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${clase.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                          {clase.nivel_academico || 'LICENCIATURA'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getTipoAsignaturaStyles(clase.tipo_asignatura)}`}>
                                          {(clase.tipo_asignatura || '').replace(/_/g, ' ')}
                                        </span>
                                      </div>
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <span className={`font-bold ${esGrupoGlobal ? 'text-slate-400 italic text-xs' : 'text-[#0B1828]'}`}>
                                        {esGrupoGlobal ? 'N/A' : clase.grupo}
                                      </span>
                                    </td>

                                    <td className="px-6 py-5 whitespace-nowrap text-center">
                                      {clase.promedio_consolidado ? (
                                        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-50 text-[#0B1828] border border-slate-200 text-xs font-black shadow-sm">
                                          <BarChart2 className="w-4 h-4 mr-2 text-slate-400" />
                                          {Number(clase.promedio_consolidado).toFixed(2)}
                                        </div>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">PENDIENTE</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-5 flex justify-end shrink-0">
          <button 
            onClick={alCerrar}
            className="px-8 py-3 bg-[#0B1828] text-white rounded-xl text-sm font-black hover:bg-[#162840] hover:shadow-[#0B1828]/30 transition-all active:scale-95 shadow-lg"
          >
            Cerrar historial
          </button>
        </div>

      </div>
    </div>
  );
};

export default HistorialDocente;