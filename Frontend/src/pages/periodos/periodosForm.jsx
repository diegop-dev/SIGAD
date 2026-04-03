import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Calendar, Edit3, Ban } from "lucide-react";
import api from "../../services/api";

const formatearFechaParaInput = (cadenaFecha) => {
  if (!cadenaFecha) return "";
  return cadenaFecha.split("T")[0];
};

const obtenerNombreMes = (fecha) => {
  const meses = [
    "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
  ];
  const date = new Date(fecha);
  return meses[date.getMonth()];
};

const generarCodigo = (inicio, fin) => {
  const year = new Date(inicio).getFullYear();
  const mesInicio = obtenerNombreMes(inicio);
  const mesFin = obtenerNombreMes(fin);
  return `${year}-${mesInicio}-${mesFin}`;
};

// Función para verificar si dos periodos se sobreponen
const hayOverlap = (inicio1, fin1, inicio2, fin2) => {
  const start1 = new Date(inicio1);
  const end1 = new Date(fin1);
  const start2 = new Date(inicio2);
  const end2 = new Date(fin2);
  
  return (start1 <= end2 && end1 >= start2);
};

export const PeriodosForm = ({ periodoToEdit, onBack, onSuccess }) => {
  const isEditing = !!periodoToEdit;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const [periodosExistentes, setPeriodosExistentes] = useState([]);
  
  // Memoria del semáforo de integridad
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  const [formData, setFormData] = useState({
    fecha_inicio: formatearFechaParaInput(periodoToEdit?.fecha_inicio),
    fecha_fin: formatearFechaParaInput(periodoToEdit?.fecha_fin),
    fecha_limite_calif: formatearFechaParaInput(periodoToEdit?.fecha_limite_calif)
  });

  useEffect(() => {
    const cargarPeriodos = async () => {
      try {
        const response = await api.get("/periodos");
        setPeriodosExistentes(response.data);
      } catch (error) {
        console.error("Error al cargar periodos:", error);
      }
    };
    
    cargarPeriodos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServerAction(null); // Limpiar alerta de integridad al intentar corregir
    
    let updatedData = {
      ...formData,
      [name]: value
    };

    if (name === "fecha_inicio" && value) {
      const inicio = new Date(value);
      const fechaFin = new Date(inicio);
      fechaFin.setDate(fechaFin.getDate() + 84); // +12 semanas
      const fechaLimite = new Date(fechaFin);
      fechaLimite.setDate(fechaLimite.getDate() - 15); // -15 días

      updatedData.fecha_fin = fechaFin.toISOString().split("T")[0];
      updatedData.fecha_limite_calif = fechaLimite.toISOString().split("T")[0];
    }

    setFormData(updatedData);

    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: null }));
    }
    
    if (name === "fecha_inicio" || name === "fecha_fin") {
      setErrores((prev) => ({ ...prev, overlap: null }));
    }
  };

  const verificarOverlapConExistentes = (inicio, fin, idActual = null) => {
    if (!inicio || !fin) return null;
    
    for (const periodo of periodosExistentes) {
      if (idActual && periodo.id_periodo === idActual) continue;
      
      if (hayOverlap(inicio, fin, periodo.fecha_inicio, periodo.fecha_fin)) {
        const fechaInicioExistente = new Date(periodo.fecha_inicio).toLocaleDateString();
        const fechaFinExistente = new Date(periodo.fecha_fin).toLocaleDateString();
        
        return `El periodo se sobrepone con el periodo ${periodo.codigo || 'existente'} (${fechaInicioExistente} - ${fechaFinExistente})`;
      }
    }
    return null;
  };

  const validate = () => {
    const newErrors = {};
    const { fecha_inicio, fecha_fin, fecha_limite_calif } = formData;

    if (!fecha_inicio) newErrors.fecha_inicio = "Fecha de inicio obligatoria";
    if (!fecha_fin) newErrors.fecha_fin = "Fecha de fin obligatoria";
    if (!fecha_limite_calif) newErrors.fecha_limite_calif = "Fecha límite obligatoria";

    if (fecha_inicio && fecha_fin) {
      const inicio = new Date(fecha_inicio);
      const fin = new Date(fecha_fin);
      const minFin = new Date(inicio);
      minFin.setDate(minFin.getDate() + 84);

      if (fin < minFin) {
        newErrors.fecha_fin = "Debe ser al menos 12 semanas después del inicio";
      }
    }

    if (fecha_fin && fecha_limite_calif) {
      const fin = new Date(fecha_fin);
      const limite = new Date(fecha_limite_calif);
      const maxLimite = new Date(fin);
      maxLimite.setDate(maxLimite.getDate() - 15);

      if (limite > maxLimite) {
        newErrors.fecha_limite_calif = "Debe ser al menos 15 días antes de la fecha final";
      }
    }

    if (fecha_inicio && fecha_fin && new Date(fecha_inicio) > new Date(fecha_fin)) {
      newErrors.fecha_fin = "La fecha de fin debe ser posterior a la fecha de inicio";
    }

    if (fecha_inicio && fecha_fin && Object.keys(newErrors).length === 0) {
      const errorOverlap = verificarOverlapConExistentes(
        fecha_inicio, 
        fecha_fin, 
        periodoToEdit?.id_periodo
      );
      
      if (errorOverlap) {
        newErrors.overlap = errorOverlap;
      }
    }

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando periodo..." : "Guardando periodo...");

    try {
      const codigo = generarCodigo(formData.fecha_inicio, formData.fecha_fin);
      const payload = {
        ...formData,
        codigo,
        anio: new Date(formData.fecha_inicio).getFullYear()
      };

      if (isEditing) {
        await api.put(`/periodos/${periodoToEdit.id_periodo}`, payload);
        toast.success("Periodo actualizado correctamente", { id: toastId });
      } else {
        await api.post("/periodos", payload);
        toast.success("Periodo creado correctamente", { id: toastId });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      toast.dismiss(toastId);

      // Intercepción del bloqueo de integridad relacional
      if (status === 409 && errorData.action === "BLOCK") {
        setServerAction("BLOCK");
        const detalles = errorData.detalles || "Conflicto de integridad referencial.";
        setServerMessage(detalles);
        toast.error("Operación denegada por reglas de integridad", { duration: 8000 });
      } else {
        const msg = errorData.error || errorData.mensaje || "Error al guardar el periodo";
        if (msg.includes("sobrepone")) {
          setErrores(prev => ({ ...prev, overlap: msg }));
        }
        toast.error(`Error: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-center">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? "Editar periodo escolar" : "Nuevo periodo escolar"}
          </h2>
          <p className="text-sm text-slate-500">
            Define el rango de fechas del ciclo escolar
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {errores.overlap && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <p className="text-sm font-medium flex items-center">
                <span className="mr-2">⚠️</span>
                {errores.overlap}
              </p>
            </div>
          )}

          {serverAction === 'BLOCK' && (
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start">
              <Ban className="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 mb-1">Acción bloqueada</h4>
                <p className="text-sm text-amber-800 font-medium leading-relaxed">{serverMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Fecha inicio
              </label>

              <input
                type="date"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                disabled={serverAction === 'BLOCK'}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-4 py-3 rounded-xl border text-sm ${
                  errores.fecha_inicio
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errores.fecha_inicio && (
                <p className="text-xs text-red-500">{errores.fecha_inicio}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                Fecha fin
              </label>

              <input
                type="date"
                name="fecha_fin"
                value={formData.fecha_fin}
                onChange={handleChange}
                disabled={serverAction === 'BLOCK'}
                min={formData.fecha_inicio}
                className={`w-full px-4 py-3 rounded-xl border text-sm ${
                  errores.fecha_fin
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errores.fecha_fin && (
                <p className="text-xs text-red-500">{errores.fecha_fin}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-amber-500" />
                Fecha límite de captura de calificaciones
              </label>

              <input
                type="date"
                name="fecha_limite_calif"
                value={formData.fecha_limite_calif}
                onChange={handleChange}
                disabled={serverAction === 'BLOCK'}
                max={formData.fecha_fin}
                className={`w-full px-4 py-3 rounded-xl border text-sm ${
                  errores.fecha_limite_calif
                    ? "border-red-300 bg-red-50"
                    : "border-slate-200 focus:border-blue-500"
                }`}
              />
              {errores.fecha_limite_calif && (
                <p className="text-xs text-red-500">
                  {errores.fecha_limite_calif}
                </p>
              )}
            </div>
          </div>

          {formData.fecha_inicio && formData.fecha_fin && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Código generado:</span>{" "}
                <code className="bg-white px-2 py-1 rounded border border-slate-200 text-blue-600">
                  {generarCodigo(formData.fecha_inicio, formData.fecha_fin)}
                </code>
              </p>
            </div>
          )}

          <div className="flex justify-end pt-6 border-t border-slate-100">
            {serverAction === 'BLOCK' ? (
              <button
                type="button"
                onClick={onBack}
                className="px-8 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Cerrar y volver
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : isEditing ? (
                  <Edit3 className="w-5 h-5 mr-2" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}

                {isSubmitting 
                  ? "Guardando..." 
                  : isEditing 
                    ? "Actualizar periodo" 
                    : "Guardar periodo"
                }
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};