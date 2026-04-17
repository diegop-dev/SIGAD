import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Loader2, Calendar, RefreshCw, Ban } from "lucide-react";
import api from "../../services/api";
import { REGEX } from "../../utils/regex";

const formatearFechaParaInput = (cadenaFecha) => {
  if (!cadenaFecha) return "";
  return cadenaFecha.split("T")[0];
};

const obtenerNombreMes = (fecha) => {
  const meses = [
    "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
  ];
  // Aseguramos leer la fecha local sin desfases de zona horaria si viene en formato YYYY-MM-DD
  const [year, month, day] = fecha.split('-');
  const date = new Date(year, month - 1, day);
  return meses[date.getMonth()];
};

const generarCodigo = (inicio, fin) => {
  if (!inicio || !fin) return "";
  const year = inicio.split('-')[0];
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
  const [isFormDirty, setIsFormDirty] = useState(false);
  
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

  // Determinar si el formulario ha cambiado (Dirty state)
  useEffect(() => {
    if (!isEditing) {
      setIsFormDirty(!!formData.fecha_inicio || !!formData.fecha_fin || !!formData.fecha_limite_calif);
      return;
    }

    const hasChanged = 
      formData.fecha_inicio !== formatearFechaParaInput(periodoToEdit?.fecha_inicio) ||
      formData.fecha_fin !== formatearFechaParaInput(periodoToEdit?.fecha_fin) ||
      formData.fecha_limite_calif !== formatearFechaParaInput(periodoToEdit?.fecha_limite_calif);

    setIsFormDirty(hasChanged);
  }, [formData, periodoToEdit, isEditing]);

  const verificarOverlapConExistentes = (inicio, fin, idActual = null) => {
    if (!inicio || !fin) return null;
    
    for (const periodo of periodosExistentes) {
      if (idActual && periodo.id_periodo === idActual) continue;
      
      if (hayOverlap(inicio, fin, formatearFechaParaInput(periodo.fecha_inicio), formatearFechaParaInput(periodo.fecha_fin))) {
        const fechaInicioExistente = new Date(periodo.fecha_inicio).toLocaleDateString();
        const fechaFinExistente = new Date(periodo.fecha_fin).toLocaleDateString();
        
        return `El periodo se sobrepone con el periodo ${periodo.codigo || 'existente'} (${fechaInicioExistente} - ${fechaFinExistente})`;
      }
    }
    return null;
  };

  // Validación en tiempo real de empalmes
  useEffect(() => {
    if (formData.fecha_inicio && formData.fecha_fin) {
      const errorOverlap = verificarOverlapConExistentes(
        formData.fecha_inicio, 
        formData.fecha_fin, 
        periodoToEdit?.id_periodo
      );

      setErrores((prev) => {
        if (errorOverlap) {
          return { ...prev, overlap: errorOverlap };
        } else {
          const newErrors = { ...prev };
          delete newErrors.overlap;
          return newErrors;
        }
      });
    }
  }, [formData.fecha_inicio, formData.fecha_fin, periodosExistentes, periodoToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setServerAction(null); // Limpiar alerta de integridad al intentar corregir
    
    let updatedData = {
      ...formData,
      [name]: value
    };

    // Lógica automática de fechas
    if (name === "fecha_inicio" && value) {
      const inicio = new Date(value);
      // Se utiliza UTC para evitar desfases al sumar días
      const fechaFin = new Date(inicio.getTime() + (84 * 24 * 60 * 60 * 1000)); // +12 semanas

      updatedData.fecha_fin = fechaFin.toISOString().split("T")[0];
      updatedData.fecha_limite_calif = new Date(fechaFin.getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split("T")[0]; // -30 días del fin
    }

    setFormData(updatedData);

    // Limpiar el error específico del campo modificado
    if (errores[name]) {
      setErrores((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors = { ...errores }; // Preservar errores en tiempo real como el overlap
    const { fecha_inicio, fecha_fin, fecha_limite_calif } = formData;

    if (!fecha_inicio) newErrors.fecha_inicio = "Fecha de inicio obligatoria";
    if (!fecha_fin) newErrors.fecha_fin = "Fecha de fin obligatoria";
    if (!fecha_limite_calif) newErrors.fecha_limite_calif = "Fecha límite obligatoria";

    // Validar que el año extraído tenga exactamente 4 dígitos numéricos
    if (fecha_inicio) {
      const anio = fecha_inicio.split('-')[0];
      if (!REGEX.ANIO.test(anio)) newErrors.fecha_inicio = "El año de la fecha de inicio no es válido.";
    }

    if (fecha_inicio && fecha_fin) {
      const inicio = new Date(fecha_inicio);
      const fin = new Date(fecha_fin);
      const minFin = new Date(inicio.getTime() + (84 * 24 * 60 * 60 * 1000));

      if (fin < minFin) {
        newErrors.fecha_fin = "Debe ser al menos 12 semanas después del inicio";
      }
      
      if (inicio > fin) {
        newErrors.fecha_fin = "La fecha de fin debe ser posterior a la fecha de inicio";
      }
    }

    if (fecha_fin && fecha_limite_calif) {
      const fin = new Date(fecha_fin);
      const limite = new Date(fecha_limite_calif);
      // La fecha límite debe estar entre fecha_inicio+1 día y fecha_fin-30 días
      const minLimite = fecha_inicio ? new Date(new Date(fecha_inicio).getTime() + (1 * 24 * 60 * 60 * 1000)) : null;
      const maxLimite = new Date(fin.getTime() - (30 * 24 * 60 * 60 * 1000));

      if (minLimite && limite <= new Date(fecha_inicio)) {
        newErrors.fecha_limite_calif = "La fecha límite debe ser posterior a la fecha de inicio del periodo";
      } else if (limite > maxLimite) {
        newErrors.fecha_limite_calif = "Debe ser al menos 30 días antes de la fecha de fin del periodo";
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
        anio: formData.fecha_inicio.split('-')[0] // Extraer el año directamente del input
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
        if (msg.toLowerCase().includes("sobrepone")) {
          setErrores(prev => ({ ...prev, overlap: msg }));
        }
        toast.error(`Error: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || !isFormDirty || Object.keys(errores).length > 0 || serverAction === 'BLOCK';

  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none [&:autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:autofill]:[-webkit-text-fill-color:#0B1828]";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      
      {/* Header estandarizado */}
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10">
        <button
          type="button"
          onClick={onBack}
          className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        <div>
          <h2 className="text-xl font-black text-white">
            {isEditing ? "Modificar periodo escolar" : "Nuevo periodo escolar"}
          </h2>
          <p className="text-sm text-white/60 font-medium">
            Define el rango de fechas del ciclo escolar
          </p>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto">
          
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-8 w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-10">
            {/* Mensajes de Alerta del Servidor (Integridad) */}
            {serverAction === 'BLOCK' && (
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex items-start shadow-sm">
                <Ban className="w-6 h-6 text-amber-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-base font-black text-amber-900 mb-1">Acción bloqueada</h4>
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">{serverMessage}</p>
                </div>
              </div>
            )}

            {/* Sección: Fechas del Periodo */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Configuración de Fechas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Calendar className="w-4 h-4 mr-2" /> Fecha inicio <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleChange}
                    disabled={serverAction === 'BLOCK'}
                    className={`${inputBaseClass} ${getValidationClass(errores.fecha_inicio || errores.overlap)}`}
                  />
                  {(errores.fecha_inicio || errores.overlap) && (
                    <p className="text-xs font-bold text-red-500 mt-1.5">
                      {errores.fecha_inicio || errores.overlap}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Calendar className="w-4 h-4 mr-2 opacity-0" /> Fecha fin <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_fin"
                    value={formData.fecha_fin}
                    onChange={handleChange}
                    disabled={serverAction === 'BLOCK'}
                    min={formData.fecha_inicio}
                    className={`${inputBaseClass} ${getValidationClass(errores.fecha_fin || errores.overlap)}`}
                  />
                  {(errores.fecha_fin || errores.overlap) && (
                    <p className="text-xs font-bold text-red-500 mt-1.5">
                      {errores.fecha_fin || errores.overlap}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" /> Fecha límite de captura de calificaciones <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_limite_calif"
                    value={formData.fecha_limite_calif}
                    onChange={handleChange}
                    disabled={serverAction === 'BLOCK'}
                    min={formData.fecha_inicio || undefined}
                    max={formData.fecha_fin
                      ? new Date(new Date(formData.fecha_fin).getTime() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
                      : undefined
                    }
                    className={`${inputBaseClass} ${getValidationClass(errores.fecha_limite_calif)}`}
                  />
                  {errores.fecha_limite_calif && (
                    <p className="text-xs font-bold text-red-500 mt-1.5">
                      {errores.fecha_limite_calif}
                    </p>
                  )}
                </div>

              </div>
            </div>

            {/* Código generado previsualización */}
            {formData.fecha_inicio && formData.fecha_fin && !errores.overlap && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-2 relative group shadow-inner">
                <span className="block text-sm text-[#0B1828] font-bold mb-2">Código generado automáticamente:</span>
                <code className="text-2xl font-mono font-black text-[#0B1828] tracking-wider">
                  {generarCodigo(formData.fecha_inicio, formData.fecha_fin)}
                </code>
              </div>
            )}

            {/* Footer Submit */}
            <div className="pt-8 border-t border-dashed border-slate-200 mt-2">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg ${
                  isSubmitDisabled
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300"
                    : "bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
                }`}
              >
                {isSubmitting
                  ? <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  : isEditing 
                    ? <RefreshCw className="w-6 h-6 mr-2 text-white" />
                    : <Save className="w-6 h-6 mr-2 text-white" />
                }
                {isSubmitting
                  ? "Guardando cambios..."
                  : isEditing ? "Modificar Periodo" : "Nuevo Periodo"
                }
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};