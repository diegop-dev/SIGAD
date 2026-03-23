import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, BookOpen, Users, GraduationCap, TrendingUp, Save, Loader2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const MetricasForm = ({ periodos, onBack, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  
  // NUEVOS ESTADOS: Para manejar la carga dinámica de carreras
  const [carrerasDisponibles, setCarrerasDisponibles] = useState([]);
  const [isFetchingCarreras, setIsFetchingCarreras] = useState(false);

  const [formData, setFormData] = useState({
    periodo_id: '',
    carrera_id: '',
    total_inscritos: '',
    total_egresados: '',
    promedio_general: ''
  });

  // EFECTO DINÁMICO: Carga las carreras solo cuando se selecciona un periodo
  useEffect(() => {
    const fetchCarrerasPorPeriodo = async () => {
      // Si no hay periodo seleccionado, vaciamos la lista de carreras
      if (!formData.periodo_id) {
        setCarrerasDisponibles([]);
        return;
      }

      setIsFetchingCarreras(true);
      try {
        // Solicitamos al backend las carreras filtradas por periodo
        const response = await api.get('/carreras', { 
          params: { periodo_id: formData.periodo_id } 
        });
        const data = response.data?.data || response.data || [];
        setCarrerasDisponibles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar carreras del periodo:", error);
        toast.error("Error al cargar las carreras disponibles.");
        setCarrerasDisponibles([]);
      } finally {
        setIsFetchingCarreras(false);
      }
    };

    fetchCarrerasPorPeriodo();
    
    // Resetear la carrera seleccionada siempre que cambie el periodo
    setFormData(prev => ({ ...prev, carrera_id: '' }));
  }, [formData.periodo_id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value.trimStart();

    if (name === 'total_inscritos' || name === 'total_egresados') {
      sanitizedValue = sanitizedValue.replace(/\D/g, '').slice(0, 4);
    }

    if (name === 'promedio_general') {
      sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '')
                                     .replace(/(\..*)\./g, '$1')
                                     .slice(0, 4);
    }

    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));

    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.periodo_id) newErrors.periodo_id = "El periodo académico es obligatorio.";
    if (!formData.carrera_id) newErrors.carrera_id = "El programa educativo es obligatorio.";

    const inscritos = parseInt(formData.total_inscritos, 10);
    if (!formData.total_inscritos) newErrors.total_inscritos = "El total de inscritos es obligatorio.";
    else if (isNaN(inscritos) || inscritos < 0) newErrors.total_inscritos = "Ingrese un número válido mayor a 0.";

    const egresados = parseInt(formData.total_egresados, 10);
    if (!formData.total_egresados) newErrors.total_egresados = "El total de egresados es obligatorio.";
    else if (isNaN(egresados) || egresados < 0) newErrors.total_egresados = "Ingrese un número válido mayor a 0.";
    else if (inscritos > 0 && egresados > inscritos) newErrors.total_egresados = "Los egresados no pueden superar a los inscritos.";

    const promedio = parseFloat(formData.promedio_general);
    if (!formData.promedio_general) newErrors.promedio_general = "El promedio es obligatorio.";
    else if (isNaN(promedio) || promedio < 0 || promedio > 10) newErrors.promedio_general = "El promedio debe estar entre 0 y 10.";

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrige los errores en el formulario.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Guardando métricas en la base de datos...');

    try {
      await api.post('/metricas', formData);
      toast.success('Métricas guardadas exitosamente.', { id: toastId });
      
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error de concurrencia al guardar las métricas.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">Registro de nuevas métricas</h2>
            <p className="text-sm text-slate-500 font-medium">
              Captura los datos de rendimiento y retención institucional.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Periodo académico */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Periodo académico
              </label>
              <select
                name="periodo_id"
                value={formData.periodo_id}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.periodo_id
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-slate-200 focus:ring-blue-100'
                }`}
              >
                <option value="">-- Selecciona un periodo --</option>
                {periodos.map(p => (
                  <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>
                ))}
              </select>
              {errores.periodo_id && (
                <p className="text-xs font-bold text-red-500">{errores.periodo_id}</p>
              )}
            </div>

            {/* Programa educativo DINÁMICO */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Programa educativo (Carrera)
              </label>
              <select
                name="carrera_id"
                value={formData.carrera_id}
                onChange={handleInputChange}
                disabled={!formData.periodo_id || isFetchingCarreras}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.carrera_id
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-slate-200 focus:ring-blue-100'
                } disabled:bg-slate-100 disabled:text-slate-400`}
              >
                <option value="">
                  {!formData.periodo_id 
                    ? '-- Selecciona un periodo primero --' 
                    : isFetchingCarreras 
                      ? 'Cargando carreras...' 
                      : carrerasDisponibles.length === 0 
                        ? '-- No hay carreras en este periodo --'
                        : '-- Selecciona una carrera --'}
                </option>
                {carrerasDisponibles.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                ))}
              </select>
              {errores.carrera_id && (
                <p className="text-xs font-bold text-red-500">{errores.carrera_id}</p>
              )}
            </div>

            {/* Total inscritos */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Users className="w-4 h-4 mr-2 text-blue-500" /> Total de inscritos
              </label>
              <input
                type="text"
                name="total_inscritos"
                value={formData.total_inscritos}
                onChange={handleInputChange}
                placeholder="Ej. 120"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.total_inscritos
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-slate-200 focus:ring-blue-100'
                }`}
              />
              {errores.total_inscritos && (
                <p className="text-xs font-bold text-red-500">{errores.total_inscritos}</p>
              )}
            </div>

            {/* Total egresados */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <GraduationCap className="w-4 h-4 mr-2 text-blue-500" /> Total de egresados
              </label>
              <input
                type="text"
                name="total_egresados"
                value={formData.total_egresados}
                onChange={handleInputChange}
                placeholder="Ej. 95"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.total_egresados
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-slate-200 focus:ring-blue-100'
                }`}
              />
              {errores.total_egresados && (
                <p className="text-xs font-bold text-red-500">{errores.total_egresados}</p>
              )}
            </div>

            {/* Promedio general */}
            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-500" /> Promedio general de la generación
              </label>
              <input
                type="text"
                name="promedio_general"
                value={formData.promedio_general}
                onChange={handleInputChange}
                placeholder="Ej. 8.5"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.promedio_general
                    ? 'border-red-300 focus:ring-red-100'
                    : 'border-slate-200 focus:ring-blue-100'
                }`}
              />
              {errores.promedio_general && (
                <p className="text-xs font-bold text-red-500">{errores.promedio_general}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || !formData.periodo_id || carrerasDisponibles.length === 0}
              className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
            >
              {isSubmitting
                ? <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                : <Save className="w-5 h-5 mr-2" />}
              Guardar métricas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};