import { useState } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Radiation } from "lucide-react";
import api from "../../services/api";


export const MateriasForm = ({ onBack, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    codigo_unico: "",
    nombre: "",
    creditos: "",
    cuatrimestre: "",
    tipo_asignatura: "OBLIGATORIA",
    carrera_id: "",
    estatus: "ACTIVO",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    let sanitizedValue = value;

    if (name === "codigo_unico") {
      sanitizedValue = sanitizedValue
        .replace(/[^A-Z0-9-]/gi, "")
        .toUpperCase();
    }

    if (["creditos", "cuatrimestre", "carrera_id"].includes(name)) {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const toastId = toast.loading("Registrando materia...");

    try {
      const payload = {
        ...formData,
        creditos: Number(formData.creditos),
        cuatrimestre: Number(formData.cuatrimestre),
        carrera_id: formData.carrera_id
          ? Number(formData.carrera_id)
          : null,
      };

      await api.post("/materias", payload);

      toast.success("Materia registrada correctamente", { id: toastId });
      onSuccess();
    } catch (error) {
      const msg =
        error.response?.data?.error ||
        "Error al conectar con el servidor";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b bg-slate-50">
        <h2 className="text-xl font-black text-slate-900">
          Registrar nueva materia
        </h2>
        <button
          onClick={onBack}
          className="flex items-center text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Regresar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          <div>
            <label className="block font-bold mb-2">Código único *</label>
            <input
              name="codigo_unico"
              required
              value={formData.codigo_unico}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Nombre *</label>
            <input
              name="nombre"
              required
              value={formData.nombre}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Créditos *</label>
            <input
              name="creditos"
              required
              value={formData.creditos}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Cuatrimestre *</label>
            <input
              name="cuatrimestre"
              required
              value={formData.cuatrimestre}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="block font-bold mb-2">Tipo asignatura *</label>
            <select
              name="tipo_asignatura"
              value={formData.tipo_asignatura}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            >
              <option value="OBLIGATORIA">Obligatoria</option>
              <option value="OPTATIVA">Optativa</option>
              <option value="TRONCO_COMUN">Tronco común</option>
            </select>
          </div>

          <div>
            <label className="block font-bold mb-2">Carrera ID</label>
            <input
              name="carrera_id"
              value={formData.carrera_id}
              onChange={handleChange}
              className="w-full rounded-xl border p-3"
            />
          </div>

        </div>

        <div className="flex justify-end">
          <button
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? "Guardando..." : "Guardar materia"}
          </button>
        </div>
      </form>
    </div>
  );
};  