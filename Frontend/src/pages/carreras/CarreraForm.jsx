import { useState, useEffect } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, BookOpen, Loader2, Layers, Trash2, Edit3 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const CarreraForm = ({ onBack, onSuccess, initialData = null }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const [academias, setAcademias] = useState([]); 
  const [cargandoAcademias, setCargandoAcademias] = useState(true);

  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    nombre_carrera: initialData?.nombre_carrera || "",
    modalidad: initialData?.modalidad || "",
    academia_id: initialData?.academia_id || "",
  });

  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        const response = await api.get("/carreras/academias-activas");
        const dataAcademias = response.data.data || response.data;
        setAcademias(Array.isArray(dataAcademias) ? dataAcademias : []);
      } catch (error) {
        console.error("Error al cargar academias:", error);
        toast.error("No se pudieron cargar las academias.");
      } finally {
        setCargandoAcademias(false);
      }
    };
    fetchAcademias();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errores[name]) setErrores({ ...errores, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    const { nombre_carrera, modalidad, academia_id } = formData;
    
    const nombreLimpio = nombre_carrera.trim();
    const palabras = nombreLimpio.split(/\s+/);
    
    const purasLetrasSueltas = palabras.length > 1 && palabras.every(palabra => palabra.length <= 1);
    const palabrasSinSentido = palabras.some(palabra => palabra.length > 1 && /^(.)\1+$/i.test(palabra));

    if (nombreLimpio.length < 5) {
      newErrors.nombre_carrera = "El nombre debe tener al menos 5 caracteres";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre_carrera)) {
      newErrors.nombre_carrera = "Solo se permiten letras y espacios";
    } else if (/\s{2,}/.test(nombre_carrera)) {
      newErrors.nombre_carrera = "No se permiten espacios dobles";
    } else if (/(.)\1{2,}/i.test(nombre_carrera)) {
      newErrors.nombre_carrera = "El nombre no parece válido (caracteres repetidos)";
    } else if (purasLetrasSueltas) {
      newErrors.nombre_carrera = "El nombre no puede estar formado solo por letras sueltas";
    } else if (palabrasSinSentido) {
      newErrors.nombre_carrera = 'El nombre contiene palabras no válidas (ej. "Aa")';
    }

    if (!modalidad) {
      newErrors.modalidad = "La modalidad es obligatoria";
    }
    
    if (!academia_id) {
      newErrors.academia_id = "Selecciona una academia";
    }

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando..." : "Guardando...");

    try {
      const payload = {
        ...formData,
        academia_id: Number(formData.academia_id),
        creado_por: user?.id_usuario 
      };

      if (isEditing) {
        await api.put(`/carreras/${initialData.id_carrera}`, payload);
      } else {
        await api.post("/carreras", payload);
      }
      
      toast.success("Operación exitosa", { id: toastId });
      
      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (error) {
      if (error.response?.data?.errores) {
        const backendErrors = {};
        error.response.data.errores.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrores(backendErrors);
        toast.error("Por favor corrige los campos señalados en rojo", { id: toastId });
      } else {
        const msg = error.response?.data?.message || "Error al procesar la solicitud";
        toast.error(msg, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlaceholder = () => toast("Función de eliminación en desarrollo", { icon: "🚧" });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">{isEditing ? "Gestionar carrera" : "Nueva carrera"}</h2>
            <p className="text-sm text-slate-500 font-medium">
              {isEditing ? "Modifica los datos de la carrera." : "El código único se generará automáticamente."}
            </p>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex gap-2">
            <button onClick={handleDeletePlaceholder} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Nombre de la carrera
              </label>
              <input
                type="text"
                name="nombre_carrera"
                value={formData.nombre_carrera}
                onChange={handleChange}
                placeholder="Ej. Ingeniería en Sistemas Computacionales"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.nombre_carrera ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.nombre_carrera && <p className="text-xs font-bold text-red-500">{errores.nombre_carrera}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Layers className="w-4 h-4 mr-2 text-blue-500" /> Modalidad
              </label>
            <select
                name="modalidad"
                value={formData.modalidad}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.modalidad ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">-- Seleccione --</option>
                <option value="ESCOLARIZADA">ESCOLARIZADA</option>
                <option value="EJECUTIVA">EJECUTIVA</option>
                <option value="HÍBRIDA">HÍBRIDA</option>
              </select>
              {errores.modalidad && <p className="text-xs font-bold text-red-500">{errores.modalidad}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Layers className="w-4 h-4 mr-2 text-blue-500" /> Academia responsable
              </label>
              <select
                name="academia_id"
                value={formData.academia_id}
                onChange={handleChange}
                disabled={cargandoAcademias}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.academia_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">{cargandoAcademias ? "Cargando..." : "-- Seleccione una academia --"}</option>
                {academias.map(a => (
                  <option key={a.id_academia} value={a.id_academia}>{a.nombre}</option>
                ))}
              </select>
              {errores.academia_id && <p className="text-xs font-bold text-red-500">{errores.academia_id}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            {isEditing ? (
              <button type="button" className="flex items-center px-6 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 transition-all shadow-md">
                <Edit3 className="w-5 h-5 mr-2" /> Actualizar datos
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting || cargandoAcademias} className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar carrera
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};