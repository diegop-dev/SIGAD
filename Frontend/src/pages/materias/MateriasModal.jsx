import { X, Pencil, Trash2, BookOpen, School } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";

export const MateriasModal = ({
  materia,
  onClose,
  onEdit,
  onDelete,
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-5 border-b bg-slate-50">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-black text-slate-900">
              Detalle de la materia
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900"
          >
            <X />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">

          {/* Información académica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Código
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {materia.codigo_unico}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Nombre
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {materia.nombre}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Créditos
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {materia.creditos}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Cuatrimestre
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {materia.cuatrimestre_id}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Tipo
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  materia.tipo_asignatura === "TRONCO_COMUN"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {getTipoLabel()}
              </span>
            </div>

            {materia.tipo_asignatura === "CARRERA" && (
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold flex items-center">
                  <School className="w-3 h-3 mr-1" />
                  Carrera
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {carreraNombre || "Cargando..."}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-500 uppercase font-bold">
                Estatus
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  materia.estatus === "INACTIVO"
                    ? "bg-red-100 text-red-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {materia.estatus || "ACTIVO"}
              </span>
            </div>

          </div>

          {/* Auditoría */}
          <div className="border-t pt-4 text-sm text-slate-500">
            <p>
              Creado por: <span className="font-semibold">{materia.creado_por_nombre || "No disponible"}</span>
            </p>
            <p>
              Fecha creación:{" "}
              <span className="font-semibold">
                {materia.fecha_creacion
                  ? new Date(materia.fecha_creacion).toLocaleString()
                  : "No disponible"}
              </span>
            </p>

            {materia.fecha_modificacion && (
              <p>
                Última modificación:{" "}
                <span className="font-semibold">
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