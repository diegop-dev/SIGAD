import { useState, useEffect } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, BookOpen, Loader2, Layers, RefreshCw, GraduationCap, AlertTriangle, Ban } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { REGEX } from "../../utils/regex";
import { formatToGlobalUppercase } from "../../utils/textFormatter";

export const CarreraForm = ({ onBack, onSuccess, initialData = null }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const [academias, setAcademias] = useState([]); 
  const [cargandoAcademias, setCargandoAcademias] = useState(true);

  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    nombre_carrera: initialData?.nombre_carrera || "",
    nivel_academico: initialData?.nivel_academico || "LICENCIATURA",
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
        toast.error("Error al cargar dependencias de academias.");
      } finally {
        setCargandoAcademias(false);
      }
    };
    fetchAcademias();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const formattedValue = formatToGlobalUppercase(value, name, type);

    if (name === 'nombre_carrera') {
      // Limpiar espacios iniciales y dobles antes de validar
      const clean = formattedValue
        .replace(/^\s+/g, '')
        .replace(/\s{2,}/g, ' ');
      // Bloquear si contiene caracteres no permitidos (solo letras y espacios)
      if (clean !== '' && !REGEX.LETRAS_Y_ESPACIOS.test(clean)) return;
      // Bloquear triple letra consecutiva
      if (REGEX.TRIPLE_LETRA_REPETIDA.test(clean)) return;

      setFormData({ ...formData, [name]: clean });
      setServerAction(null);
      if (errores[name]) setErrores({ ...errores, [name]: null });
      return;
    }

    setFormData({ ...formData, [name]: formattedValue });
    setServerAction(null);
    if (errores[name]) setErrores({ ...errores, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    const { nombre_carrera, modalidad, academia_id, nivel_academico } = formData;
    const nombreLimpio = nombre_carrera.trim();

    // Validaciones del nombre del programa
    if (!nombreLimpio) {
      newErrors.nombre_carrera = "El nombre del programa es obligatorio";
    } else if (nombreLimpio.replace(REGEX.SOLO_LETRAS, '').length < 5) {
      newErrors.nombre_carrera = "El nombre debe contener al menos 5 letras";
    } else if (!REGEX.LETRAS_Y_ESPACIOS.test(nombreLimpio)) {
      newErrors.nombre_carrera = "El nombre solo puede contener letras y espacios";
    } else if (REGEX.TRIPLE_LETRA_REPETIDA.test(nombreLimpio)) {
      newErrors.nombre_carrera = "El nombre no puede contener tres o más letras iguales consecutivas";
    }

    if (!nivel_academico) newErrors.nivel_academico = "El nivel académico es obligatorio";
    if (!modalidad) newErrors.modalidad = "La modalidad es obligatoria";
    if (!academia_id) newErrors.academia_id = "Selecciona una academia";

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando programa..." : "Guardando programa...");

    try {
      const payload = {
        ...formData,
        academia_id: Number(formData.academia_id),
        creado_por: user?.id_usuario,
        confirmar_rechazo: serverAction === 'WARN' 
      };

      if (isEditing) {
        await api.put(`/carreras/${initialData.id_carrera}`, payload);
        toast.success("Programa actualizado exitosamente", { id: toastId });
      } else {
        await api.post("/carreras", payload);
        toast.success("Programa generado exitosamente", { id: toastId });
      }
      
      if (onSuccess) onSuccess();
      if (onBack) onBack();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      toast.dismiss(toastId); 

      if (status === 409 && (errorData.action === "BLOCK" || errorData.action === "WARN")) {
        setServerAction(errorData.action);
        setServerMessage(errorData.detalles || errorData.error || "Conflicto de integridad referencial.");
        if (errorData.action === "BLOCK") {
          toast.error("Operación denegada por integridad.", { duration: 8000 });
        }
      } 
      else if (status === 409) {
        const msg = errorData.message || "Conflicto de validación en el servidor.";
        toast.error(msg, { duration: 6000 });
      } 
      else {
        const msg = errorData.message || "Error interno de validación.";
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none bg-white";
  const getValidationClass = (hasError) => 
    hasError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-slate-200 focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10 justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white">
              {isEditing ? "Gestionar programa" : "Nuevo programa académico"}
            </h2>
            <p className="text-sm text-white/60 font-medium">
              {isEditing ? "Modifica los datos del programa." : "El código único se generará automáticamente."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-10">
          
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Información principal</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <BookOpen className="w-4 h-4 mr-2" /> Nombre del programa (Carrera/Maestría) <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="nombre_carrera"
                  value={formData.nombre_carrera}
                  onChange={handleChange}
                  placeholder="Ej. Ingeniería en Sistemas Computacionales"
                  className={`${inputBaseClass} ${getValidationClass(errores.nombre_carrera)}`}
                />
                {errores.nombre_carrera && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nombre_carrera}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <GraduationCap className="w-4 h-4 mr-2" /> Nivel académico <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  name="nivel_academico"
                  value={formData.nivel_academico}
                  onChange={handleChange}
                  disabled={serverAction === 'BLOCK'}
                  className={`appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${inputBaseClass} ${getValidationClass(errores.nivel_academico)}`}
                >
                  <option value="LICENCIATURA">Licenciatura</option>
                  <option value="MAESTRIA">Maestría</option>
                </select>
                {errores.nivel_academico && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nivel_academico}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Layers className="w-4 h-4 mr-2" /> Modalidad <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleChange}
                  disabled={serverAction === 'BLOCK'}
                  className={`appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${inputBaseClass} ${getValidationClass(errores.modalidad)}`}
                >
                  <option value="">-- Seleccione --</option>
                  <option value="ESCOLARIZADA">ESCOLARIZADA</option>
                  <option value="EJECUTIVA">EJECUTIVA</option>
                  <option value="HÍBRIDA">HÍBRIDA</option>
                </select>
                {errores.modalidad && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.modalidad}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Layers className="w-4 h-4 mr-2" /> Academia responsable <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  name="academia_id"
                  value={formData.academia_id}
                  onChange={handleChange}
                  disabled={cargandoAcademias || serverAction === 'BLOCK'}
                  className={`appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 ${inputBaseClass} ${getValidationClass(errores.academia_id)}`}
                >
                  <option value="">{cargandoAcademias ? "Cargando..." : "-- Seleccione una academia --"}</option>
                  {academias.map(a => (
                    <option key={a.id_academia} value={a.id_academia}>{a.nombre}</option>
                  ))}
                </select>
                {errores.academia_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.academia_id}</p>}
              </div>
              
              {serverAction === 'BLOCK' && (
                <div className="md:col-span-2 bg-amber-50 p-5 rounded-2xl border border-amber-200 flex items-start mt-4 shadow-sm">
                  <Ban className="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-1">Acción bloqueada</h4>
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">{serverMessage}</p>
                  </div>
                </div>
              )}

              {serverAction === 'WARN' && (
                <div className="md:col-span-2 bg-red-50 p-5 rounded-2xl border border-red-200 flex items-start mt-4 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-900 mb-1">Advertencia de seguridad</h4>
                    <p className="text-sm text-red-800 font-medium leading-relaxed">{serverMessage}</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="pt-8 border-t border-dashed border-slate-200">
            {serverAction === 'BLOCK' ? (
              <button type="button" onClick={onBack} className="w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 shadow-sm">
                Cerrar y volver al listado
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || cargandoAcademias}
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg shadow-xl active:scale-[0.98] ${
                  serverAction === 'WARN' 
                    ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-600/30' 
                    : isSubmitting || cargandoAcademias
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300 shadow-none"
                      : "bg-[#0B1828] text-white hover:bg-[#162840] hover:shadow-[#0B1828]/30"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                ) : serverAction === 'WARN' ? (
                  <AlertTriangle className="w-6 h-6 mr-2 text-white" />
                ) : isEditing ? (
                  <RefreshCw className="w-6 h-6 mr-2 text-white" />
                ) : (
                  <Save className="w-6 h-6 mr-2 text-white" />
                )}
                
                {isSubmitting
                  ? "Procesando..."
                  : serverAction === 'WARN' ? "Confirmar cambio y rechazar clases" : isEditing ? "Actualizar datos" : "Guardar programa"
                }
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};