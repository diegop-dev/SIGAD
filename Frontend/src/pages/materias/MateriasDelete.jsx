import { useState } from "react";
import { X, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export const MateriasDelete = ({ materia, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Procesando eliminación física...");

    try {
      await api.delete(`/materias/${materia.id_materia}`);
      toast.success("Materia eliminada permanentemente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      // Interceptamos conflictos como cuatrimestre activo o historial existente
      if (status === 409) {
        toast.error(errorData.error || "Operación denegada por reglas de integridad.", { id: toastId, duration: 6000 });
      } else {
        toast.error(errorData.error || "Error interno al intentar eliminar la materia.", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogicalDelete = async () => {
    setIsSubmitting(true);
    const toastId = toast.loading("Aplicando baja lógica...");

    try {
      await api.patch(`/materias/${materia.id_materia}/toggle`);
      toast.success("Materia desactivada correctamente.", { id: toastId });
      onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      // Intercepción exacta del bloqueo arquitectónico de integridad relacional
      if (status === 409 && errorData.action === "BLOCK") {
        const detalles = errorData.detalles || errorData.error || "Conflicto de integridad en la base de datos.";
        toast.error(`Operación denegada: ${detalles}`, { id: toastId, duration: 8000 });
      } else if (status === 409) {
        toast.error(errorData.error || "No se puede modificar el estatus en este momento.", { id: toastId, duration: 6000 });
      } else {
        toast.error(errorData.error || "Error al aplicar la baja lógica.", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        <div className="flex justify-between items-center px-6 py-5 border-b bg-red-50 border-red-100">
          <h2 className="text-lg font-black text-red-700 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Administrar materia
          </h2>

          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-slate-700">

          <p className="text-base">
            ¿Qué acción desea ejecutar sobre la materia 
            <span className="font-black text-slate-900"> {materia.nombre}</span>?
          </p>

          <div className="space-y-3 pt-2">

            <button
              onClick={handleLogicalDelete}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Desactivar materia (Baja lógica)
            </button>

            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Eliminar permanentemente
            </button>

          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              <span className="font-bold text-slate-700">Desactivar</span> mantendrá el historial de calificaciones y registros previos. 
              <span className="font-bold text-red-700"> Eliminar</span> destruirá el registro por completo y solo será posible si no existen dependencias en la base de datos.
            </p>
          </div>

        </div>

        <div className="flex justify-end px-6 py-4 border-t bg-slate-50/50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};