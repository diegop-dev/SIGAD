import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Plus, Trash2, Clock, CalendarDays, MapPin, User, BookOpen, Users, Loader2, AlertTriangle } from "lucide-react";
import api from "../../services/api";

// Formateador externo para no saturar la memoria del componente
const formatTimeForInput = (timeString) => {
  if (!timeString) return "00:00";
  return timeString.substring(0, 5); 
};

export const AssignmentForm = ({ onBack, onSuccess, initialData = null }) => {
  const isEditing = Boolean(initialData);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  
  const [periodos, setPeriodos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [carreras, setCarreras] = useState([]);

  // 1. Inicializamos el estado del formulario
  const [formData, setFormData] = useState(() => {
    if (isEditing) {
      return {
        periodo_id: initialData.periodo_id,
        grupo_id: initialData.grupo_id,
        docente_id: initialData.docente_id,
        materia_id: initialData.materia_id,
        horarios: initialData.horarios.map(h => ({
          dia_semana: Number(h.dia_semana),
          hora_inicio: formatTimeForInput(h.hora_inicio),
          hora_fin: formatTimeForInput(h.hora_fin),
          aula_id: h.aula_id ? Number(h.aula_id) : ""
        }))
      };
    }
    return {
      periodo_id: "",
      grupo_id: "",
      docente_id: "",
      materia_id: "",
      horarios: [
        { dia_semana: 1, hora_inicio: "08:00", hora_fin: "10:00", aula_id: "" }
      ]
    };
  });

  // 2. Tomamos una "fotografía" estricta de cómo venían los datos originalmente
  const originalHorarios = useMemo(() => {
    if (!isEditing || !initialData) return [];
    return initialData.horarios.map(h => ({
      dia_semana: Number(h.dia_semana),
      hora_inicio: formatTimeForInput(h.hora_inicio),
      hora_fin: formatTimeForInput(h.hora_fin),
      aula_id: h.aula_id ? Number(h.aula_id) : ""
    }));
  }, [initialData, isEditing]);

  // 3. Motor que evalúa si hubo cambios reales bloque por bloque
  const hasChanges = useMemo(() => {
    if (!isEditing) return true; // Si estamos creando, siempre se asume que hay "cambios"
    
    // Si agregaron o quitaron bloques, definitivamente hay cambios
    if (formData.horarios.length !== originalHorarios.length) return true;

    // Evaluamos bloque por bloque para detectar modificaciones mínimas en horas, días o aulas
    for (let i = 0; i < formData.horarios.length; i++) {
      const current = formData.horarios[i];
      const original = originalHorarios[i];

      const currentAula = current.aula_id === "" ? "" : Number(current.aula_id);

      if (
        Number(current.dia_semana) !== original.dia_semana ||
        current.hora_inicio !== original.hora_inicio ||
        current.hora_fin !== original.hora_fin ||
        currentAula !== original.aula_id
      ) {
        return true;
      }
    }
    
    return false; // Si sobrevive al ciclo, los datos son exactamente iguales
  }, [formData.horarios, originalHorarios, isEditing]);


  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [resPeriodos, resDocentes, resMaterias, resGrupos, resAulas, resCarreras] = await Promise.all([
          api.get('/periodos').catch(() => ({ data: [] })),
          api.get('/docentes').catch(() => ({ data: [] })),
          api.get('/materias').catch(() => ({ data: [] })),
          api.get('/grupos').catch(() => ({ data: [] })),
          api.get('/aulas/consultar').catch(() => ({ data: [] })),
          api.get('/carreras').catch(() => ({ data: [] }))
        ]);

        setPeriodos(resPeriodos.data?.data || resPeriodos.data || []);
        setDocentes(resDocentes.data?.data || resDocentes.data || []);
        setMaterias(resMaterias.data?.data || resMaterias.data || []);
        setGrupos(resGrupos.data?.data || resGrupos.data || []);
        setAulas(resAulas.data?.data || resAulas.data || []);
        setCarreras(resCarreras.data?.data || resCarreras.data || []);
      } catch (error) {
        toast.error("Error al cargar los catálogos del sistema.");
      } finally {
        setCargandoCatalogos(false);
      }
    };
    fetchCatalogs();
  }, []);

  const docentesFiltrados = useMemo(() => {
    if (!formData.grupo_id) return [];
    const grupoSeleccionado = grupos.find(g => Number(g.id_grupo) === Number(formData.grupo_id));
    if (!grupoSeleccionado) return [];
    const carreraDelGrupo = carreras.find(c => Number(c.id_carrera) === Number(grupoSeleccionado.carrera_id));
    if (!carreraDelGrupo) return [];
    return docentes.filter(d => Number(d.academia_id) === Number(carreraDelGrupo.academia_id));
  }, [docentes, grupos, carreras, formData.grupo_id]);

  const materiasFiltradas = useMemo(() => {
    if (!formData.grupo_id) return [];
    const grupoSeleccionado = grupos.find(g => Number(g.id_grupo) === Number(formData.grupo_id));
    if (!grupoSeleccionado) return [];
    return materias.filter(m => 
      (Number(m.carrera_id) === Number(grupoSeleccionado.carrera_id) && Number(m.cuatrimestre_id) === Number(grupoSeleccionado.cuatrimestre_id)) || 
      m.tipo_asignatura === 'TRONCO_COMUN'
    );
  }, [materias, grupos, formData.grupo_id]);

  const handleChange = (e) => {
    // Si estamos editando, bloqueamos la modificación de la agrupación principal
    if (isEditing) return;

    const { name, value } = e.target;
    const finalValue = value !== "" ? Number(value) : "";
    
    setFormData(prev => {
      const newData = { ...prev, [name]: finalValue };
      if (name === 'grupo_id') {
        newData.materia_id = "";
        newData.docente_id = "";
      }
      return newData;
    });

    if (errores[name]) setErrores({ ...errores, [name]: null });
  };

  const handleHorarioChange = (index, field, value) => {
    const nuevosHorarios = [...formData.horarios];
    nuevosHorarios[index][field] = (field === 'aula_id' || field === 'dia_semana') && value !== "" ? Number(value) : value;
    setFormData({ ...formData, horarios: nuevosHorarios });
    
    if (errores[`horario_${index}_${field}`]) {
      setErrores({ ...errores, [`horario_${index}_${field}`]: null });
    }
  };

  const addHorarioBlock = () => {
    setFormData({
      ...formData,
      horarios: [...formData.horarios, { dia_semana: 1, hora_inicio: "08:00", hora_fin: "10:00", aula_id: "" }]
    });
  };

  const removeHorarioBlock = (index) => {
    if (formData.horarios.length === 1) {
      return toast.error("Debe haber al menos un bloque de horario asignado.");
    }
    const nuevosHorarios = formData.horarios.filter((_, i) => i !== index);
    setFormData({ ...formData, horarios: nuevosHorarios });
  };

  const validate = () => {
    const newErrors = {};
    const { periodo_id, docente_id, materia_id, grupo_id, horarios } = formData;

    if (!periodo_id) newErrors.periodo_id = "Seleccione un periodo";
    if (!grupo_id) newErrors.grupo_id = "Seleccione un grupo";
    if (!docente_id) newErrors.docente_id = "Seleccione un docente";
    if (!materia_id) newErrors.materia_id = "Seleccione una materia";

    horarios.forEach((h, index) => {
      if (!h.hora_inicio) newErrors[`horario_${index}_hora_inicio`] = "Requerido";
      if (!h.hora_fin) newErrors[`horario_${index}_hora_fin`] = "Requerido";
      if (!h.aula_id) newErrors[`horario_${index}_aula_id`] = "Requerido";
    });

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Doble candado de seguridad: evitamos someter el form si no hay cambios
    if (isEditing && !hasChanges) {
      toast.error("No has realizado ninguna modificación en los horarios.", { icon: 'ℹ️' });
      return;
    }

    if (!validate()) {
      toast.error("Por favor completa todos los campos obligatorios.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Validando empalmes y guardando asignación...");

    try {
      if (isEditing) {
        await api.put("/asignaciones", formData);
        toast.success("Asignación modificada exitosamente sin conflictos.", { id: toastId });
      } else {
        await api.post("/asignaciones", formData);
        toast.success("Asignación creada exitosamente sin conflictos.", { id: toastId });
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      if (error.response?.data?.errores) {
        const backendErrors = {};
        error.response.data.errores.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrores(backendErrors);
        toast.error("Corrige los errores señalados en el formulario", { id: toastId });
      } else {
        const errorMsg = error.response?.data?.error || `Error al procesar la asignación.`;
        toast.error(errorMsg, { id: toastId, duration: 5000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditing ? "Modificar asignación docente" : "Nueva asignación docente"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {isEditing ? "Actualiza los espacios y horarios de esta clase." : "Vincula a un docente con una materia, grupo y define sus espacios físicos."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <CalendarDays className="w-4 h-4 mr-2 text-blue-500" /> Periodo escolar
              </label>
              <select 
                name="periodo_id" 
                value={formData.periodo_id} 
                onChange={handleChange} 
                disabled={cargandoCatalogos || isEditing}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.periodo_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                } disabled:bg-slate-100 disabled:text-slate-500`}
              >
                <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione el periodo --"}</option>
                {periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.codigo}</option>)}
              </select>
              {errores.periodo_id && <p className="text-xs font-bold text-red-500">{errores.periodo_id}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Users className="w-4 h-4 mr-2 text-blue-500" /> Grupo asignado
              </label>
              <select 
                name="grupo_id" 
                value={formData.grupo_id} 
                onChange={handleChange} 
                disabled={cargandoCatalogos || isEditing}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.grupo_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                } disabled:bg-slate-100 disabled:text-slate-500`}
              >
                <option value="">{cargandoCatalogos ? "Cargando..." : "-- Seleccione el grupo --"}</option>
                {grupos.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.identificador}</option>)}
              </select>
              {errores.grupo_id && <p className="text-xs font-bold text-red-500">{errores.grupo_id}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <User className="w-4 h-4 mr-2 text-blue-500" /> Docente titular
              </label>
              <select 
                name="docente_id" 
                value={formData.docente_id} 
                onChange={handleChange} 
                disabled={cargandoCatalogos || !formData.grupo_id || isEditing}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.docente_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                } disabled:bg-slate-100 disabled:text-slate-500`}
              >
                <option value="">
                  {cargandoCatalogos 
                    ? "Cargando..." 
                    : !formData.grupo_id 
                      ? "Seleccione un grupo primero" 
                      : "-- Seleccione el docente --"}
                </option>
                {docentesFiltrados.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellido_paterno}</option>)}
              </select>
              {errores.docente_id && <p className="text-xs font-bold text-red-500">{errores.docente_id}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Asignatura
              </label>
              <select 
                name="materia_id" 
                value={formData.materia_id} 
                onChange={handleChange} 
                disabled={cargandoCatalogos || !formData.grupo_id || isEditing}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.materia_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                } disabled:bg-slate-100 disabled:text-slate-500`}
              >
                <option value="">
                  {cargandoCatalogos 
                    ? "Cargando..." 
                    : !formData.grupo_id 
                      ? "Seleccione un grupo primero" 
                      : "-- Seleccione la materia --"}
                </option>
                {materiasFiltradas.map(m => <option key={m.id_materia} value={m.id_materia}>{m.nombre}</option>)}
              </select>
              {errores.materia_id && <p className="text-xs font-bold text-red-500">{errores.materia_id}</p>}
            </div>
          </div>

          {isEditing && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-medium flex items-start">
              <AlertTriangle className="w-5 h-5 mr-3 shrink-0 text-amber-600 mt-0.5" />
              <p>Estás en modo de edición. Para mantener la integridad de la base de datos, no puedes alterar la agrupación principal. Únicamente puedes agregar, modificar o eliminar los bloques de horarios.</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-600" /> Configuración de horarios
                </h3>
                <p className="text-sm text-slate-500 mt-1">Agrega o modifica los días y horas exactas para esta clase.</p>
              </div>
              <button 
                type="button" 
                onClick={addHorarioBlock} 
                className="flex items-center text-sm font-bold bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" /> Añadir bloque
              </button>
            </div>

            <div className="space-y-4">
              {formData.horarios.map((horario, index) => (
                <div key={index} className="flex items-start md:items-end gap-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl relative group flex-col md:flex-row shadow-sm">
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Día</label>
                      <select 
                        value={horario.dia_semana} 
                        onChange={(e) => handleHorarioChange(index, "dia_semana", e.target.value)} 
                        className="w-full rounded-xl border-slate-300 py-2.5 px-3 border shadow-sm focus:ring-2 focus:ring-blue-100 transition-all bg-white text-sm"
                      >
                        <option value={1}>Lunes</option>
                        <option value={2}>Martes</option>
                        <option value={3}>Miércoles</option>
                        <option value={4}>Jueves</option>
                        <option value={5}>Viernes</option>
                        <option value={6}>Sábado</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider"><Clock className="w-3 h-3 inline mr-1"/>Inicio</label>
                      <input 
                        type="time" 
                        value={horario.hora_inicio} 
                        onChange={(e) => handleHorarioChange(index, "hora_inicio", e.target.value)} 
                        className={`w-full rounded-xl py-2.5 px-3 border shadow-sm transition-all text-sm ${
                          errores[`horario_${index}_hora_inicio`] ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                        }`} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider"><Clock className="w-3 h-3 inline mr-1"/>Fin</label>
                      <input 
                        type="time" 
                        value={horario.hora_fin} 
                        onChange={(e) => handleHorarioChange(index, "hora_fin", e.target.value)} 
                        className={`w-full rounded-xl py-2.5 px-3 border shadow-sm transition-all text-sm ${
                          errores[`horario_${index}_hora_fin`] ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                        }`} 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider"><MapPin className="w-3 h-3 inline mr-1"/>Aula</label>
                      <select 
                        value={horario.aula_id} 
                        onChange={(e) => handleHorarioChange(index, "aula_id", e.target.value)} 
                        className={`w-full rounded-xl py-2.5 px-3 border shadow-sm transition-all bg-white text-sm ${
                          errores[`horario_${index}_aula_id`] ? "border-red-300 focus:ring-red-100" : "border-slate-300 focus:ring-blue-100"
                        }`}
                      >
                        <option value="">Seleccione...</option>
                        {aulas.map(a => <option key={a.id_aula} value={a.id_aula}>{a.nombre_codigo}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => removeHorarioBlock(index)} 
                    className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0 md:mb-0.5" 
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              // Bloqueamos el botón si no hay modificaciones reales en los datos
              disabled={isSubmitting || cargandoCatalogos || (isEditing && !hasChanges)} 
              className={`flex items-center px-8 py-3 rounded-xl font-bold shadow-md transition-all ${
                isEditing && !hasChanges 
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" 
                  : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              }`}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {isSubmitting 
                ? "Validando empalmes..." 
                : isEditing 
                  ? (!hasChanges ? "Sin cambios para guardar" : "Actualizar cambios") 
                  : "Guardar asignación"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};