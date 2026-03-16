import { useState } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Calendar, Edit3 } from "lucide-react";
import api from "../../services/api";

const formatearFechaParaInput = (cadenaFecha) => {
  if (!cadenaFecha) return "";
  return cadenaFecha.split("T")[0];
};

const obtenerNombreMes = (fecha) => {
  const meses = [
    "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
  ];
  const date = new Date(fecha);
  return meses[date.getMonth()];
};

const generarCodigo = (inicio, fin) => {
  const year = new Date(inicio).getFullYear();
  const mesInicio = obtenerNombreMes(inicio);
  const mesFin = obtenerNombreMes(fin);
  return `${year}-${mesInicio}-${mesFin}`;
};

export const PeriodosForm = ({ periodoToEdit, onBack, onSuccess }) => {
  const isEditing = !!periodoToEdit;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});

  const [formData, setFormData] = useState({
    fecha_inicio: formatearFechaParaInput(periodoToEdit?.fecha_inicio),
    fecha_fin: formatearFechaParaInput(periodoToEdit?.fecha_fin),
    fecha_limite_calif: formatearFechaParaInput(periodoToEdit?.fecha_limite_calif)
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const { fecha_inicio, fecha_fin, fecha_limite_calif } = formData;

    if (!fecha_inicio) newErrors.fecha_inicio = "Fecha de inicio obligatoria";
    if (!fecha_fin) newErrors.fecha_fin = "Fecha de fin obligatoria";
    if (!fecha_limite_calif) newErrors.fecha_limite_calif = "Fecha límite obligatoria";

    if (fecha_inicio && fecha_fin && new Date(fecha_fin) < new Date(fecha_inicio)) {
      newErrors.fecha_fin = "La fecha fin no puede ser menor a la de inicio";
    }

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando periodo..." : "Guardando periodo...");

    try {
      const codigo = generarCodigo(formData.fecha_inicio, formData.fecha_fin);

      const payload = {
        ...formData,
        codigo,
        anio: new Date(formData.fecha_inicio).getFullYear()
      };

      if (isEditing) {
        await api.put(`/periodos/${periodoToEdit.id_periodo}`, payload);
        toast.success("Periodo actualizado", { id: toastId });
      } else {
        await api.post("/periodos", payload);
        toast.success("Periodo creado", { id: toastId });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.mensaje ||
        "Error al guardar el periodo";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? "Editar periodo escolar" : "Nuevo periodo escolar"}
          </h2>
          <p className="text-sm text-slate-500">
            Define el rango de fechas del ciclo escolar
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Fecha inicio
              </label>

              <input
                type="date"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm ${
                  errores.fecha_inicio
                    ? "border-red-300"
                    : "border-slate-200"
                }`}
              />

              {errores.fecha_inicio && (
                <p className="text-xs text-red-500">{errores.fecha_inicio}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Fecha fin
              </label>

              <input
                type="date"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm ${
                  errores.fecha_fin
                    ? "border-red-300"
                    : "border-slate-200"
                }`}
              />

              {errores.fecha_fin && (
                <p className="text-xs text-red-500">{errores.fecha_fin}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                Fecha límite de captura de calificaciones
              </label>

              <input
                type="date"
                name="fecha_limite_calif"
                value={formData.fecha_limite_calif}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm ${
                  errores.fecha_limite_calif
                    ? "border-red-300"
                    : "border-slate-200"
                }`}
              />

              {errores.fecha_limite_calif && (
                <p className="text-xs text-red-500">
                  {errores.fecha_limite_calif}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : isEditing ? (
                <Edit3 className="w-5 h-5 mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}

              {isEditing ? "Actualizar periodo" : "Guardar periodo"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};