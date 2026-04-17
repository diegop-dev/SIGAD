import { X, Home, Beaker, MapPin, Users, Calendar, Clock, BookOpen, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export const AulaModal = ({ aula, onClose }) => {
  const [asignaciones, setAsignaciones] = useState([]);
  const [isLoadingAsignaciones, setIsLoadingAsignaciones] = useState(false);

  useEffect(() => {
    if (aula?.id_aula) {
      fetchAsignaciones();
    }
  }, [aula]);

  const fetchAsignaciones = async () => {
    setIsLoadingAsignaciones(true);
    try {
      const res = await api.get(`/aulas/${aula.id_aula}/asignaciones`);
      setAsignaciones(res.data.data || []);
    } catch {
      toast.error("Error al cargar las clases asignadas al espacio");
    } finally {
      setIsLoadingAsignaciones(false);
    }
  };

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Encabezado del Modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b bg-[#0B1828] shrink-0">
          <div className="flex items-center space-x-3">
            {aula.tipo === 'LABORATORIO' ? <Beaker className="w-6 h-6 text-white/90" /> : <Home className="w-6 h-6 text-white/90" />}
            <h2 className="text-xl font-black text-white">
              Detalle del espacio
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

          {/* Grid de Metadatos del Aula */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Nombre / Código</p>
              <p className="text-lg font-black text-[#0B1828] bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                {aula.nombre_codigo}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Clasificación</p>
              <span className={`inline-block px-4 py-2 mt-1 rounded-xl text-xs font-black uppercase tracking-wider border ${aula.tipo === "LABORATORIO"
                  ? "bg-purple-100 text-purple-800 border-purple-200"
                  : "bg-blue-100 text-blue-800 border-blue-200"
                }`}
              >
                {aula.tipo}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Estatus</p>
              <span className={`inline-block px-4 py-2 mt-1 rounded-xl text-xs font-black uppercase tracking-wider border ${aula.estatus === "ACTIVO" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                  aula.estatus === "MANTENIMIENTO" ? "bg-amber-100 text-amber-800 border-amber-200" :
                    "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                {aula.estatus}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold flex items-center mb-1">
                <Users className="w-4 h-4 mr-1.5 shrink-0" /> Capacidad
              </p>
              <p className="text-lg font-black text-[#0B1828]">
                {aula.capacidad} <span className="text-sm font-medium text-slate-500 bg-transparent">lugares</span>
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs text-slate-500 uppercase font-bold flex items-center mb-1">
                <MapPin className="w-4 h-4 mr-1.5 shrink-0" /> Edificio / Ubicación
              </p>
              <p className="text-lg font-black text-[#0B1828]">
                {aula.ubicacion}
              </p>
            </div>
          </div>

          {/* Sección de Asignaciones */}
          <div className="pt-6 border-t border-slate-100">
            <h4 className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
              <Calendar className="w-5 h-5 mr-2" />
              Ocupación Actual
            </h4>

            {isLoadingAsignaciones ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-[#0B1828] animate-spin" />
              </div>
            ) : asignaciones.length === 0 ? (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                <p className="text-sm font-bold text-slate-500">Este espacio no tiene clases programadas actualmente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {asignaciones.map((asig) => (
                  <div key={asig.id_asignacion} className="bg-white border text-left border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">

                    {/* Periodo de la Asignación */}
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200">
                        {asig.nombre_periodo}
                      </span>
                    </div>

                    {/* Resaltado de Materia sobre Docente según solicitud */}
                    <p className="text-base font-black text-[#0B1828] mb-1 leading-tight flex items-start">
                      <BookOpen className="w-4 h-4 mr-2 text-blue-500 shrink-0 mt-0.5" />
                      {asig.materia}
                    </p>

                    <p className="text-sm font-medium text-slate-600 mb-3 ml-6">
                      Mtro. {asig.docente}
                    </p>

                    {/* Detalles Logísticos */}
                    <div className="space-y-1.5 ml-6 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-xs font-bold text-[#0B1828] flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Grupo: {asig.grupo || 'N/A'}
                      </p>
                      <p className="text-xs font-bold text-[#0B1828] flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {dias[asig.dia_semana - 1] || 'Día'} • {asig.hora_inicio} a {asig.hora_fin}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
