import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, BookOpen, Users, GraduationCap, TrendingUp, Save, Loader2, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const MetricasForm = ({ periodos, onBack, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  
  const [carrerasDisponibles, setCarrerasDisponibles] = useState([]);
  const [isFetchingCarreras, setIsFetchingCarreras] = useState(false);

  const [formData, setFormData] = useState({
    periodo_id: periodos && periodos.length === 1 ? periodos[0].id_periodo : '',
    nivel_academico: 'LICENCIATURA',
    carrera_id: '',
    total_inscritos: '',
    total_egresados: '',
    promedio_general: ''
  });

  // Carga las carreras solo cuando se selecciona un periodo
  useEffect(() => {
    const fetchCarrerasPorPeriodo = async () => {
      if (!formData.periodo_id) {
        setCarrerasDisponibles([]);
        return;
      }

      setIsFetchingCarreras(true);
      try {
        const response = await api.get('/carreras', { 
          params: { periodo_id: formData.periodo_id } 
        });
        const data = response.data?.data || response.data || [];
        setCarrerasDisponibles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar carreras del periodo:", error);
        toast.error("Ocurrió un error al consultar los programas educativos del periodo.");
        setCarrerasDisponibles([]);
      } finally {
        setIsFetchingCarreras(false);
      }
    };

    fetchCarrerasPorPeriodo();
    
    // Resetear la carrera seleccionada siempre que cambie el periodo
    setFormData(prev => ({ ...prev, carrera_id: '' }));
  }, [formData.periodo_id]);

  // Filtramos las carreras cargadas por el nivel académico seleccionado
  const carrerasFiltradas = useMemo(() => {
    return carrerasDisponibles.filter(c => 
      (c.nivel_academico || 'LICENCIATURA') === formData.nivel_academico
    );
  }, [carrerasDisponibles, formData.nivel_academico]);

  const validateField = (name, value, currentFormData = formData) => {
    let errorMsj = null;
    if (name === "periodo_id" && !value) errorMsj = "Por favor, selecciona un periodo académico.";
    if (name === "carrera_id" && !value) errorMsj = "Por favor, selecciona un programa educativo.";

    if (name === "total_inscritos") {
      const inscritos = parseInt(value, 10);
      if (!value) errorMsj = "El total de inscritos es obligatorio.";
      else if (isNaN(inscritos) || inscritos < 0) errorMsj = "Ingresa una cantidad válida mayor o igual a 0.";
    }

    if (name === "total_egresados") {
      const egresados = parseInt(value, 10);
      const inscritos = parseInt(currentFormData.total_inscritos, 10);
      if (!value) errorMsj = "El total de egresados es obligatorio.";
      else if (isNaN(egresados) || egresados < 0) errorMsj = "Ingresa una cantidad válida mayor o igual a 0.";
      else if (!isNaN(inscritos) && inscritos >= 0 && egresados > inscritos) errorMsj = "Incongruencia: Los egresados no pueden superar a los inscritos.";
    }

    if (name === "promedio_general") {
      const promedio = parseFloat(value);
      if (!value) errorMsj = "El promedio general es obligatorio.";
      else if (isNaN(promedio) || promedio < 0 || promedio > 100) errorMsj = "El promedio debe encontrarse en una escala válida de 0 a 100.";
    }
    return errorMsj;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (typeof value === 'string') {
        sanitizedValue = value.trimStart();
        if (name === 'total_inscritos' || name === 'total_egresados') {
          sanitizedValue = sanitizedValue.replace(/\D/g, '').slice(0, 4);
        }
        if (name === 'promedio_general') {
          sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '')
                                         .replace(/(\..*)\./g, '$1')
                                         .slice(0, 6);
        }
    }

    const nextFormData = { ...formData, [name]: sanitizedValue };
    if (name === 'nivel_academico') {
      nextFormData.carrera_id = '';
    }
    setFormData(nextFormData);

    setErrores(prev => {
      const newErrors = { ...prev };
      const err = validateField(name, sanitizedValue, nextFormData);
      if (err) newErrors[name] = err; else delete newErrors[name];

      if (name === 'total_inscritos' && nextFormData.total_egresados) {
         const errEg = validateField('total_egresados', nextFormData.total_egresados, nextFormData);
         if (errEg) newErrors.total_egresados = errEg; else delete newErrors.total_egresados;
      }
      if (name === 'nivel_academico') {
         const errCar = validateField('carrera_id', nextFormData.carrera_id, nextFormData);
         if (errCar) newErrors.carrera_id = errCar; else delete newErrors.carrera_id;
      }

      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    ['periodo_id', 'carrera_id', 'total_inscritos', 'total_egresados', 'promedio_general'].forEach(field => {
      const err = validateField(field, formData[field]);
      if (err) newErrors[field] = err;
    });
    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores marcados en el formulario.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Guardando métricas en la base de datos...');

    try {
      // Creamos una copia del payload sin el nivel académico
      const { nivel_academico, ...payload } = formData;
      await api.post('/metricas', payload);
      toast.success('Métricas institucionales guardadas exitosamente.', { id: toastId });
      
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Ocurrió un error de concurrencia al guardar las métricas.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled = isSubmitting || Object.keys(errores).length > 0;

  // Clases estandarizadas para inputs
  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none [&:autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:autofill]:[-webkit-text-fill-color:#0B1828]";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500 bg-white" 
      : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative animate-in fade-in duration-200">
      
      {/* Encabezado Navy Estandarizado */}
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10">
        <button
          onClick={onBack}
          className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
          title="Volver atrás"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white">
            Nueva métrica
          </h2>
          <p className="text-sm text-white/60 font-medium">
            Captura los datos de rendimiento y retención institucional del periodo.
          </p>
        </div>
      </div>

      {/* Cuerpo del Formulario */}
      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto">
          
          {/* Indicador de campos obligatorios */}
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-8 w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-10">
            {/* Sección 1 Configuración del Periodo */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Parámetros del Periodo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Periodo académico */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Calendar className="w-4 h-4 mr-2" /> Periodo académico <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="periodo_id"
                      value={formData.periodo_id}
                      onChange={handleInputChange}
                      className={`${inputBaseClass} appearance-none pr-10 ${getValidationClass(errores.periodo_id)}`}
                    >
                      <option value="" disabled>Selecciona un periodo</option>
                      {periodos.map(p => (
                        <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errores.periodo_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.periodo_id}</p>}
                </div>

                {/* Nivel Académico */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <GraduationCap className="w-4 h-4 mr-2" /> Nivel académico <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="nivel_academico"
                      value={formData.nivel_academico}
                      onChange={handleInputChange}
                      disabled={!formData.periodo_id || isFetchingCarreras}
                      className={`${inputBaseClass} appearance-none pr-10 ${getValidationClass(errores.nivel_academico)} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
                    >
                      <option value="LICENCIATURA">Licenciatura</option>
                      <option value="MAESTRIA">Maestría</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Carrera */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <BookOpen className="w-4 h-4 mr-2" /> Carrera <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <div className="relative">
                    <select
                      name="carrera_id"
                      value={formData.carrera_id}
                      onChange={handleInputChange}
                      disabled={!formData.periodo_id || isFetchingCarreras}
                      className={`${inputBaseClass} appearance-none pr-10 ${getValidationClass(errores.carrera_id)} disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
                    >
                      <option value="" disabled>
                        {!formData.periodo_id 
                          ? 'Selecciona un periodo primero' 
                          : isFetchingCarreras 
                            ? 'Consultando programas educativos...' 
                            : carrerasFiltradas.length === 0 
                              ? 'No hay carreras activas en este nivel'
                              : 'Selecciona una carrera'}
                      </option>
                      {carrerasFiltradas.map(c => (
                        <option key={c.id_carrera} value={c.id_carrera}>{c.codigo_unico || c.nombre_carrera}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  {errores.carrera_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.carrera_id}</p>}
                </div>
              </div>
            </div>

            {/* Sección 2 Datos de la Generación */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Datos de la Generación</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Total Inscritos */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Users className="w-4 h-4 mr-2" /> Total de inscritos <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="total_inscritos"
                    maxLength="4"
                    value={formData.total_inscritos}
                    onChange={handleInputChange}
                    placeholder="Ej. 120"
                    className={`${inputBaseClass} ${getValidationClass(errores.total_inscritos)}`}
                  />
                  {errores.total_inscritos && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.total_inscritos}</p>}
                </div>

                {/* Total Egresados */}
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <GraduationCap className="w-4 h-4 mr-2" /> Total de egresados <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="total_egresados"
                    maxLength="4"
                    value={formData.total_egresados}
                    onChange={handleInputChange}
                    placeholder="Ej. 95"
                    className={`${inputBaseClass} ${getValidationClass(errores.total_egresados)}`}
                  />
                  {errores.total_egresados && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.total_egresados}</p>}
                </div>

                {/* Promedio general */}
                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <TrendingUp className="w-4 h-4 mr-2" /> Promedio general de la generación <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="promedio_general"
                    maxLength="6"
                    value={formData.promedio_general}
                    onChange={handleInputChange}
                    placeholder="Ej. 85.50"
                    className={`${inputBaseClass} ${getValidationClass(errores.promedio_general)}`}
                  />
                  {errores.promedio_general && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.promedio_general}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Pie del Formulario (Submit) */}
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
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin text-slate-400" /> Procesando...
                </>
              ) : (
                <>
                  <Save className="w-6 h-6 mr-2 text-white" /> Nueva Métrica
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};