import { X, BookOpen, School, Calendar, Clock, MapPin, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export const MateriasModal = ({ materia, onClose }) => {
  const [carreraNombre, setCarreraNombre] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [isLoadingAsignaciones, setIsLoadingAsignaciones] = useState(false);

  useEffect(() => {
    if (materia.tipo_asignatura === "CARRERA" && materia.carrera_id) {
      fetchCarrera();
    }
    if (materia.id_materia) {
      fetchAsignaciones();
    }
  }, [materia]);

  const fetchCarrera = async () => {
    try {
      const res = await api.get(`/carreras/${materia.carrera_id}`);
      setCarreraNombre(res.data.nombre_carrera);
    } catch {
      toast.error("Error al cargar la carrera");
    }
  };

  const fetchAsignaciones = async () => {
    setIsLoadingAsignaciones(true);
    try {
      const res = await api.get('/asignaciones', { params: { materia_id: materia.id_materia } });
      setAsignaciones(res.data.data || []);
    } catch {
      toast.error("Error al cargar las asignaciones");
    } finally {
      setIsLoadingAsignaciones(false);
    }
  };

  const getTipoLabel = () => {
    if (materia.tipo_asignatura === "TRONCO_COMUN") return "Tronco Común";
    if (materia.tipo_asignatura === "CARRERA") return "Carrera";
    return materia.tipo_asignatura;
  };

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        <div className="flex justify-between items-center px-6 py-5 border-b bg-[#0B1828] shrink-0">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-white/90" />
            <h2 className="text-xl font-black text-white">
              Detalle de la materia
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Código único</p>
              <p className="text-lg font-black text-[#0B1828] bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                {materia.codigo_unico}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Nombre</p>
              <p className="text-lg font-black text-[#0B1828] bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 break-words">
                {materia.nombre}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Créditos</p>
              <p className="text-lg font-black text-[#0B1828]">
                {materia.creditos}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cuatrimestre</p>
              <p className="text-lg font-black text-[#0B1828]">
                {materia.cuatrimestre_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Clasificación</p>
              <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  materia.tipo_asignatura === "TRONCO_COMUN"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-purple-100 text-purple-800 border-purple-200"
                }`}
              >
                {getTipoLabel()}
              </span>
            </div>

            {materia.tipo_asignatura === "CARRERA" && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold flex items-center mb-1">
                  <School className="w-4 h-4 mr-1.5" /> Carrera asignada
                </p>
                <p className="text-lg font-black text-[#0B1828]">
                  {carreraNombre || "Consultando..."}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Estatus del sistema</p>
              <span className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border ${
                  materia.estatus === "INACTIVO"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-emerald-100 text-emerald-800 border-emerald-200"
                }`}
              >
                {materia.estatus || "ACTIVO"}
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h4 className="flex items-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
              <Calendar className="w-5 h-5 mr-2" />
              Asignaciones Registradas
            </h4>
            
            {isLoadingAsignaciones ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 text-[#0B1828] animate-spin" />
              </div>
            ) : asignaciones.length === 0 ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-sm font-medium text-slate-500">No hay asignaciones creadas para esta materia.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {asignaciones.map((asig) => (
                  <div key={asig.id_asignacion} className="bg-white border text-left border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2 gap-2">
                       <span className="text-xs font-black px-2 py-0.5 rounded border bg-indigo-50 text-indigo-700 border-indigo-200" title={asig.nombre_periodo}>
                         {asig.nombre_periodo}
                       </span>
                       <div className="flex flex-col gap-1 items-end">
                         <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                           asig.estatus_confirmacion === 'ACEPTADA' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                           asig.estatus_confirmacion === 'RECHAZADA' ? 'bg-red-50 text-red-700 border-red-200' :
                           'bg-amber-50 text-amber-700 border-amber-200'
                         }`}>
                           {asig.estatus_confirmacion}
                         </span>
                         {asig.estatus_confirmacion !== 'RECHAZADA' && (
                           <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${
                             asig.estatus_acta === 'ABIERTA' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                           }`}>
                             Acta: {asig.estatus_acta}
                           </span>
                         )}
                       </div>
                    </div>
                    <p className="text-sm font-bold text-[#0B1828] mb-1">
                      {asig.docente_nombres} {asig.docente_apellido_paterno}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-slate-500 flex items-center">
                        <School className="w-3.5 h-3.5 mr-1" /> Grupo: {asig.nombre_grupo}
                      </p>
                      <p className="text-xs font-medium text-slate-500 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" /> {dias[asig.dia_semana - 1] || 'Día'} • {asig.hora_inicio}
                      </p>
                      <p className="text-xs font-medium text-slate-500 flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1" /> {asig.nombre_aula}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 text-sm text-slate-500 font-medium space-y-1">
            <p>
              Creado por: <span className="font-bold text-[#0B1828]">{materia.creado_por}</span>
            </p>
            <p>
              Fecha creación:{" "}
              <span className="font-bold text-[#0B1828]">
                {materia.fecha_creacion ? new Date(materia.fecha_creacion).toLocaleString() : "No disponible"}
              </span>
            </p>
            {materia.fecha_modificacion && (
              <p>
                Última modificación:{" "}
                <span className="font-bold text-[#0B1828]">
                  {new Date(materia.fecha_modificacion).toLocaleString()}
                </span>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};