import { useState, useEffect } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const CarreraForm = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});

  // Estados para manejar la lista dinámica de academias
  const [academias, setAcademias] = useState([]); 
  const [cargandoAcademias, setCargandoAcademias] = useState(true);

  const [formData, setFormData] = useState({
    nombre_carrera: "",
    academia_id: "",
  });

  // Efecto para solicitar las academias activas a tu propio backend de carreras
  useEffect(() => {
    const fetchAcademias = async () => {
      try {
        // Apuntamos a la nueva ruta que crearás en tu carreraRoutes.js
        const response = await api.get("/carreras/academias-activas");
        
        // Guardamos las academias en el estado
        const listaAcademias = response.data.data;
        setAcademias(listaAcademias);
        
      } catch (error) {
        console.error("Error al cargar academias:", error);
        toast.error("No se pudieron cargar las academias disponibles.");
      } finally {
        setCargandoAcademias(false);
      }
    };

    fetchAcademias();
  }, []); // El arreglo vacío [] asegura que esto se ejecute solo al abrir el formulario

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Limpiar el error de ese campo al escribir
    if (errores[name]) {
      setErrores({ ...errores, [name]: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Validación local rápida antes de tocar el servidor
    const nuevosErrores = {};
    const nombre = formData.nombre_carrera.trim();
    
    // Expresiones regulares
    const regexSoloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const regexLetrasRepetidas = /(.)\1{2,}/; // Detecta 3 o más caracteres iguales seguidos
    const regexEspaciosDobles = /\s{2,}/; // Detecta 2 o más espacios consecutivos
    const palabras = nombre.split(' ');
    const purasLetrasSueltas = palabras.length > 1 && palabras.every(palabra => palabra.length <= 1);

    // Validaciones del nombre de la carrera
if (!nombre) {
      nuevosErrores.nombre_carrera = "El nombre es obligatorio";
    } else if (nombre.length < 5) {
      nuevosErrores.nombre_carrera = "El nombre debe tener al menos 5 caracteres";
    } else if (!regexSoloLetras.test(nombre)) {
      nuevosErrores.nombre_carrera = "Solo se permiten letras y espacios (sin números ni símbolos)";
    } else if (regexEspaciosDobles.test(nombre)) {
      nuevosErrores.nombre_carrera = "No se permiten espacios dobles o múltiples";
    } else if (regexLetrasRepetidas.test(nombre)) {
      nuevosErrores.nombre_carrera = "El nombre no parece válido (caracteres repetidos)";
    } else if (purasLetrasSueltas) {
      nuevosErrores.nombre_carrera = "El nombre no puede estar formado solo por letras sueltas";
    }

    // Validación de la academia
    if (!formData.academia_id) {
      nuevosErrores.academia_id = "Selecciona una academia";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      toast.error("Por favor, revisa los campos en rojo.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Guardando carrera...");

    try {
      const payload = {
        nombre_carrera: formData.nombre_carrera,
        academia_id: Number(formData.academia_id),
        creado_por: user?.id_usuario 
      };

      // Petición POST a tu ruta base de carreras
      await api.post("/carreras", payload);

      toast.success("Carrera registrada exitosamente", { id: toastId });
      
      if (onSuccess) onSuccess();
      if (onBack) onBack();

    } catch (error) {
      console.error("Error al guardar:", error);
      const errorMsg = error.response?.data?.message || "Ocurrió un error al intentar guardar la carrera.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
      {/* Cabecera */}
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              Registrar nueva carrera
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Completa la información para añadir una carrera a la plataforma.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Nombre de carrera */}
            <div className="space-y-2">
              <label htmlFor="nombre_carrera" className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                Nombre de la carrera
              </label>
              <input
                type="text"
                id="nombre_carrera"
                name="nombre_carrera"
                value={formData.nombre_carrera}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all shadow-sm ${
                  errores.nombre_carrera 
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100" 
                    : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
                placeholder="Ej. Ingeniería en Software"
              />
              {errores.nombre_carrera && (
                <p className="text-xs font-bold text-red-500 mt-1">{errores.nombre_carrera}</p>
              )}
            </div>

            {/* Select dinámico de academia */}
            <div className="space-y-2">
              <label htmlFor="academia_id" className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                Academia correspondiente
              </label>
              <select
                id="academia_id"
                name="academia_id"
                value={formData.academia_id}
                onChange={handleChange}
                disabled={cargandoAcademias}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-400 ${
                  errores.academia_id 
                    ? "border-red-300 focus:border-red-400 focus:ring-red-100" 
                    : "border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                }`}
              >
                <option value="">
                  {cargandoAcademias ? "Cargando academias..." : "-- Selecciona una academia --"}
                </option>
                
                {/* Opciones generadas desde la base de datos */}
                {academias.map((academia) => (
                  <option key={academia.id_academia} value={academia.id_academia}>
                    {academia.nombre}
                  </option>
                ))}
              </select>
              {errores.academia_id && (
                <p className="text-xs font-bold text-red-500 mt-1">{errores.academia_id}</p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end pt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting || cargandoAcademias}
              className="flex items-center px-8 py-3 rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar carrera
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};