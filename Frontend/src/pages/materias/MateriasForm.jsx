import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Hash, BookOpen, Layers, Calendar, Users, Award, Edit3, Trash2, GraduationCap } from "lucide-react";
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

  // Determinamos si la materia es de tronco común basado en initialData
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
        setFormData(prev => ({
          ...prev,
          tipo_asignatura: value,
          carrera_id: "" 
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          tipo_asignatura: value
        }));
      }
    } 
    // Limpiar carrera_id si cambia el nivel académico
    else if (name === "nivel_academico") {
      setFormData(prev => ({
        ...prev,
        nivel_academico: value,
        carrera_id: "" 
      }));
    }
    else {
      let finalValue = value;

      if (name === 'codigo_unico') {
        finalValue = value.toUpperCase().slice(0, 15);
      } else if (type === 'number') {
        finalValue = value !== "" ? Number(value) : "";
      }

      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }

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

      // Intercepción del error 409 para proteger la integridad relacional de la estructura académica
      if (status === 409 && errorData.action === "BLOCK") {
        const detalles = errorData.detalles || errorData.error || "Conflicto de integridad relacional en la base de datos.";
        toast.error(`Operación denegada: ${detalles}`, { id: toastId, duration: 8000 });
      } 
      // Intercepción para errores 409 comunes (como cuatrimestre activo o materia duplicada)
      else if (status === 409) {
        const msg = errorData.error || "Conflicto de validación en el servidor.";
        toast.error(msg, { id: toastId, duration: 6000 });
      } 
      // Intercepción de errores de validación de campos (express-validator)
      else if (errorData.errores) {
        const backendErrors = {};
        errorData.errores.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrores(backendErrors);
        toast.error("Por favor corrige los campos señalados en rojo", { id: toastId });
      } 
      // Fallback genérico
      else {
        const msg = errorData.error || 
                    errorData.mensaje || 
                    "Ocurrió un error al procesar la solicitud";
        toast.error(msg, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const esTroncoComun = formData.tipo_asignatura === "TRONCO_COMUN";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditing ? "Gestionar materia" : "Nueva materia"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Define las características de la asignatura para el plan de estudios.</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Nombre de la materia */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Nombre de la materia
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Programación Web Orientada a Servicios"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.nombre ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.nombre && <p className="text-xs font-bold text-red-500">{errores.nombre}</p>}
            </div>

            {/* Nivel académico */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <GraduationCap className="w-4 h-4 mr-2 text-blue-500" /> Nivel académico
              </label>
              <select
                name="nivel_academico"
                value={formData.nivel_academico}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.nivel_academico ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="LICENCIATURA">Licenciatura</option>
                <option value="MAESTRIA">Maestría</option>
              </select>
              {errores.nivel_academico && <p className="text-xs font-bold text-red-500">{errores.nivel_academico}</p>}
            </div>

            {/* Tipo de asignatura */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Layers className="w-4 h-4 mr-2 text-blue-500" /> Tipo de asignatura
              </label>
              <select
                name="tipo_asignatura"
                value={formData.tipo_asignatura}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all bg-white"
              >
                <option value="TRONCO_COMUN">Tronco común</option>
                <option value="OBLIGATORIA">Obligatoria</option>
                <option value="OPTATIVA">Optativa</option>
              </select>
            </div>

            {/* Carrera - Solo se muestra si NO es tronco común */}
            {!esTroncoComun && (
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <Layers className="w-4 h-4 mr-2 text-blue-500" /> Carrera / Maestría asignada
                </label>
                <select
                  name="carrera_id"
                  value={formData.carrera_id}
                  onChange={handleChange}
                  disabled={cargandoCatalogos}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                    errores.carrera_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                  }`}
                >
                  <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione la carrera --"}</option>
                  
                  {/* Filtrado dinámico por nivel académico */}
                  {catalogos.carreras
                    .filter(c => (c.nivel_academico || 'LICENCIATURA') === formData.nivel_academico)
                    .map(c => (
                      <option key={c.id_carrera} value={c.id_carrera}>{c.codigo_unico}</option>
                  ))}
                </select>
                {errores.carrera_id && <p className="text-xs font-bold text-red-500">{errores.carrera_id}</p>}
              </div>
            )}

            {/* Periodo escolar */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Periodo escolar
              </label>
              <select
                name="periodo_id"
                value={formData.periodo_id}
                onChange={handleChange}
                disabled={cargandoCatalogos}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.periodo_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione el periodo --"}</option>
                {catalogos.periodos.map(p => (
                  <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>
                ))}
              </select>
              {errores.periodo_id && <p className="text-xs font-bold text-red-500">{errores.periodo_id}</p>}
            </div>

            {/* Cuatrimestre */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Cuatrimestre / Semestre
              </label>
              <select
                name="cuatrimestre_id"
                value={formData.cuatrimestre_id}
                onChange={handleChange}
                disabled={cargandoCatalogos}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.cuatrimestre_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione el cuatrimestre --"}</option>
                {catalogos.cuatrimestres.map(c => (
                  <option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>{c.nombre}</option>
                ))}
              </select>
              {errores.cuatrimestre_id && <p className="text-xs font-bold text-red-500">{errores.cuatrimestre_id}</p>}
            </div>

            {/* Créditos */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Award className="w-4 h-4 mr-2 text-blue-500" /> Créditos académicos
              </label>
              <input
                type="number"
                name="creditos"
                value={formData.creditos}
                onChange={handleChange}
                min="1"
                max="30"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.creditos ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.creditos && <p className="text-xs font-bold text-red-500">{errores.creditos}</p>}
            </div>

            {/* Cupo máximo */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Users className="w-4 h-4 mr-2 text-blue-500" /> Cupo máximo
              </label>
              <input
                type="number"
                name="cupo_maximo"
                value={formData.cupo_maximo}
                onChange={handleChange}
                min="1"
                max="100"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.cupo_maximo ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.cupo_maximo && <p className="text-xs font-bold text-red-500">{errores.cupo_maximo}</p>}
            </div>

          </div>

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
          </div>
        </form>
      </div>
    </div>
  );
};