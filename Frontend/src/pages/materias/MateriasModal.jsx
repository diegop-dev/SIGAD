import { X, Radiation } from "lucide-react";

export const MateriasModal = ({ Materias, onClose }) => {
  if (!Materias) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">

        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-black">
            Detalles de la materia
          </h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <p><strong>Código:</strong> {Materias.codigo_unico}</p>
          <p><strong>Nombre:</strong> {Materias.nombre}</p>
          <p><strong>Créditos:</strong> {Materias.creditos}</p>
          <p><strong>Cuatrimestre:</strong> {Materias.cuatrimestre}</p>
          <p><strong>Tipo:</strong> {Materias.tipo_asignatura}</p>
          <p><strong>Estatus:</strong> {Materias.estatus}</p>
        </div>

      </div>
    </div>
  );
};