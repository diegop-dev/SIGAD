import { useState, useEffect } from "react";
import { Save, ArrowLeft, RefreshCw, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const MateriasForm = ({ materiaToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!materiaToEdit;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [carreras, setCarreras] = useState([]);

  const [formData, setFormData] = useState({
    nombre: "",
    creditos: 1,
    cuatrimestre: 1,
    tipo_asignatura: "TRONCO_COMUN",
    carrera_id: "",
  });

  useEffect(() => {
    fetchCarreras();
  }, []);

  useEffect(() => {
    if (materiaToEdit) {
      setFormData({
        nombre: materiaToEdit.nombre,
        creditos: materiaToEdit.creditos,
        cuatrimestre: materiaToEdit.cuatrimestre,
        tipo_asignatura: materiaToEdit.tipo_asignatura,
        carrera_id: materiaToEdit.carrera_id,
      });
    }
  }, [materiaToEdit]);

  const fetchCarreras = async () => {
    try {
      const res = await api.get("/carreras");
      setCarreras(res.data);
    } catch {
      toast.error("Error al cargar carreras");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitized = value;

    if (name === "nombre") {
      sanitized = sanitized
        .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, "")
        .replace(/\s{2,}/g, " ");
    }

    if (name === "creditos") {
      sanitized = Math.min(30, Math.max(1, Number(value)));
    }

    if (name === "cuatrimestre") {
      sanitized = Math.min(12, Math.max(1, Number(value)));
    }

    setFormData((prev) => ({ ...prev, [name]: sanitized }));
  };

  const validateForm = () => {
    if (formData.nombre.length < 3) {
      toast.error("El nombre debe tener mínimo 3 caracteres.");
      return false;
    }

    if (formData.creditos < 1 || formData.creditos > 30) {
      toast.error("Créditos deben estar entre 1 y 30.");
      return false;
    }

    if (formData.cuatrimestre < 1 || formData.cuatrimestre > 12) {
      toast.error("Cuatrimestre inválido.");
      return false;
    }

    if (!formData.carrera_id) {
      toast.error("Debe seleccionar una carrera.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(
      isEditing ? "Actualizando materia..." : "Registrando materia..."
    );

    try {
      if (isEditing) {
        await api.put(`/materias/${materiaToEdit.id_materia}`, {
          ...formData,
          modificado_por: user.id_usuario,
        });
        toast.success("Materia actualizada", { id: toastId });
      } else {
        await api.post("/materias", {
          ...formData,
          creado_por: user.id_usuario,
        });
        toast.success("Materia creada", { id: toastId });
      }

      onSuccess();
    } catch (error) {
      const msg =
        error.response?.data?.error || "Error al comunicarse con el servidor";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex justify-between items-center px-6 py-5 border-b bg-slate-50">
        <h2 className="text-xl font-black text-slate-900">
          {isEditing ? "Modificar materia" : "Registrar nueva materia"}
        </h2>

        <button
          onClick={onBack}
          className="flex items-center text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Regresar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          

          <div>
            <label className="block text-sm font-bold mb-2">
              Nombre de materia *
            </label>
            <input
              type="text"
              name="nombre"
              required
              maxLength="100"
              value={formData.nombre}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-bold mb-2">Créditos *</label>
            <input
              type="number"
              name="creditos"
              min="1"
              max="30"
              value={formData.creditos}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Cuatrimestre *
            </label>
            <select
              name="cuatrimestre"
              value={formData.cuatrimestre}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">
              Tipo de asignatura *
            </label>
            <select
              name="tipo_asignatura"
              value={formData.tipo_asignatura}
              onChange={handleChange}
              className="block w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="TRONCO_COMUN">Tronco común</option>
              <option value="OBLIGATORIA">Obligatoria</option>
              <option value="OPTATIVA">Optativa</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            Carrera *
          </label>
          <select
            name="carrera_id"
            required
            value={formData.carrera_id}
            onChange={handleChange}
            className="block w-full rounded-xl border border-slate-300 px-4 py-3"
          >
            <option value="">Seleccione una carrera</option>
            {carreras.map((c) => (
              <option key={c.id_carrera} value={c.id_carrera}>
                {c.nombre_carrera}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center px-8 py-3 rounded-xl text-white font-bold shadow-md ${
              isEditing
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isEditing ? (
              <RefreshCw className="w-5 h-5 mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            {isSubmitting
              ? "Procesando..."
              : isEditing
              ? "Actualizar materia"
              : "Guardar materia"}
          </button>
        </div>
      </form>
    </div>
  );
};