import { X, BookOpen, UserCheck, Calendar, FileText, Shield, Loader2, Bookmark, GraduationCap } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../services/api';

export const AcademiaModal = ({ academia, onClose }) => {
  const [carreras, setCarreras] = useState([]);
  const [isLoadingCarreras, setIsLoadingCarreras] = useState(false);

  useEffect(() => {
    if (academia?.id_academia) {
      const fetchCarreras = async () => {
        setIsLoadingCarreras(true);
        try {
          const res = await api.get(`/academias/${academia.id_academia}/carreras`);
          setCarreras(res.data);
        } catch (error) {
          console.error("Error al cargar carreras de la academia", error);
        } finally {
          setIsLoadingCarreras(false);
        }
      };
      fetchCarreras();
    }
  }, [academia]);

  if (!academia) return null;

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
    
  const profileImageUrl = academia.coordinador_foto_perfil_url 
    ? `${API_BASE}${academia.coordinador_foto_perfil_url}` 
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
          <h3 className="text-xl font-black text-white tracking-tight">Detalles de la academia</h3>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Cuerpo */}
        <div className="p-8 overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 mb-8">
            <div className="h-24 w-24 rounded-3xl bg-slate-100 border-4 border-white shadow-md flex items-center justify-center shrink-0">
              <BookOpen className="h-10 w-10 text-[#0B1828]" />
            </div>
            <div className="pt-2">
              <h4 className="text-2xl font-black text-[#0B1828] leading-tight uppercase">
                {academia.nombre}
              </h4>
              <span className={`mt-3 inline-flex px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg border shadow-sm ${
                academia.estatus === 'ACTIVO' 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {academia.estatus}
              </span>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
            {/* Coordinador */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-4 shrink-0 shadow-sm overflow-hidden">
                {profileImageUrl ? (
                  <img src={profileImageUrl} alt="Coordinador" className="h-full w-full object-cover" />
                ) : (
                  <UserCheck className="w-5 h-5 text-[#0B1828]" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1828] mb-0.5">Coordinador responsable</span> 
                <span className="text-slate-600 font-medium">{academia.coordinador_nombre || 'No asignado'}</span>
              </div>
            </div>
            
            {/* Descripción */}
            <div className="flex items-start">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <FileText className="w-5 h-5 text-[#0B1828]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1828] mb-0.5">Descripción</span> 
                <span className="text-slate-600 font-medium italic">
                  {academia.descripcion || 'Sin descripción disponible.'}
                </span>
              </div>
            </div>

            {/* Fecha Registro */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center mr-4 shrink-0 shadow-sm">
                <Calendar className="w-5 h-5 text-[#0B1828]" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0B1828] mb-0.5">Fecha de registro</span> 
                <span className="text-slate-600 font-medium">
                  {academia.fecha_creacion ? new Date(academia.fecha_creacion).toLocaleDateString('es-MX', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  }) : '---'}
                </span>
              </div>
            </div>
            
            {/* Carreras Vinculadas */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-lg font-black text-[#0B1828] mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
                Programas Vinculados
                <span className="ml-3 bg-slate-200 text-slate-700 py-0.5 px-2.5 rounded-full text-xs font-bold shadow-inner">
                  {carreras.length}
                </span>
              </h4>
              
              {isLoadingCarreras ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-[#0B1828] animate-spin" />
                </div>
              ) : carreras.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
                  <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm">No hay programas vinculados a esta academia.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {carreras.map((carrera) => (
                    <div key={carrera.id_carrera} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:shadow-md hover:border-indigo-100">
                      <div>
                        <h5 className="font-bold text-[#0B1828] text-sm mb-1">{carrera.nombre_carrera}</h5>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                          <span className="flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
                            {carrera.codigo_unico}
                          </span>
                          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600" title="Nivel y Modalidad">
                            {carrera.nivel_academico} • {carrera.modalidad}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${
                          carrera.estatus === 'ACTIVO' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {carrera.estatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};