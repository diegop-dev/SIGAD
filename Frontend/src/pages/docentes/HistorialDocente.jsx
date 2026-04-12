import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Award, BookOpen, Clock, Users, X, Loader2, BarChart2, GraduationCap } from 'lucide-react';

const HistorialDocente = ({ docenteId, alCerrar }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await api.get(`/docentes/historial/${docenteId}`);
        setDatos(response.data);
      } catch (error) {
        toast.error("Error al cargar el historial del docente");
      } finally {
        setCargando(false);
      }
    };

    if (docenteId) cargarHistorial();
  }, [docenteId]);

  // ─── LÓGICA DE COLORES EXACTA DE AssignmentManagement.jsx ───
  const getTipoAsignaturaStyles = (tipo) => {
    if (tipo === 'TRONCO_COMUN') return 'bg-white text-slate-700 border-slate-300';
    if (tipo === 'OBLIGATORIA') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tipo === 'OPTATIVA') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all font-['Figtree']">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ── Cabecera del Modal ── */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-white">
          <h2 className="text-xl font-black text-slate-800 flex items-center">
            <BookOpen className="w-6 h-6 mr-3 text-blue-600" />
            Expediente y Cuadro Histórico
          </h2>
          <button onClick={alCerrar} className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargando ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-500">Consultando archivos de SIGAD...</p>
          </div>
        ) : !datos ? (
          <div className="text-center py-20 bg-white">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-sm font-bold text-slate-700">No se pudo cargar la información del expediente.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
            
            {/* ── Tarjeta de Perfil ── */}
            <div className="flex items-center gap-5 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
              <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {datos.perfil.nombres} {datos.perfil.apellido_paterno} {datos.perfil.apellido_materno}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-bold text-slate-600">
                  <span className="flex items-center px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                    <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> 
                    Nivel: {datos.perfil.nivel_academico || 'No registrado'}
                  </span>
                  <span className="flex items-center px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" /> 
                    Antigüedad: {datos.perfil.anos_antiguedad} años
                  </span>
                  <span className="flex items-center px-2.5 py-1 bg-slate-100 rounded-md border border-slate-200">
                    Matrícula: {datos.perfil.matricula_empleado}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Tabla de Historial ── */}
            <div className="flex items-center mb-4 px-1">
              <Users className="w-5 h-5 text-slate-400 mr-2" />
              <h3 className="text-lg font-bold text-slate-800">Materias Impartidas y Rendimiento</h3>
            </div>
            
            <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Periodo Académico</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Materia y Nivel</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Grupo</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Promedio y Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {datos.historial.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-16">
                          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-sm font-bold text-slate-700">Sin registro de clases anteriores.</p>
                          <p className="text-xs text-slate-500 mt-1">El historial docente está vacío.</p>
                        </td>
                      </tr>
                    ) : (
                      datos.historial.map((clase, index) => {
                        const esGrupoGlobal = !clase.grupo || clase.grupo === 'N/A' || clase.grupo === 'TRONCO COMÚN / GLOBAL';

                        return (
                          <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                            
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="inline-flex px-3 py-1.5 rounded-lg border bg-blue-50 text-blue-700 border-blue-100 text-xs font-bold">
                                {clase.periodo}
                              </div>
                            </td>
                            
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-slate-900 break-words max-w-[280px]">
                                {clase.materia}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {/* Insignia de Nivel Académico (Idéntica a AssignmentManagement) */}
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${clase.nivel_academico === 'MAESTRIA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                  {clase.nivel_academico || 'LICENCIATURA'}
                                </span>
                                
                                {/* Insignia de Tipo de Asignatura (Idéntica a AssignmentManagement) */}
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getTipoAsignaturaStyles(clase.tipo_asignatura)}`}>
                                  {(clase.tipo_asignatura || 'DESCONOCIDO').replace(/_/g, ' ')}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-bold ${esGrupoGlobal ? 'text-slate-400' : 'text-slate-700'}`}>
                                {esGrupoGlobal ? 'N/A' : clase.grupo}
                              </span>
                            </td>

                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col items-center gap-2">
                                {/* Badge de Promedio Consolidado */}
                                {clase.promedio_consolidado ? (
                                  <span className="px-3 py-1 rounded-lg border bg-violet-100 text-violet-800 border-violet-200 text-xs font-bold flex items-center shadow-sm">
                                    <BarChart2 className="w-3.5 h-3.5 mr-1.5" />
                                    Promedio: {Number(clase.promedio_consolidado).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="px-3 py-1 rounded-lg border bg-slate-100 text-slate-500 border-slate-200 text-xs font-bold">
                                    Sin promedio
                                  </span>
                                )}

                                {/* Estatus del Acta */}
                                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 bg-white">
                                  {clase.estatus_acta || 'HISTORIAL'}
                                </span>
                              </div>
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
        )}
      </div>
    </div>
  );
};

export default HistorialDocente;