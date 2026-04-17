import { useState, useEffect } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Hash, BookOpen, Layers, Calendar, Users, Award, RefreshCw, GraduationCap } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { REGEX } from "../../utils/regex";

export const MateriasForm = ({ onBack, onSuccess, initialData = null }) => {
  const { user } = useAuth();
  const isEditing = !!initialData;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  
  const [catalogos, setCatalogos] = useState({
    carreras: [],
    periodos: [],
    cuatrimestres: []
  });
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const esTroncoComunInicial = !initialData?.carrera_id || initialData?.tipo_asignatura === "TRONCO_COMUN";

  const [formData, setFormData] = useState({
    nombre: initialData?.nombre || "",
    creditos: initialData?.creditos || 1,
    cupo_maximo: initialData?.cupo_maximo || 30,
    tipo_asignatura: esTroncoComunInicial ? "TRONCO_COMUN" : (initialData?.tipo_asignatura || "TRONCO_COMUN"),
    nivel_academico: initialData?.nivel_academico || "LICENCIATURA",
    periodo_id: initialData?.periodo_id || "",
    cuatrimestre_id: initialData?.cuatrimestre_id || "",
    carrera_id: initialData?.carrera_id || "" 
  });

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resCarreras, resPeriodos, resCuatrimestres] = await Promise.all([
          api.get("/carreras"),
          api.get("/periodos"),
          api.get("/cuatrimestres")
        ]);

        // ─── CAMBIO AQUÍ: Filtrado de periodos activos ───────────────────────────
        const rawPeriodos = Array.isArray(resPeriodos.data) ? resPeriodos.data : resPeriodos.data?.data || [];
        const periodosActivos = rawPeriodos.filter(p => p.estatus === "ACTIVO");

        setCatalogos({
          carreras: Array.isArray(resCarreras.data) ? resCarreras.data : resCarreras.data?.data || [],
          periodos: periodosActivos, // Solo se guardan en el estado los activos
          cuatrimestres: Array.isArray(resCuatrimestres.data) ? resCuatrimestres.data : resCuatrimestres.data?.data || []
        });
        // ──────────────────────────────────────────────────────────────────────────
      } catch (error) {
        console.error("Error al cargar los catálogos de dependencias:", error);
        toast.error("Fallo al cargar la información base del formulario.");
      } finally {
        setCargandoCatalogos(false);
      }
    };

    fetchCatalogos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Regex validation
    if (name === "nombre" && value !== '' && !REGEX.NOMBRE_MATERIA.test(value)) return;
    if (name === "nombre" && REGEX.TRIPLE_LETRA_REPETIDA.test(value)) return;
    if ((name === "creditos" || name === "cupo_maximo") && value !== '' && !REGEX.NUMEROS.test(value)) return;

    if (name === "tipo_asignatura") {
      if (value === "TRONCO_COMUN") {
        setFormData(prev => ({ ...prev, tipo_asignatura: value, carrera_id: "" }));
      } else {
        setFormData(prev => ({ ...prev, tipo_asignatura: value }));
      }
    } 
    else if (name === "nivel_academico") {
      setFormData(prev => ({ ...prev, nivel_academico: value, carrera_id: "" }));
    }
    else {
      let finalValue = value;
      if (name === 'codigo_unico') {
        finalValue = value.toUpperCase().slice(0, 15);
      } else if (name === 'creditos' || name === 'cupo_maximo') {
        finalValue = value !== "" ? Number(value) : "";
      }
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
    
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    const { nombre, creditos, cupo_maximo, periodo_id, cuatrimestre_id, tipo_asignatura, carrera_id, nivel_academico } = formData;

    if (!nombre?.trim()) {
      newErrors.nombre = "El nombre de la materia es obligatorio";
    } else if (nombre.trim().replace(REGEX.SOLO_LETRAS, '').length < 3) {
      newErrors.nombre = "El nombre debe contener al menos 3 letras";
    } else if (!REGEX.NOMBRE_MATERIA.test(nombre.trim())) {
      newErrors.nombre = "El nombre solo puede contener letras, espacios, puntos, guiones y un dígito aislado";
    } else if (REGEX.TRIPLE_LETRA_REPETIDA.test(nombre.trim())) {
      newErrors.nombre = "El nombre no puede contener tres o más letras iguales consecutivas";
    }
    if (!creditos || creditos < 1) newErrors.creditos = "Debe asignar al menos 1 crédito";
    if (!cupo_maximo || cupo_maximo < 1) newErrors.cupo_maximo = "El cupo debe ser mayor a 0";
    if (!periodo_id) newErrors.periodo_id = "Seleccione el periodo escolar";
    if (!cuatrimestre_id) newErrors.cuatrimestre_id = "Seleccione el cuatrimestre";
    if (!nivel_academico) newErrors.nivel_academico = "Seleccione el nivel académico";
    
    if (tipo_asignatura !== "TRONCO_COMUN") {
      if (!carrera_id || carrera_id === "" || carrera_id === "0") {
        newErrors.carrera_id = "Seleccione la carrera correspondiente";
      }
    }

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando materia..." : "Guardando materia...");

    try {
      const esTroncoComun = formData.tipo_asignatura === "TRONCO_COMUN";
      
      const payload = {
        nombre: formData.nombre,
        creditos: Number(formData.creditos),
        cupo_maximo: Number(formData.cupo_maximo),
        tipo_asignatura: formData.tipo_asignatura,
        nivel_academico: formData.nivel_academico, 
        periodo_id: Number(formData.periodo_id),
        cuatrimestre_id: Number(formData.cuatrimestre_id)
      };

      if (!esTroncoComun && formData.carrera_id && formData.carrera_id !== "") {
        payload.carrera_id = Number(formData.carrera_id);
      }
      
      if (isEditing && esTroncoComun) {
        payload.carrera_id = null;
      }

      if (isEditing) {
        await api.put(`/materias/${initialData.id_materia}`, payload);
        toast.success("Materia actualizada correctamente", { id: toastId });
      } else {
        await api.post("/materias", payload);
        toast.success("Materia creada correctamente", { id: toastId });
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Fallo en la petición a la API REST:", error);
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      if (status === 409 && errorData.action === "BLOCK") {
        const detalles = errorData.detalles || errorData.error || "Conflicto de integridad relacional en la base de datos.";
        toast.error(`Operación denegada: ${detalles}`, { id: toastId, duration: 8000 });
      } else if (status === 409) {
        const msg = errorData.error || "Conflicto de validación en el servidor.";
        toast.error(msg, { id: toastId, duration: 6000 });
      } else if (errorData.errores) {
        const backendErrors = {};
        errorData.errores.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrores(backendErrors);
        toast.error("Por favor corrige los campos señalados", { id: toastId });
      } else {
        const msg = errorData.error || errorData.mensaje || "Ocurrió un error al procesar la solicitud";
        toast.error(msg, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const esTroncoComun = formData.tipo_asignatura === "TRONCO_COMUN";
  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none bg-white appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-200 focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10 justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white">
              {isEditing ? "Modificar materia" : "Nueva materia"}
            </h2>
            <p className="text-sm text-white/60 font-medium">Define las características de la asignatura para el plan de estudios.</p>
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
            <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Información académica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <BookOpen className="w-4 h-4 mr-2" /> Nombre de la materia <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Programación Web Orientada a Servicios"
                  className={`${inputBaseClass} ${getValidationClass(errores.nombre)} cursor-text`}
                />
                {errores.nombre && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nombre}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <GraduationCap className="w-4 h-4 mr-2" /> Nivel académico <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  name="nivel_academico"
                  value={formData.nivel_academico}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${getValidationClass(errores.nivel_academico)}`}
                >
                  <option value="LICENCIATURA">Licenciatura</option>
                  <option value="MAESTRIA">Maestría</option>
                </select>
                {errores.nivel_academico && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nivel_academico}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Layers className="w-4 h-4 mr-2" /> Tipo de asignatura <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  name="tipo_asignatura"
                  value={formData.tipo_asignatura}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${getValidationClass(false)}`}
                >
                  <option value="TRONCO_COMUN">Tronco común</option>
                  <option value="OBLIGATORIA">Obligatoria</option>
                  <option value="OPTATIVA">Optativa</option>
                </select>
              </div>

              {!esTroncoComun && (
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Layers className="w-4 h-4 mr-2" /> Carrera / Maestría asignada <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <select
                    name="carrera_id"
                    value={formData.carrera_id}
                    onChange={handleChange}
                    disabled={cargandoCatalogos}
                    className={`${inputBaseClass} ${getValidationClass(errores.carrera_id)}`}
                  >
                    <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione la carrera --"}</option>
                    {catalogos.carreras
                      .filter(c => (c.nivel_academico || 'LICENCIATURA') === formData.nivel_academico)
                      .map(c => (
                        <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                    ))}
                  </select>
                  {errores.carrera_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.carrera_id}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Calendar className="w-4 h-4 mr-2" /> Periodo escolar <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  name="periodo_id"
                  value={formData.periodo_id}
                  onChange={handleChange}
                  disabled={cargandoCatalogos}
                  className={`${inputBaseClass} ${getValidationClass(errores.periodo_id)}`}
                >
                  <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione el periodo --"}</option>
                  {catalogos.periodos.map(p => (
                    <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>
                  ))}
                </select>
                {errores.periodo_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.periodo_id}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Calendar className="w-4 h-4 mr-2" /> Cuatrimestre / Semestre <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  name="cuatrimestre_id"
                  value={formData.cuatrimestre_id}
                  onChange={handleChange}
                  disabled={cargandoCatalogos}
                  className={`${inputBaseClass} ${getValidationClass(errores.cuatrimestre_id)}`}
                >
                  <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione el cuatrimestre --"}</option>
                  {catalogos.cuatrimestres.map(c => (
                    <option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>{c.nombre}</option>
                  ))}
                </select>
                {errores.cuatrimestre_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.cuatrimestre_id}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Award className="w-4 h-4 mr-2" /> Créditos académicos <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="creditos"
                  value={formData.creditos}
                  onChange={handleChange}
                  maxLength={2}
                  className={`${inputBaseClass} ${getValidationClass(errores.creditos)} cursor-text`}
                />
                {errores.creditos && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.creditos}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Users className="w-4 h-4 mr-2" /> Cupo máximo <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="cupo_maximo"
                  value={formData.cupo_maximo}
                  onChange={handleChange}
                  maxLength={3}
                  className={`${inputBaseClass} ${getValidationClass(errores.cupo_maximo)} cursor-text`}
                />
                {errores.cupo_maximo && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.cupo_maximo}</p>}
              </div>

            </div>
          </div>

          <div className="pt-8 border-t border-dashed border-slate-200">
            <button 
              type="submit" 
              disabled={isSubmitting || cargandoCatalogos} 
              className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg shadow-xl active:scale-[0.98] ${
                isSubmitting || cargandoCatalogos
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300 shadow-none"
                  : "bg-[#0B1828] text-white hover:bg-[#162840] hover:shadow-[#0B1828]/30"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              ) : isEditing ? (
                <RefreshCw className="w-6 h-6 mr-2 text-white" />
              ) : (
                <Save className="w-6 h-6 mr-2 text-white" />
              )}
              {isSubmitting ? "Procesando..." : isEditing ? "Actualizar materia" : "Guardar materia"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};