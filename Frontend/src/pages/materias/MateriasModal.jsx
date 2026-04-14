import { X, BookOpen, School } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export const MateriasModal = ({
  materia,
  onClose
}) => {
  const [carreraNombre, setCarreraNombre] = useState(null);

  useEffect(() => {
    if (materia.tipo_asignatura === "CARRERA" && materia.carrera_id) {
      fetchCarrera();
    }
  }, []);

  const fetchCarrera = async () => {
    try {
      const res = await api.get(`/carreras/${materia.carrera_id}`);
      setCarreraNombre(res.data.nombre_carrera);
    } catch {
      toast.error("Error al cargar la carrera");
    }
  };

  const getTipoLabel = () => {
    if (materia.tipo_asignatura === "TRONCO_COMUN") return "Tronco Común";
    if (materia.tipo_asignatura === "CARRERA") return "Carrera";
    return materia.tipo_asignatura;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        <div className="flex justify-between items-center px-6 py-5 border-b bg-[#0B1828]">
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

        <div className="p-6 md:p-8 space-y-8">

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