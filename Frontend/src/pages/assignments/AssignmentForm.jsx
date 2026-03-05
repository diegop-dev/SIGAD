import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, Plus, Trash2, Clock, CalendarDays, MapPin } from "lucide-react";
import api from "../../services/api";

export const AssignmentForm = ({ onBack, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para los catálogos (Selects)
  const [periodos, setPeriodos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [aulas, setAulas] = useState([]);

  // Estado del formulario
  const [formData, setFormData] = useState({
    id_periodo: "",
    id_docente: "",
    id_materia: "",
    id_grupo: "",
    horarios: [
      { dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "10:00", aula_id: "" }
    ] // Inicia con un bloque por defecto
  });

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        // NOTA: Ajusta estas rutas a tus endpoints reales de consulta
        const [resPeriodos, resDocentes, resMaterias, resGrupos, resAulas] = await Promise.all([
          api.get('/periodos').catch(() => ({ data: [] })),
          api.get('/docentes').catch(() => ({ data: [] })),
          api.get('/materias').catch(() => ({ data: [] })),
          api.get('/grupos').catch(() => ({ data: [] })),
          api.get('/aulas').catch(() => ({ data: [] }))
        ]);

        setPeriodos(resPeriodos.data);
        setDocentes(resDocentes.data);
        setMaterias(resMaterias.data);
        setGrupos(resGrupos.data);
        setAulas(resAulas.data);
      } catch (error) {
        toast.error("Error al cargar los catálogos del sistema.");
      }
    };
    fetchCatalogs();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleHorarioChange = (index, field, value) => {
    const nuevosHorarios = [...formData.horarios];
    nuevosHorarios[index][field] = value;
    setFormData({ ...formData, horarios: nuevosHorarios });
  };

  const addHorarioBlock = () => {
    setFormData({
      ...formData,
      horarios: [...formData.horarios, { dia_semana: "Lunes", hora_inicio: "08:00", hora_fin: "10:00", aula_id: "" }]
    });
  };

  const removeHorarioBlock = (index) => {
    if (formData.horarios.length === 1) {
      return toast.error("Debe haber al menos un bloque de horario.");
    }
    const nuevosHorarios = formData.horarios.filter((_, i) => i !== index);
    setFormData({ ...formData, horarios: nuevosHorarios });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación de que todas las aulas estén seleccionadas en los bloques
    const missingAula = formData.horarios.some(h => !h.aula_id);
    if (missingAula) return toast.error("Debes seleccionar un aula para cada bloque de horario.");

    setIsSubmitting(true);
    const toastId = toast.loading("Guardando asignación y validando cruces...");

    try {
      await api.post("/asignaciones", formData);
      toast.success("Asignación creada exitosamente sin conflictos.", { id: toastId });
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al procesar la asignación.";
      toast.error(errorMsg, { id: toastId, duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Nueva Asignación Docente</h2>
        <button onClick={onBack} className="flex items-center text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Regresar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Datos Generales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Periodo Escolar *</label>
            <select name="id_periodo" required value={formData.id_periodo} onChange={handleChange} className="w-full rounded-xl border-slate-300 py-3 px-4 border shadow-sm focus:ring-2 focus:ring-blue-200">
              <option value="">Seleccione un periodo...</option>
              {periodos.map(p => <option key={p.id_periodo} value={p.id_periodo}>{p.nombre_periodo}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Docente *</label>
            <select name="id_docente" required value={formData.id_docente} onChange={handleChange} className="w-full rounded-xl border-slate-300 py-3 px-4 border shadow-sm focus:ring-2 focus:ring-blue-200">
              <option value="">Seleccione un docente...</option>
              {docentes.map(d => <option key={d.id_docente} value={d.id_docente}>{d.nombres} {d.apellido_paterno}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Materia *</label>
            <select name="id_materia" required value={formData.id_materia} onChange={handleChange} className="w-full rounded-xl border-slate-300 py-3 px-4 border shadow-sm focus:ring-2 focus:ring-blue-200">
              <option value="">Seleccione una materia...</option>
              {materias.map(m => <option key={m.id_materia} value={m.id_materia}>{m.nombre_materia}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Grupo *</label>
            <select name="id_grupo" required value={formData.id_grupo} onChange={handleChange} className="w-full rounded-xl border-slate-300 py-3 px-4 border shadow-sm focus:ring-2 focus:ring-blue-200">
              <option value="">Seleccione un grupo...</option>
              {grupos.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.nombre_grupo}</option>)}
            </select>
          </div>
        </div>

        {/* Bloques de Horarios Dinámicos */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-blue-600" /> Configuración de Horarios
            </h3>
            <button type="button" onClick={addHorarioBlock} className="flex items-center text-sm font-bold bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors">
              <Plus className="w-4 h-4 mr-1" /> Agregar bloque
            </button>
          </div>

          <div className="space-y-4">
            {formData.horarios.map((horario, index) => (
              <div key={index} className="flex items-end gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Día</label>
                    <select value={horario.dia_semana} onChange={(e) => handleHorarioChange(index, "dia_semana", e.target.value)} className="w-full rounded-lg border-slate-300 py-2.5 px-3 border shadow-sm">
                      {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"].map(dia => <option key={dia} value={dia}>{dia}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"><Clock className="w-3 h-3 inline mr-1"/>Inicio</label>
                    <input type="time" required value={horario.hora_inicio} onChange={(e) => handleHorarioChange(index, "hora_inicio", e.target.value)} className="w-full rounded-lg border-slate-300 py-2.5 px-3 border shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"><Clock className="w-3 h-3 inline mr-1"/>Fin</label>
                    <input type="time" required value={horario.hora_fin} onChange={(e) => handleHorarioChange(index, "hora_fin", e.target.value)} className="w-full rounded-lg border-slate-300 py-2.5 px-3 border shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider"><MapPin className="w-3 h-3 inline mr-1"/>Aula</label>
                    <select value={horario.aula_id} required onChange={(e) => handleHorarioChange(index, "aula_id", e.target.value)} className="w-full rounded-lg border-slate-300 py-2.5 px-3 border shadow-sm">
                      <option value="">Seleccione...</option>
                      {aulas.map(a => <option key={a.id_aula} value={a.id_aula}>{a.nombre_aula}</option>)}
                    </select>
                  </div>
                </div>
                <button type="button" onClick={() => removeHorarioBlock(index)} className="p-2.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors shrink-0" title="Eliminar bloque">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button type="submit" disabled={isSubmitting} className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-md transition-all disabled:opacity-50">
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? "Validando y guardando..." : "Guardar Asignación"}
          </button>
        </div>
      </form>
    </div>
  );
};