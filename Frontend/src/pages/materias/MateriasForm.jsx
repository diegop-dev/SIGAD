import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Hash, BookOpen, Layers, Calendar, Users, Award, RefreshCw, GraduationCap } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

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

        setCatalogos({
          carreras: Array.isArray(resCarreras.data) ? resCarreras.data : resCarreras.data?.data || [],
          periodos: Array.isArray(resPeriodos.data) ? resPeriodos.data : resPeriodos.data?.data || [],
          cuatrimestres: Array.isArray(resCuatrimestres.data) ? resCuatrimestres.data : resCuatrimestres.data?.data || []
        });
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
<<<<<<< HEAD

=======
>>>>>>> 50ba22bf4d2278fce10621cf85607f11da131c1e
      if (name === 'codigo_unico') {
        finalValue = value.toUpperCase().slice(0, 15);
      } else if (type === 'number') {
        finalValue = value !== "" ? Number(value) : "";
      }
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
<<<<<<< HEAD

    // Validación en vivo para el campo nombre
    if (name === 'nombre') {
      const charsInvalidos = /[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ\s\-\.]/;
      if (value && charsInvalidos.test(value)) {
        setErrores(prev => ({ ...prev, nombre: "El nombre contiene caracteres no permitidos (solo letras, números, guiones y puntos)" }));
      } else {
        setErrores(prev => ({ ...prev, nombre: null }));
      }
      return;
    }

    // Limpieza dinámica de errores para los demás campos
=======
    
>>>>>>> 50ba22bf4d2278fce10621cf85607f11da131c1e
    if (errores[name]) setErrores(prev => ({ ...prev, [name]: null }));
  };

  const hasChanges = useMemo(() => {
    if (!isEditing || !initialData) return true;
    const orig = {
      nombre: (initialData.nombre || "").trim(),
      creditos: Number(initialData.creditos || 1),
      cupo_maximo: Number(initialData.cupo_maximo || 30),
      tipo_asignatura: initialData.tipo_asignatura || "TRONCO_COMUN",
      nivel_academico: initialData.nivel_academico || "LICENCIATURA",
      periodo_id: String(initialData.periodo_id || ""),
      cuatrimestre_id: String(initialData.cuatrimestre_id || ""),
      carrera_id: String(initialData.carrera_id || ""),
    };
    const curr = {
      nombre: formData.nombre.trim(),
      creditos: Number(formData.creditos),
      cupo_maximo: Number(formData.cupo_maximo),
      tipo_asignatura: formData.tipo_asignatura,
      nivel_academico: formData.nivel_academico,
      periodo_id: String(formData.periodo_id),
      cuatrimestre_id: String(formData.cuatrimestre_id),
      carrera_id: String(formData.carrera_id),
    };
    return JSON.stringify(orig) !== JSON.stringify(curr);
  }, [formData, isEditing, initialData]);

  const validate = () => {
    const newErrors = {};
    const { nombre, creditos, cupo_maximo, periodo_id, cuatrimestre_id, tipo_asignatura, carrera_id, nivel_academico } = formData;

    if (!nombre?.trim()) newErrors.nombre = "El nombre de la materia es obligatorio";
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
    if (isEditing && !hasChanges) {
      toast.error("No has realizado ningún cambio.");
      return;
    }
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
<<<<<<< HEAD
=======
  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none bg-white appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-200 focus:border-[#0B1828] focus:ring-[#0B1828]";
>>>>>>> 50ba22bf4d2278fce10621cf85607f11da131c1e

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

<<<<<<< HEAD
          {/* Footer de botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            {isEditing ? (
              <button
                type="submit"
                disabled={isSubmitting || cargandoCatalogos || !hasChanges}
                className="flex items-center px-6 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Edit3 className="w-5 h-5 mr-2" />}
                Actualizar materia
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting || cargandoCatalogos} 
                className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar materia
              </button>
            )}
=======
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
                  type="number"
                  name="creditos"
                  value={formData.creditos}
                  onChange={handleChange}
                  min="1"
                  max="30"
                  className={`${inputBaseClass} ${getValidationClass(errores.creditos)} cursor-text`}
                />
                {errores.creditos && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.creditos}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Users className="w-4 h-4 mr-2" /> Cupo máximo <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="number"
                  name="cupo_maximo"
                  value={formData.cupo_maximo}
                  onChange={handleChange}
                  min="1"
                  max="100"
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
>>>>>>> 50ba22bf4d2278fce10621cf85607f11da131c1e
          </div>
        </form>
      </div>
    </div>
  );
};