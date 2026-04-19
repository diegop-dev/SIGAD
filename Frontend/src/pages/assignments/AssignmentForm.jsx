import { useState, useEffect, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { 
  Save, ArrowLeft, Plus, Trash2, Clock, CalendarDays, 
  User, BookOpen, Users, Loader2, AlertTriangle, 
  GraduationCap, ShieldCheck, ChevronRight, X, Check, CheckCircle2, Search,
  ChevronDown
} from "lucide-react";
import api from "../../services/api";

// Helpers
const formatTimeForInput = (timeString) => {
  if (!timeString) return "00:00";
  return timeString.substring(0, 5);
};

// Generador de bloques por hora (07:00 a 22:00)
const generateTimeSlots = () => {
  const slots = [];
  for (let h = 7; h <= 22; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();

// Badges de nivel_academico
const NivelBadge = ({ nivel }) => {
  const map = {
    LICENCIATURA: "bg-blue-100 text-blue-800",
    MAESTRIA:     "bg-amber-100 text-amber-800",
    DOCTORADO:    "bg-purple-100 text-purple-800",
  };
  const cls = map[(nivel || "").toUpperCase()] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase rounded-md w-fit shrink-0 ${cls}`}>
      {nivel || "N/A"}
    </span>
  );
};

// Badges de tipo_asignatura
const TipoBadge = ({ tipo }) => {
  const raw = (tipo || "").toUpperCase();
  const map = {
    OBLIGATORIA:  "bg-green-100 text-green-800",
    TRONCO_COMUN: "bg-white text-slate-600 border border-slate-300",
    OPTATIVA:     "bg-purple-100 text-purple-800",
  };
  const cls = map[raw] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase rounded-md w-fit shrink-0 ${cls}`}>
      {tipo.replace(/_/g, " ") || "N/A"}
    </span>
  );
};

// Modal Wrapper
const ModalWrapper = ({ title, icon: Icon, onClose, children, showSearch = true, onSearch, searchValue }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 animate-in fade-in">
    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
      {/* Header Navy */}
      <div className="px-6 py-5 flex justify-between items-center bg-[#0B1828] shrink-0">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          {Icon && <Icon className="w-6 h-6 text-white" />} {title}
        </h3>
        <button
          onClick={onClose}
          className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      {showSearch && (
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 focus:ring-1 focus:ring-[#0B1828] focus:border-[#0B1828] text-sm font-medium text-[#0B1828] transition-all placeholder:text-slate-400 shadow-sm"
              autoFocus
            />
          </div>
        </div>
      )}
      <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/30">
        {children}
      </div>
    </div>
  </div>
);

export const AssignmentForm = ({ onBack, onSuccess, initialData = null }) => {
  const isEditing = Boolean(initialData);

  const [isSubmitting, setIsSubmitting]                       = useState(false);
  const [isValidating, setIsValidating]                       = useState(false);
  const [hasVerifiedSuccessfully, setHasVerifiedSuccessfully] = useState(false);
  const [errores, setErrores]                                 = useState({});
  const [cargandoCatalogos, setCargandoCatalogos]             = useState(true);
  const [activeModal, setActiveModal]                         = useState(null);
  const [timeModalConfig, setTimeModalConfig]                 = useState(null);
  const [searchTerm, setSearchTerm]                           = useState("");
  const [isTroncoComunFlow, setIsTroncoComunFlow]             = useState(false);

  const [docentes, setDocentes] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [grupos,   setGrupos]   = useState([]);
  const [aulas,    setAulas]    = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [materiasAsignadasIds, setMateriasAsignadasIds] = useState(new Set());

  const [formData, setFormData] = useState(() => {
    if (isEditing) {
      return {
        periodo_id: initialData.periodo_id,
        carrera_id: "",
        grupo_id:   initialData.grupo_id || "",
        materia_id: initialData.materia_id,
        docente_id: initialData.docente_id,
        horarios: initialData.horarios.map(h => ({
          dia_semana:  Number(h.dia_semana),
          hora_inicio: formatTimeForInput(h.hora_inicio),
          hora_fin:    formatTimeForInput(h.hora_fin),
          aula_id:     h.aula_id ? Number(h.aula_id) : "",
        })),
      };
    }
    return {
      periodo_id: "", // Se asignará automáticamente en el fetchCatalogs
      carrera_id: "",
      grupo_id:   "",
      materia_id: "",
      docente_id: "",
      horarios: [{ dia_semana: 1, hora_inicio: "08:00", hora_fin: "10:00", aula_id: "" }],
    };
  });

  useEffect(() => {
    setHasVerifiedSuccessfully(false);
    setErrores({});
  }, [formData]);

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const [
          resPeriodos,
          resDocentes,
          resMaterias,
          resGrupos,
          resAulas,
          resCarreras,
        ] = await Promise.all([
          api.get("/periodos").catch(() => ({ data: [] })),
          api.get("/docentes").catch(() => ({ data: [] })),
          api.get("/materias").catch(() => ({ data: [] })),
          api.get("/grupos").catch(() => ({ data: [] })),
          api.get("/aulas/consultar").catch(() => ({ data: [] })),
          api.get("/carreras").catch(() => ({ data: [] })),
        ]);

        // Determinar e inyectar el periodo vigente silenciosamente.
        // Criterio: mismo que el backend (resolverPeriodoActual) — busca el periodo
        // cuya fecha_inicio..fecha_fin contenga hoy, sin importar el campo estatus.
        // Si hay solapamiento, gana el de mayor id_periodo. Así un periodo INACTIVO
        // recién creado con ID mayor no desplaza al periodo real en curso.
        const loadedPeriodos = resPeriodos.data?.data || resPeriodos.data || [];
        let periodoVigenteId = isEditing ? initialData?.periodo_id : null;

        if (!isEditing) {
          if (loadedPeriodos.length > 0) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            const candidatos = loadedPeriodos.filter((p) => {
              const inicio = new Date(p.fecha_inicio);
              const fin = new Date(p.fecha_fin);
              inicio.setHours(0, 0, 0, 0);
              fin.setHours(23, 59, 59, 999);
              return inicio <= hoy && fin >= hoy;
            });

            // Si ningún periodo cubre hoy (caso extremo), cae al de mayor ID
            const periodoVigente =
              candidatos.length > 0
                ? candidatos.sort((a, b) => b.id_periodo - a.id_periodo)[0]
                : loadedPeriodos.sort((a, b) => b.id_periodo - a.id_periodo)[0];

            periodoVigenteId = periodoVigente.id_periodo;
            setFormData((prev) => ({
              ...prev,
              periodo_id: periodoVigenteId,
            }));
          } else {
            toast.error("Atención: No hay periodos registrados en el sistema.");
          }
        }

        // Cargar materias ya vinculadas a una asignación activa para excluirlas del selector
        if (periodoVigenteId) {
          const resAsig = await api.get(`/asignaciones?periodo_id=${periodoVigenteId}`).catch(() => ({ data: { data: [] } }));
          const asigs = resAsig.data?.data || [];
          // Solo bloquean la materia: asignaciones activas (ABIERTA) o cerradas con promedio.
          // Las canceladas (CERRADA sin promedio) liberan la materia para reasignación.
          const asigsBloqueantes = asigs.filter(a =>
            a.estatus_acta === 'ABIERTA' ||
            (a.estatus_acta === 'CERRADA' && a.promedio_consolidado !== null && a.promedio_consolidado !== undefined)
          );
          setMateriasAsignadasIds(new Set(asigsBloqueantes.map(a => Number(a.materia_id))));
        }

        setDocentes(resDocentes.data?.data || resDocentes.data || []);
        const loadedMaterias = resMaterias.data?.data || resMaterias.data || [];
        setMaterias(loadedMaterias);
        const loadedGrupos = resGrupos.data?.data || resGrupos.data || [];
        setGrupos(loadedGrupos);
        setAulas(resAulas.data?.data || resAulas.data || []);
        setCarreras(resCarreras.data?.data || resCarreras.data || []);

        if (isEditing && initialData?.materia_id) {
          const mat = loadedMaterias.find(
            (m) => Number(m.id_materia) === Number(initialData.materia_id),
          );
          if (mat && mat.tipo_asignatura === "TRONCO_COMUN") {
            setIsTroncoComunFlow(true);
          } else if (initialData?.grupo_id) {
            const g = loadedGrupos.find(
              (x) => Number(x.id_grupo) === Number(initialData.grupo_id),
            );
            if (g) setFormData((p) => ({ ...p, carrera_id: g.carrera_id }));
          }
        }
      } catch {
        toast.error("Error al cargar los catálogos del sistema.");
      } finally {
        setCargandoCatalogos(false);
      }
    };
    fetchCatalogs();
  }, [isEditing, initialData]);

  // Filtros bases en selecciones previas
  const carreraSeleccionada = useMemo(() =>
    carreras.find(c => Number(c.id_carrera) === Number(formData.carrera_id)),
  [carreras, formData.carrera_id]);

  const gruposFiltrados = useMemo(() => {
    if (!formData.carrera_id) return [];
    return grupos.filter(g => Number(g.carrera_id) === Number(formData.carrera_id));
  }, [grupos, formData.carrera_id]);

  const grupoSeleccionado = useMemo(() =>
    grupos.find(g => Number(g.id_grupo) === Number(formData.grupo_id)),
  [grupos, formData.grupo_id]);

  const materiasFiltradas = useMemo(() => {
    const estaAsignada = (id) =>
      materiasAsignadasIds.has(Number(id)) && Number(id) !== Number(formData.materia_id);
    if (isTroncoComunFlow) return materias.filter(m =>
      m.tipo_asignatura === 'TRONCO_COMUN' && !estaAsignada(m.id_materia)
    );
    if (!formData.carrera_id || !grupoSeleccionado) return [];
    return materias.filter(m =>
      Number(m.carrera_id) === Number(formData.carrera_id) &&
      m.tipo_asignatura !== 'TRONCO_COMUN' &&
      Number(m.cuatrimestre_id) === Number(grupoSeleccionado.cuatrimestre_id) &&
      !estaAsignada(m.id_materia)
    );
  }, [materias, isTroncoComunFlow, formData.carrera_id, formData.materia_id, grupoSeleccionado, materiasAsignadasIds]);

  const materiaSeleccionada = useMemo(() =>
    materias.find(m => Number(m.id_materia) === Number(formData.materia_id)),
  [materias, formData.materia_id]);

  const docentesFiltrados = useMemo(() => {
    if (!formData.materia_id) return [];
    return docentes.filter(d => {
      if (!isTroncoComunFlow && carreraSeleccionada) {
        if (Number(d.academia_id) !== Number(carreraSeleccionada.academia_id)) return false;
      }
      const nivelReq = grupoSeleccionado?.nivel_academico?.toUpperCase() || materiaSeleccionada?.nivel_academico?.toUpperCase();
      if (nivelReq === 'MAESTRIA' && (d.nivel_academico?.toUpperCase() === 'LICENCIATURA' || !d.nivel_academico)) return false;
      return true;
    });
  }, [docentes, isTroncoComunFlow, carreraSeleccionada, formData.materia_id, grupoSeleccionado, materiaSeleccionada]);

  const docenteSeleccionado = useMemo(() => 
    docentes.find(d => Number(d.id_docente) === Number(formData.docente_id)), 
  [docentes, formData.docente_id]);

  // Filtros en base al término de búsqueda
  const searchLower = searchTerm.toLowerCase().trim();
  const searchedCarreras = useMemo(() => carreras.filter(c => c.nombre_carrera?.toLowerCase().includes(searchLower)), [carreras, searchLower]);
  const searchedGrupos   = useMemo(() => gruposFiltrados.filter(g => g.identificador?.toLowerCase().includes(searchLower)), [gruposFiltrados, searchLower]);
  const searchedMaterias = useMemo(() => materiasFiltradas.filter(m => m.nombre?.toLowerCase().includes(searchLower) || m.codigo_unico?.toLowerCase().includes(searchLower)), [materiasFiltradas, searchLower]);
  const searchedDocentes = useMemo(() => docentesFiltrados.filter(d => d.nombres?.toLowerCase().includes(searchLower) || d.apellido_paterno?.toLowerCase().includes(searchLower) || d.apellido_materno?.toLowerCase().includes(searchLower)), [docentesFiltrados, searchLower]);

  // Manejadores de selección
  const openModal  = (type) => { setSearchTerm(""); setActiveModal(type); };
  const closeModal = ()     => { setSearchTerm(""); setActiveModal(null); };

  const handleSelectCarrera = useCallback((id_carrera) => {
    if (isEditing) return;
    setFormData(prev => ({ ...prev, carrera_id: id_carrera, grupo_id: "", materia_id: "", docente_id: "" }));
    setIsTroncoComunFlow(false);
    closeModal();
  }, [isEditing]);

  const handleConfirmTroncoComun = useCallback(() => {
    if (isEditing) return;
    setFormData(prev => ({ ...prev, carrera_id: "", grupo_id: "", materia_id: "", docente_id: "" }));
    closeModal();
  }, [isEditing]);

  const handleSelect = useCallback((field, value) => {
    if (isEditing) return;
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'grupo_id')   { newData.materia_id = ""; newData.docente_id = ""; }
      if (field === 'materia_id') { newData.docente_id = ""; }
      return newData;
    });
    closeModal();
  }, [isEditing]);

  const handleHorarioChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const nuevosHorarios = [...prev.horarios];
      nuevosHorarios[index][field] = (field === 'aula_id' || field === 'dia_semana') && value !== "" ? Number(value) : value;
      return { ...prev, horarios: nuevosHorarios };
    });
  }, []);

  const addHorarioBlock = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      horarios: [...prev.horarios, { dia_semana: 1, hora_inicio: "08:00", hora_fin: "10:00", aula_id: "" }],
    }));
  }, []);

  const removeHorarioBlock = useCallback((index) => {
    if (formData.horarios.length === 1) return toast.error("Debe haber al menos un bloque de horario.");
    setFormData(prev => ({ ...prev, horarios: prev.horarios.filter((_, i) => i !== index) }));
  }, [formData.horarios.length]);

  const originalHorarios = useMemo(() => {
    if (!isEditing || !initialData) return [];
    return initialData.horarios.map(h => ({
      dia_semana:  Number(h.dia_semana),
      hora_inicio: formatTimeForInput(h.hora_inicio),
      hora_fin:    formatTimeForInput(h.hora_fin),
      aula_id:     h.aula_id ? Number(h.aula_id) : "",
    }));
  }, [initialData, isEditing]);

  const hasChanges = useMemo(() => {
    if (!isEditing) return true;
    if (formData.horarios.length !== originalHorarios.length) return true;
    for (let i = 0; i < formData.horarios.length; i++) {
      const cur = formData.horarios[i];
      const ori = originalHorarios[i];
      const curAula = cur.aula_id === "" ? "" : Number(cur.aula_id);
      if (Number(cur.dia_semana) !== ori.dia_semana || cur.hora_inicio !== ori.hora_inicio || cur.hora_fin !== ori.hora_fin || curAula !== ori.aula_id) return true;
    }
    return false;
  }, [formData.horarios, originalHorarios, isEditing]);

  // Validaciones antes de enviar a backend
  const validateBasics = () => {
    const newErrors = {};
    if (!formData.periodo_id) {
      toast.error("Error: No se ha detectado un periodo académico activo en el sistema.");
      return false;
    }
    if (!isTroncoComunFlow && !formData.carrera_id) newErrors.carrera_id = "Selecciona la carrera.";
    if (!isTroncoComunFlow && !formData.grupo_id)   newErrors.grupo_id   = "Selecciona el grupo.";
    if (!formData.materia_id) newErrors.materia_id = "Selecciona la materia.";
    if (!formData.docente_id) newErrors.docente_id = "Selecciona al docente titular.";
    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validarBorrador = async () => {
    if (!validateBasics()) return toast.error("Completa todos los pasos de selección antes de verificar.", { icon: '⚠️' });
    setIsValidating(true);
    const toastId = toast.loading("Verificando disponibilidad en base de datos...");
    try {
      await api.post("/asignaciones/validar-borrador", { ...formData, es_edicion: isEditing });
      setHasVerifiedSuccessfully(true);
      toast.success("¡Horario disponible! Ya puedes guardar la asignación.", { id: toastId });
    } catch (error) {
      setHasVerifiedSuccessfully(false);
      toast.error(error.response?.data?.error || "Se detectaron conflictos en los horarios.", { id: toastId, duration: 5000 });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing && !hasChanges) return toast.error("No has modificado los horarios.", { icon: 'ℹ️' });
    if (!hasVerifiedSuccessfully) return toast.error("Debes verificar los empalmes exitosamente antes de guardar.");
    setIsSubmitting(true);
    const toastId = toast.loading("Guardando asignación...");
    try {
      if (isEditing) {
        await api.put("/asignaciones", formData);
        toast.success("Asignación modificada exitosamente.", { id: toastId });
      } else {
        await api.post("/asignaciones", formData);
        toast.success("Asignación creada exitosamente.", { id: toastId });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || "Ocurrió un error al intentar guardar.", { id: toastId, duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stepper y bloqueo de pasos
  const step1Unblocked   = true; // Carrera siempre disponible
  const step2Unblocked   = !!formData.carrera_id || isTroncoComunFlow; // Grupo
  const step3Unblocked   = isTroncoComunFlow ? step2Unblocked : (step2Unblocked && !!formData.grupo_id); // Materia
  const step4Unblocked   = step3Unblocked && !!formData.materia_id; // Docente
  const allStepsCompleted = step4Unblocked && !!formData.docente_id; // Horarios

  const StepIndicator = ({ isActive, isCompleted, num }) => {
    if (isCompleted)
      return (
        <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-green-500 border-4 border-white flex items-center justify-center text-white shadow-sm z-10 transition-colors duration-300">
          <Check className="w-4 h-4" />
        </div>
      );
    if (isActive)
      return (
        <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-[#0B1828] border-4 border-white flex items-center justify-center text-white font-bold shadow-sm z-10 transition-colors duration-300">
          <span className="text-sm">{num}</span>
        </div>
      );
    return (
      <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-slate-400 font-bold z-10 transition-colors duration-300">
        <span className="text-sm">{num}</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">

      {/* Header Navy */}
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10">
        <button
          onClick={onBack}
          className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white">
            {isEditing ? "Modificar asignación" : "Nueva asignación"}
          </h2>
          <p className="text-sm text-white/60 font-medium">
            {isEditing ? "Edición de bloques de horario." : "Completa la configuración en orden."}
          </p>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">

          {/* Embudo de pasos */}
          <div className="relative border-l border-slate-200 ml-4 md:ml-6 space-y-10 pb-8 mt-2">

            {/* Paso 1: Carrera (Oculto en Tronco Común) */}
            <div className={`relative pl-8 md:pl-10 transition-all duration-300 ${step1Unblocked ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <StepIndicator isActive={step1Unblocked} isCompleted={!!(formData.carrera_id || isTroncoComunFlow)} num={1} />
              <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                <GraduationCap className="w-4 h-4 mr-2" /> Carrera
              </label>
              <button
                type="button"
                onClick={() => !isEditing && openModal('carrera')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl shadow-md text-left transition-all active:scale-[0.99] border ${errores.carrera_id ? 'border-red-400 bg-red-50' : 'border-slate-100'} ${isEditing ? 'bg-slate-50 cursor-not-allowed shadow-none' : 'bg-white hover:shadow-lg hover:border-[#0B1828]/30'}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold ${(formData.carrera_id || isTroncoComunFlow) ? 'text-[#0B1828]' : 'text-slate-400'}`}>
                    {isTroncoComunFlow
                      ? "Tronco Común"
                      : carreraSeleccionada
                        ? carreraSeleccionada.nombre_carrera
                        : "Seleccionar Carrera..."}
                  </span>
                  {carreraSeleccionada && !isTroncoComunFlow && (
                    <NivelBadge nivel={carreraSeleccionada.nivel_academico} />
                  )}
                </div>
                {!isEditing && <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />}
              </button>
              {errores.carrera_id && <p className="text-red-500 text-xs mt-2 font-medium">{errores.carrera_id}</p>}
            </div>

            {/* Paso 2: Grupo (Oculto en Tronco Común) */}
            {!isTroncoComunFlow && (
              <div className={`relative pl-8 md:pl-10 transition-all duration-300 ${step2Unblocked ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                <StepIndicator isActive={step2Unblocked} isCompleted={!!formData.grupo_id} num={2} />
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Users className="w-4 h-4 mr-2" /> Grupo
                </label>
                <button
                  type="button"
                  onClick={() => !isEditing && openModal('grupo')}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl shadow-md text-left transition-all active:scale-[0.99] border ${errores.grupo_id ? 'border-red-400 bg-red-50' : 'border-slate-100'} ${isEditing ? 'bg-slate-50 cursor-not-allowed shadow-none' : 'bg-white hover:shadow-lg hover:border-[#0B1828]/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${formData.grupo_id ? 'text-[#0B1828]' : 'text-slate-400'}`}>
                      {grupoSeleccionado ? grupoSeleccionado.identificador : "Seleccionar Grupo..."}
                    </span>
                    {grupoSeleccionado && <NivelBadge nivel={grupoSeleccionado.nivel_academico} />}
                  </div>
                  {!isEditing && <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />}
                </button>
                {errores.grupo_id && <p className="text-red-500 text-xs mt-2 font-medium">{errores.grupo_id}</p>}
              </div>
            )}

            {/* Paso 3: Materia */}
            <div className={`relative pl-8 md:pl-10 transition-all duration-300 ${step3Unblocked ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <StepIndicator isActive={step3Unblocked} isCompleted={!!formData.materia_id} num={isTroncoComunFlow ? 2 : 3} />
              <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                <BookOpen className="w-4 h-4 mr-2" /> Materia
              </label>
              <button
                type="button"
                onClick={() => !isEditing && openModal('materia')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl shadow-md text-left transition-all active:scale-[0.99] border ${errores.materia_id ? 'border-red-400 bg-red-50' : 'border-slate-100'} ${isEditing ? 'bg-slate-50 cursor-not-allowed shadow-none' : 'bg-white hover:shadow-lg hover:border-[#0B1828]/30'}`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm font-bold ${formData.materia_id ? 'text-[#0B1828]' : 'text-slate-400'}`}>
                    {materiaSeleccionada
                      ? `${materiaSeleccionada.nombre} (${materiaSeleccionada.codigo_unico})`
                      : "Seleccionar Materia..."}
                  </span>
                  {materiaSeleccionada && (
                    <div className="flex gap-2">
                      <TipoBadge tipo={materiaSeleccionada.tipo_asignatura} />
                      <NivelBadge nivel={materiaSeleccionada.nivel_academico} />
                    </div>
                  )}
                </div>
                {!isEditing && <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />}
              </button>
              {errores.materia_id && <p className="text-red-500 text-xs mt-2 font-medium">{errores.materia_id}</p>}
            </div>

            {/* Paso 4: Docente */}
            <div className={`relative pl-8 md:pl-10 transition-all duration-300 ${step4Unblocked ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
              <StepIndicator isActive={step4Unblocked} isCompleted={!!formData.docente_id} num={isTroncoComunFlow ? 3 : 4} />
              <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                <User className="w-4 h-4 mr-2" /> Docente
              </label>
              <button
                type="button"
                onClick={() => !isEditing && openModal('docente')}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl shadow-md text-left transition-all active:scale-[0.99] border ${errores.docente_id ? 'border-red-400 bg-red-50' : 'border-slate-100'} ${isEditing ? 'bg-slate-50 cursor-not-allowed shadow-none' : 'bg-white hover:shadow-lg hover:border-[#0B1828]/30'}`}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-sm font-bold ${formData.docente_id ? 'text-[#0B1828]' : 'text-slate-400'}`}>
                    {docenteSeleccionado
                      ? `${docenteSeleccionado.nombres} ${docenteSeleccionado.apellido_paterno} ${docenteSeleccionado.apellido_materno || ''}`
                      : "Seleccionar Docente..."}
                  </span>
                  {docenteSeleccionado && <NivelBadge nivel={docenteSeleccionado.nivel_academico} />}
                </div>
                {!isEditing && <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />}
              </button>
              {errores.docente_id && <p className="text-red-500 text-xs mt-2 font-medium">{errores.docente_id}</p>}
            </div>

          </div>

          {/* Paso final: Horarios y Guardado */}
          {allStepsCompleted && (
            <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 border-t border-dashed border-slate-200 mt-2">

              {isEditing && (
                <div className="bg-orange-50 border border-orange-200 text-[#0B1828] p-5 rounded-2xl text-sm font-medium flex items-start mb-8 shadow-sm">
                  <AlertTriangle className="w-5 h-5 mr-3 shrink-0 text-orange-500 mt-0.5" />
                  <p>Estás en modo de edición. Solo puedes modificar los bloques de horarios físicos para mantener la integridad de las actas y calificaciones.</p>
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4 bg-white shadow-sm p-5 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="text-base font-black text-[#0B1828] flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-[#0B1828]" /> Configurar Horarios
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Límites permitidos: 07:00 AM a 10:00 PM</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={validarBorrador}
                    disabled={isValidating || hasVerifiedSuccessfully}
                    className={`flex-1 md:flex-none flex items-center justify-center text-sm font-bold px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 shadow-sm ${
                      hasVerifiedSuccessfully
                        ? "bg-green-100 text-green-700 cursor-default"
                        : "bg-green-600 text-white hover:bg-green-700 hover:shadow-md"
                    }`}
                  >
                    {isValidating
                      ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      : hasVerifiedSuccessfully
                        ? <CheckCircle2 className="w-4 h-4 mr-1" />
                        : <ShieldCheck className="w-4 h-4 mr-1" />}
                    {hasVerifiedSuccessfully ? "Horario Verificado" : "Verificar Empalmes"}
                  </button>
                  <button
                    type="button"
                    onClick={addHorarioBlock}
                    className="flex-1 md:flex-none flex items-center justify-center text-sm font-bold bg-[#0B1828] text-white px-5 py-3 rounded-xl hover:bg-[#162840] transition-all active:scale-95 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Añadir
                  </button>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                {formData.horarios.map((horario, index) => (
                  <div key={index} className="flex flex-col md:flex-row items-start md:items-end gap-3 p-5 bg-white border border-slate-100 rounded-2xl shadow-md relative group hover:shadow-lg transition-all">
                    <div className="absolute -left-3 -top-3 w-7 h-7 bg-[#0B1828] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-[#0B1828]/60 mb-1.5 uppercase tracking-wider">Día</label>
                        <select
                          value={horario.dia_semana}
                          onChange={(e) => handleHorarioChange(index, "dia_semana", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 px-4 focus:bg-white focus:ring-1 focus:ring-[#0B1828] focus:border-[#0B1828] text-sm font-bold text-[#0B1828] transition-all"
                        >
                          <option value={1}>Lunes</option>
                          <option value={2}>Martes</option>
                          <option value={3}>Miércoles</option>
                          <option value={4}>Jueves</option>
                          <option value={5}>Viernes</option>
                          <option value={6}>Sábado</option>
                        </select>
                      </div>
                      
                      {/* Selección de hora inicio modal */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#0B1828]/60 mb-1.5 uppercase tracking-wider">Inicio</label>
                        <button
                          type="button"
                          onClick={() => setTimeModalConfig({ index, field: 'hora_inicio' })}
                          className="w-full flex justify-between items-center rounded-xl py-3.5 px-4 bg-slate-50 border border-slate-200 hover:bg-white hover:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm font-bold text-[#0B1828] transition-all"
                        >
                          {horario.hora_inicio || "--:--"}
                          <Clock className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                      
                      {/* Selección de hora fin modal */}
                      <div>
                        <label className="block text-[11px] font-bold text-[#0B1828]/60 mb-1.5 uppercase tracking-wider">Fin</label>
                        <button
                          type="button"
                          onClick={() => setTimeModalConfig({ index, field: 'hora_fin' })}
                          className="w-full flex justify-between items-center rounded-xl py-3.5 px-4 bg-slate-50 border border-slate-200 hover:bg-white hover:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] text-sm font-bold text-[#0B1828] transition-all"
                        >
                          {horario.hora_fin || "--:--"}
                          <Clock className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#0B1828]/60 mb-1.5 uppercase tracking-wider">Aula Física</label>
                        <select
                          value={horario.aula_id}
                          onChange={(e) => handleHorarioChange(index, "aula_id", e.target.value)}
                          className="w-full rounded-xl py-3.5 px-4 bg-slate-50 focus:bg-white border border-slate-200 focus:ring-1 focus:ring-[#0B1828] focus:border-[#0B1828] text-sm font-bold text-[#0B1828] transition-all"
                        >
                          <option value="">Seleccionar...</option>
                          {aulas.map(a => <option key={a.id_aula} value={a.id_aula}>{a.nombre_codigo}</option>)}
                        </select>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHorarioBlock(index)}
                      className="p-3.5 text-slate-400 hover:text-white hover:bg-red-500 rounded-xl transition-all active:scale-95 shrink-0 shadow-sm"
                      title="Eliminar bloque"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || (isEditing && !hasChanges) || !hasVerifiedSuccessfully}
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg ${
                  !hasVerifiedSuccessfully
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300"
                    : isEditing && !hasChanges
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
                }`}
              >
                {isSubmitting
                  ? <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  : <Save className="w-6 h-6 mr-2 text-white" />}
                {!hasVerifiedSuccessfully
                  ? "Verifica los empalmes para continuar"
                  : isSubmitting
                    ? "Guardando cambios..."
                    : isEditing ? "Modificar Asignación" : "Nueva Asignación"}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Modales */}
      {/* Carrera */}
      {activeModal === 'carrera' && (
        <ModalWrapper title="Seleccionar Carrera" icon={GraduationCap} onClose={closeModal} searchValue={searchTerm} onSearch={setSearchTerm}>
          <label className="flex items-center justify-between p-5 bg-white shadow-sm rounded-2xl cursor-pointer transition-all active:scale-[0.99] border border-slate-100 hover:border-[#0B1828]/20 hover:shadow-md mb-2">
            <div>
              <p className="text-base font-bold text-[#0B1828]">Materia de Tronco Común</p>
              <p className="text-xs text-slate-500 mt-1">Activa para omitir carrera y grupo.</p>
            </div>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isTroncoComunFlow}
                onChange={(e) => setIsTroncoComunFlow(e.target.checked)}
              />
              <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500" />
            </div>
          </label>

          {isTroncoComunFlow ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-[#0B1828]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-[#0B1828]" />
              </div>
              <p className="text-sm font-medium text-slate-500 mb-6 px-8">El sistema configurará esta asignación como genérica y global.</p>
              <button
                onClick={handleConfirmTroncoComun}
                className="bg-[#0B1828] text-white font-bold py-3.5 px-8 rounded-xl shadow-md hover:bg-[#162840] transition-all active:scale-95"
              >
                Continuar
              </button>
            </div>
          ) : searchedCarreras.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <p className="text-sm">No se encontraron carreras con "{searchTerm}".</p>
            </div>
          ) : (
            searchedCarreras.map(c => (
              <button
                key={c.id_carrera}
                onClick={() => handleSelectCarrera(c.id_carrera)}
                className="w-full text-left p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col gap-1.5 active:scale-[0.99] border border-transparent hover:border-[#0B1828]/20"
              >
                <p className="text-sm font-black text-[#0B1828]">{c.nombre_carrera}</p>
                <NivelBadge nivel={c.nivel_academico} />
              </button>
            ))
          )}
        </ModalWrapper>
      )}

      {/* Grupo */}
      {activeModal === 'grupo' && (
        <ModalWrapper title="Seleccionar Grupo" icon={Users} onClose={closeModal} searchValue={searchTerm} onSearch={setSearchTerm}>
          {searchedGrupos.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">
                {searchTerm ? `No se encontraron grupos con "${searchTerm}".` : "No hay grupos activos para esta carrera."}
              </p>
            </div>
          ) : (
            searchedGrupos.map(g => (
              <button
                key={g.id_grupo}
                onClick={() => handleSelect('grupo_id', g.id_grupo)}
                className="w-full text-left p-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-transparent hover:border-[#0B1828]/20 flex justify-between items-center group"
              >
                <div className="flex flex-col gap-1.5">
                  <p className="text-base font-black text-[#0B1828]">{g.identificador}</p>
                  <NivelBadge nivel={g.nivel_academico} />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0B1828]" />
              </button>
            ))
          )}
        </ModalWrapper>
      )}

      {/* Materia */}
      {activeModal === 'materia' && (
        <ModalWrapper title="Seleccionar Materia" icon={BookOpen} onClose={closeModal} searchValue={searchTerm} onSearch={setSearchTerm}>
          {searchedMaterias.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">
                {searchTerm ? `No se encontraron materias con "${searchTerm}".` : "No hay materias disponibles para este bloque."}
              </p>
            </div>
          ) : (
            searchedMaterias.map(m => (
              <button
                key={m.id_materia}
                onClick={() => handleSelect('materia_id', m.id_materia)}
                className="w-full text-left p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-transparent hover:border-[#0B1828]/20 flex flex-col gap-2"
              >
                <p className="text-base font-black text-[#0B1828] leading-tight">{m.nombre}</p>
                <p className="text-xs font-bold text-slate-400">{m.codigo_unico}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <TipoBadge tipo={m.tipo_asignatura || ''} />
                  <NivelBadge nivel={m.nivel_academico} />
                </div>
              </button>
            ))
          )}
        </ModalWrapper>
      )}

      {/* Docente */}
      {activeModal === 'docente' && (
        <ModalWrapper title="Seleccionar Docente" icon={User} onClose={closeModal} searchValue={searchTerm} onSearch={setSearchTerm}>
          {searchedDocentes.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <User className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm px-6">
                {searchTerm ? `No se encontraron docentes con "${searchTerm}".` : "No hay docentes de esta academia que cumplan con el nivel requerido."}
              </p>
            </div>
          ) : (
            searchedDocentes.map(d => (
              <button
                key={d.id_docente}
                onClick={() => handleSelect('docente_id', d.id_docente)}
                className="w-full text-left p-5 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex justify-between items-center active:scale-[0.99] border border-transparent hover:border-[#0B1828]/20 group"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-black text-[#0B1828] transition-colors">
                    {`${d.nombres} ${d.apellido_paterno} ${d.apellido_materno || ''}`}
                  </p>
                  <NivelBadge nivel={d.nivel_academico} />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#0B1828] transition-colors" />
              </button>
            ))
          )}
        </ModalWrapper>
      )}

      {/* Horas */}
      {timeModalConfig && (
        <ModalWrapper 
          title={`Seleccionar Hora de ${timeModalConfig.field === 'hora_inicio' ? 'Inicio' : 'Fin'}`} 
          icon={Clock} 
          onClose={() => setTimeModalConfig(null)} 
          showSearch={false}
        >
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {TIME_SLOTS.map(time => (
              <button
                key={time}
                type="button"
                onClick={() => {
                  handleHorarioChange(timeModalConfig.index, timeModalConfig.field, time);
                  setTimeModalConfig(null);
                }}
                className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-[#0B1828] hover:text-white transition-all text-sm font-bold text-center active:scale-95 shadow-sm"
              >
                {time}
              </button>
            ))}
          </div>
        </ModalWrapper>
      )}

    </div>
  );
};