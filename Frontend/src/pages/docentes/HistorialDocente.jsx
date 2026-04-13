import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
<<<<<<< HEAD
import { Award, BookOpen, Clock, Users, X, AlertCircle } from 'lucide-react'; 
=======
import { Award, BookOpen, Clock, Users, X, Loader2, BarChart2, GraduationCap } from 'lucide-react';
>>>>>>> f077882590116f3213427c490c599d2888b309b2

const HistorialDocente = ({ docenteId, alCerrar }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setCargando(true); 
        const response = await api.get(`/docentes/historial/${docenteId}`); 
        setDatos(response.data);
      } catch (error) {
        toast.error("Error al cargar el historial del docente");
        setDatos(null); 
      } finally {
        setCargando(false);
      }
    };

    if (docenteId) cargarHistorial();
  }, [docenteId]);

<<<<<<< HEAD

  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      alCerrar();
    }
  };

  const perfil = datos?.perfil;
  const historial = datos?.historial || [];

  return (
    <div 
      id="modal-overlay"
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 transition-all cursor-pointer"
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto cursor-default">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Expediente Docente</h2>
          <button onClick={alCerrar} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-50 p-1.5 rounded-lg hover:bg-red-50">
=======
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
>>>>>>> f077882590116f3213427c490c599d2888b309b2
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargando ? (
<<<<<<< HEAD
         
          <div className="text-center p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Consultando archivos...</p>
          </div>
        ) : !datos ? (
    
          <div className="text-center p-10 bg-red-50 border border-red-100 rounded-xl flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-600 font-medium">No se pudo cargar la información del docente.</p>
          </div>
        ) : (
          <>
       
            <div className="flex items-start gap-4 mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="p-3 bg-blue-600 text-white rounded-full shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {perfil?.nombres} {perfil?.apellido_paterno} {perfil?.apellido_materno}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 font-medium">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-500"/> {perfil?.nivel_academico || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500"/> Antigüedad: {perfil?.anos_antiguedad || 0} años
=======
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
>>>>>>> f077882590116f3213427c490c599d2888b309b2
                  </span>
                </div>
              </div>
            </div>

            {/* ── Tabla de Historial ── */}
            <div className="flex items-center mb-4 px-1">
              <Users className="w-5 h-5 text-slate-400 mr-2" />
              <h3 className="text-lg font-bold text-slate-800">Materias Impartidas y Rendimiento</h3>
            </div>
            
<<<<<<< HEAD
            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Periodo</th>
                    <th className="px-4 py-3 font-semibold">Materia</th>
                    <th className="px-4 py-3 font-semibold">Grupo</th>
                    <th className="px-4 py-3 font-semibold text-center">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400 font-medium">
                        Sin registro de clases anteriores.
                      </td>
                    </tr>
                  ) : (
                    historial.map((clase, index) => (
                      <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-800">{clase.periodo}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">{clase.materia}</td>
                        <td className="px-4 py-3 text-gray-600">{clase.grupo}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-md font-bold text-xs tracking-wide ${
                            clase.promedio_consolidado >= 8 ? 'bg-emerald-100 text-emerald-700' : 
                            clase.promedio_consolidado ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {clase.promedio_consolidado ? clase.promedio_consolidado : 'N/A'}
                          </span>
=======
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
>>>>>>> f077882590116f3213427c490c599d2888b309b2
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