import { useState, useEffect } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, Layers, Loader2, Trash2 } from "lucide-react";
import api from "../../services/api";

export const GrupoForm = ({ onBack, onSuccess, initialData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const [carreras, setCarreras] = useState([]); 
  const [cargandoCarreras, setCargandoCarreras] = useState(true);

  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    carrera_id: initialData?.carrera_id || "",
  });

  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const response = await api.get("/carreras");
        const listaCarreras = Array.isArray(response.data) ? response.data : response.data.data;
        const carrerasActivas = listaCarreras.filter(c => c.estatus === 'ACTIVO');
        setCarreras(carrerasActivas || []);
      } catch (error) {
        console.error("Error al cargar carreras:", error);
        toast.error("No se pudieron cargar las carreras disponibles.");
      } finally {
        setCargandoCarreras(false);
      }
    };
    fetchCarreras();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errores[name]) setErrores({ ...errores, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.carrera_id) {
      newErrors.carrera_id = "Selecciona una carrera";
    }
    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando..." : "Generando grupo...");

    try {
      const payload = { carrera_id: Number(formData.carrera_id) };

      if (isEditing) {
        await api.put(`/grupos/${initialData.id_grupo}`, payload);
      } else {
        await api.post("/grupos", payload);
      }
      
      toast.success("Operación exitosa", { id: toastId });
      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (error) {
      toast.error("Error al procesar la solicitud", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">{isEditing ? "Gestionar grupo" : "Nuevo grupo"}</h2>
            <p className="text-sm text-slate-500 font-medium">
              {isEditing ? "Modifica la asignación de carrera." : "El identificador y cuatrimestre se autogenerarán."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-bold text-slate-700">
              <Layers className="w-4 h-4 mr-2 text-blue-500" /> Carrera asignada
            </label>
            <select
              name="carrera_id"
              value={formData.carrera_id}
              onChange={handleChange}
              disabled={cargandoCarreras}
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                errores.carrera_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
              }`}
            >
              <option value="">{cargandoCarreras ? "Cargando..." : "-- Seleccione una carrera --"}</option>
              {carreras.map(c => (
                <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
              ))}
            </select>
            {errores.carrera_id && <p className="text-xs font-bold text-red-500">{errores.carrera_id}</p>}
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button type="submit" disabled={isSubmitting || cargandoCarreras} className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isEditing ? "Actualizar grupo" : "Generar grupo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};