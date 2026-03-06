import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, CalendarDays, Hash, Calendar, Edit3, Trash2, AlertCircle } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

const formatearFechaParaInput = (cadenaFecha) => {
  if (!cadenaFecha) return "";
  return cadenaFecha.split('T')[0];
};

export const PeriodosForm = ({ periodoToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!periodoToEdit;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});

  const [formData, setFormData] = useState({
    codigo: periodoToEdit?.codigo || "",
    anio: periodoToEdit?.anio || new Date().getFullYear(),
    fecha_inicio: formatearFechaParaInput(periodoToEdit?.fecha_inicio),
    fecha_fin: formatearFechaParaInput(periodoToEdit?.fecha_fin),
    fecha_limite_calif: formatearFechaParaInput(periodoToEdit?.fecha_limite_calif)
  });

  // Cálculo reactivo segmentado exclusivamente por mes de inicio y mes de fin teórico
  const limitesFecha = useMemo(() => {
    if (!formData.codigo || !formData.anio) return null;
    
    const year = formData.anio;
    const rangos = {
      "ENERO-ABRIL": { 
        inicioMin: `${year}-01-01`, inicioMax: `${year}-01-31`,
        finMin: `${year}-04-01`, finMax: `${year}-04-30` 
      },
      "MAYO-AGOSTO": { 
        inicioMin: `${year}-05-01`, inicioMax: `${year}-05-31`,
        finMin: `${year}-08-01`, finMax: `${year}-08-31` 
      },
      "SEPTIEMBRE-DICIEMBRE": { 
        inicioMin: `${year}-09-01`, inicioMax: `${year}-09-30`,
        finMin: `${year}-12-01`, finMax: `${year}-12-31` 
      }
    };
    
    return rangos[formData.codigo];
  }, [formData.codigo, formData.anio]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" && value !== "" ? Number(value) : value;

    setFormData(prev => {
      const newData = { ...prev, [name]: parsedValue };
      
      // Limpieza de fechas si se altera la base del periodo
      if (name === "codigo" || name === "anio") {
        newData.fecha_inicio = "";
        newData.fecha_fin = "";
        newData.fecha_limite_calif = "";
      }
      return newData;
    });

    // Limpiar el error del campo que se está editando
    if (errores[name]) setErrores({ ...errores, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    const { codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif } = formData;

    if (!codigo) newErrors.codigo = "Selecciona el cuatrimestre";
    if (!anio) newErrors.anio = "El año es obligatorio";
    else if (anio < 2020) newErrors.anio = "El año no puede ser menor a 2020";
    
    if (!fecha_inicio) newErrors.fecha_inicio = "La fecha de inicio es obligatoria";
    if (!fecha_fin) newErrors.fecha_fin = "La fecha de fin es obligatoria";
    if (!fecha_limite_calif) newErrors.fecha_limite_calif = "La fecha límite es obligatoria";

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando periodo..." : "Guardando periodo...");

    try {
      if (isEditing) {
        await api.put(`/periodos/${periodoToEdit.id_periodo}`, formData);
        toast.success("Periodo actualizado correctamente", { id: toastId });
      } else {
        await api.post("/periodos", formData);
        toast.success("Periodo creado correctamente", { id: toastId });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.response?.data?.errores) {
        const backendErrors = {};
        error.response.data.errores.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrores(backendErrors);
        toast.error("Por favor corrige los campos señalados en rojo", { id: toastId });
      } else {
        const msg = error.response?.data?.error || error.response?.data?.mensaje || "Ocurrió un error al procesar la solicitud";
        toast.error(msg, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlaceholder = () => toast("Función de eliminación desde formulario en desarrollo", { icon: "🚧" });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditing ? "Gestionar periodo" : "Nuevo periodo"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Define la temporalidad y límites del ciclo escolar.</p>
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
            
            {/* Código del periodo */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <CalendarDays className="w-4 h-4 mr-2 text-blue-500" /> Código del periodo
              </label>
              <select
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.codigo ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="" disabled>-- Seleccione el cuatrimestre --</option>
                <option value="ENERO-ABRIL">ENERO-ABRIL</option>
                <option value="MAYO-AGOSTO">MAYO-AGOSTO</option>
                <option value="SEPTIEMBRE-DICIEMBRE">SEPTIEMBRE-DICIEMBRE</option>
              </select>
              {errores.codigo && <p className="text-xs font-bold text-red-500">{errores.codigo}</p>}
            </div>

            {/* Año */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Hash className="w-4 h-4 mr-2 text-blue-500" /> Año
              </label>
              <input
                type="number"
                name="anio"
                value={formData.anio}
                onChange={handleChange}
                placeholder="Ej: 2026"
                min="2020"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.anio ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.anio && <p className="text-xs font-bold text-red-500">{errores.anio}</p>}
            </div>

            {/* Fecha inicio */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Fecha inicio
              </label>
              <input
                type="date"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                min={limitesFecha?.inicioMin || ""}
                max={limitesFecha?.inicioMax || ""}
                disabled={!limitesFecha}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
                  errores.fecha_inicio ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.fecha_inicio && <p className="text-xs font-bold text-red-500">{errores.fecha_inicio}</p>}
            </div>

            {/* Fecha fin */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Fecha fin
              </label>
              <input
                type="date"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
                min={limitesFecha?.finMin || ""}
                max={limitesFecha?.finMax || ""}
                disabled={!limitesFecha}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
                  errores.fecha_fin ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.fecha_fin && <p className="text-xs font-bold text-red-500">{errores.fecha_fin}</p>}
            </div>

            {/* Fecha límite calificaciones */}
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center text-sm font-bold text-amber-600">
                <AlertCircle className="w-4 h-4 mr-2" /> Fecha límite de calificaciones
              </label>
              <input
                type="date"
                name="fecha_limite_calif"
                value={formData.fecha_limite_calif}
                onChange={handleChange}
                min={limitesFecha?.finMin || ""}
                max={limitesFecha?.finMax || ""}
                disabled={!limitesFecha}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all disabled:bg-slate-50 disabled:text-slate-400 ${
                  errores.fecha_limite_calif ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-amber-100 focus:border-amber-300"
                }`}
              />
              {errores.fecha_limite_calif && <p className="text-xs font-bold text-red-500">{errores.fecha_limite_calif}</p>}
            </div>
          </div>

          {/* Footer de botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            {isEditing ? (
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex items-center px-6 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Edit3 className="w-5 h-5 mr-2" />}
                Actualizar datos
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar periodo
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};