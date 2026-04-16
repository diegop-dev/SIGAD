import { useState, useEffect } from 'react';
import { X, BookOpen, Layers, Loader2, Award, Hash, GraduationCap, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

import { MateriasModal } from '../materias/MateriasModal';
import { DocenteModal } from '../docentes/DocenteModal';

export const ViewCarreraModal = ({ carreraId, onClose }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');

  const [selectedMateria, setSelectedMateria] = useState(null);
  const [selectedDocente, setSelectedDocente] = useState(null);

  useEffect(() => {
    if (!carreraId) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/carreras/${carreraId}/detalles`);
        setData(response.data.data);
      } catch (error) {
        toast.error("Error al cargar detalles de la carrera.");
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [carreraId, onClose]);

  if (!carreraId) return null;

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl mx-auto overflow-hidden flex flex-col h-[85vh] sm:h-[75vh] max-h-[900px] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
          <div className="flex items-center text-white">
            <BookOpen className="w-6 h-6 mr-3 text-white" />
            <h3 className="text-xl font-black tracking-tight">Detalles del programa académico</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-20 flex-1">
            <Loader2 className="w-10 h-10 text-[#0B1828] animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Cargando información completa...</p>
          </div>
        ) : data && (
          <div className="flex flex-col flex-1 overflow-hidden">
            
            {/* Tabs */}
            <div className="flex items-center px-6 pt-4 border-b border-slate-100 bg-slate-50/50 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('resumen')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'resumen' 
                    ? 'border-[#0B1828] text-[#0B1828]' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Resumen General
              </button>
              <button
                onClick={() => setActiveTab('materias')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${
                  activeTab === 'materias' 
                    ? 'border-[#0B1828] text-[#0B1828]' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Materias
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-xs text-slate-600">
                  {data.materias?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('docentes')}
                className={`pb-3 px-4 font-bold text-sm border-b-2 transition-colors flex items-center whitespace-nowrap ${
                  activeTab === 'docentes' 
                    ? 'border-[#0B1828] text-[#0B1828]' 
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Docentes Vinculados
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-xs text-slate-600">
                  {data.docentes?.length || 0}
                </span>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white">
              
              {activeTab === 'resumen' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="h-20 w-20 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                      <BookOpen className="h-10 w-10 text-emerald-600" />
                    </div>
                    <div className="text-center sm:text-left">
                      <h4 className="text-2xl font-black text-[#0B1828] leading-tight flex flex-col sm:flex-row items-center gap-3">
                        {data.carrera.codigo_unico}
                        {data.carrera.estatus === 'ACTIVO' ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] uppercase font-black rounded-lg border border-emerald-200 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" /> Activo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-red-100 text-red-800 text-[10px] uppercase font-black rounded-lg border border-red-200">
                            Inactivo
                          </span>
                        )}
                      </h4>
                      <p className="text-lg font-bold text-slate-600 mt-1">{data.carrera.nombre_carrera}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm text-center sm:text-left">
                      <div className="text-slate-400 mb-1 flex justify-center sm:justify-start"><Layers className="w-5 h-5" /></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wilder mt-2">Modalidad</p>
                      <p className="text-base font-black text-[#0B1828]">{data.carrera.modalidad}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm text-center sm:text-left">
                      <div className="text-slate-400 mb-1 flex justify-center sm:justify-start"><Award className="w-5 h-5" /></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wilder mt-2">Nivel Académico</p>
                      <p className="text-base font-black text-[#0B1828]">{data.carrera.nivel_academico}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm sm:col-span-2 text-center sm:text-left">
                      <div className="text-slate-400 mb-1 flex justify-center sm:justify-start"><GraduationCap className="w-5 h-5" /></div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wilder mt-2">Academia Responsable</p>
                      <p className="text-base font-black text-[#0B1828]">{data.carrera.nombre_academia || 'Sin academia asignada'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'materias' && (
                <div className="animate-in fade-in duration-200">
                  {data.materias?.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                      <Hash className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No se han registrado materias activas para este programa.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {data.materias.map((materia) => (
                        <div 
                          key={materia.id_materia} 
                          onClick={() => setSelectedMateria(materia)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-md transition-all shadow-sm gap-2 cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center">
                              <span className="font-black text-[#0B1828] mr-2">{materia.codigo_unico}</span>
                              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-600">
                                {materia.tipo_asignatura}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-slate-600 mt-1">{materia.nombre}</p>
                          </div>
                          <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-0 mt-2 sm:mt-0">
                            <span className="block text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 rounded-lg sm:bg-transparent sm:px-0 sm:py-0">Créditos: {materia.creditos}</span>
                            {materia.periodo && <span className="block text-xs font-medium text-slate-400 sm:mt-1 truncate">{materia.periodo}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'docentes' && (
                <div className="animate-in fade-in duration-200">
                  {!data.carrera.academia_id ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                      <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Esta carrera no tiene academia asociada,<br/>por lo que no hay docentes previnculados.</p>
                    </div>
                  ) : data.docentes?.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                      <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">La academia responsable no cuenta con docentes activos actualmente.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {data.docentes.map((docente) => (
                        <div 
                          key={docente.id_docente} 
                          onClick={() => setSelectedDocente(docente)}
                          className="flex items-center p-4 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 hover:shadow-md transition-all shadow-sm cursor-pointer"
                        >
                          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm shrink-0 bg-slate-100 flex items-center justify-center">
                            {docente.foto_perfil_url ? (
                              <img src={`${API_BASE}${docente.foto_perfil_url}`} alt="perfil" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-slate-400 font-bold text-xs">{docente.nombres.charAt(0)}</span>
                            )}
                          </div>
                          <div className="ml-3 overflow-hidden text-left flex-1">
                            <p className="text-sm font-bold text-[#0B1828] truncate">{docente.nombres} {docente.apellido_paterno}</p>
                            <p className="text-xs font-medium text-slate-500 truncate">{docente.institutional_email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {selectedMateria && (
        <MateriasModal materia={selectedMateria} onClose={() => setSelectedMateria(null)} />
      )}
      
      {selectedDocente && (
        <DocenteModal docente={selectedDocente} onClose={() => setSelectedDocente(null)} />
      )}
    </div>
  );
};
