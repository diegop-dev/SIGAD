import { useState, useEffect, useMemo } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, Layers, Loader2, Hash, BookOpen, AlertTriangle, Ban, GraduationCap, RefreshCw, Calendar } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const GrupoForm = ({ onBack, onSuccess, initialData = null }) => {
  const { user } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  
  const [carreras, setCarreras] = useState([]); 
  const [cargandoCarreras, setCargandoCarreras] = useState(true);

  // Estados exclusivos para los cuatrimestres
  const [cuatrimestres, setCuatrimestres] = useState([]);
  const [cargandoCuatrimestres, setCargandoCuatrimestres] = useState(false);
  const [cuatrimestreId, setCuatrimestreId] = useState(initialData?.cuatrimestre_id || "");

  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  const isEditing = !!initialData;

  const [nivelSeleccionado, setNivelSeleccionado] = useState(initialData?.nivel_academico || "LICENCIATURA");
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState("");
  const [carreraId, setCarreraId] = useState(initialData?.carrera_id || "");

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        // 1. Cargar carreras siempre (se usan tanto para crear como para editar)
        const responseCarreras = await api.get("/carreras");
        const listaCarreras = Array.isArray(responseCarreras.data) ? responseCarreras.data : responseCarreras.data.data;
        const carrerasActivas = listaCarreras.filter(c => c.estatus === 'ACTIVO');
        setCarreras(carrerasActivas || []);

        if (initialData?.carrera_id) {
          const carreraActual = carrerasActivas.find(c => c.id_carrera === initialData.carrera_id);
          if (carreraActual) {
            setModalidadSeleccionada(carreraActual.modalidad);
            setNivelSeleccionado(carreraActual.nivel_academico || "LICENCIATURA");
          }
        }

        // 2. Cargar cuatrimestres SOLO si estamos editando
        if (isEditing) {
          setCargandoCuatrimestres(true);
          const responseCuatrimestres = await api.get("/cuatrimestres");
          const listaCuatrimestres = Array.isArray(responseCuatrimestres.data) ? responseCuatrimestres.data : responseCuatrimestres.data.data;
          setCuatrimestres(listaCuatrimestres || []);
        }

      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.error("No se pudieron cargar los datos disponibles.");
      } finally {
        setCargandoCarreras(false);
        if (isEditing) setCargandoCuatrimestres(false);
      }
    };
    fetchCatalogos();
  }, [initialData, isEditing]);

  const carrerasFiltradas = useMemo(() => {
    if (!modalidadSeleccionada || !nivelSeleccionado) return [];
    return carreras.filter(c => 
      c.modalidad === modalidadSeleccionada && 
      (c.nivel_academico || "LICENCIATURA") === nivelSeleccionado
    );
  }, [carreras, modalidadSeleccionada, nivelSeleccionado]);

  const validateField = (name, value, isEditingMode = isEditing) => {
    if (name === "nivel_academico" && !value) return "Selecciona el nivel académico";
    if (name === "modalidad" && !value) return "Selecciona una modalidad";
    if (name === "carrera_id" && !value) return "Selecciona un programa académico";
    if (name === "cuatrimestre_id" && isEditingMode && !value) return "Selecciona un cuatrimestre";
    return null;
  };

  const handleNivelChange = (e) => {
    const val = e.target.value;
    setNivelSeleccionado(val);
    setModalidadSeleccionada(""); 
    setCarreraId(""); 
    setServerAction(null); 
    setErrores(prev => {
      const next = { ...prev };
      const err = validateField('nivel_academico', val);
      if (err) next.nivel_academico = err; else delete next.nivel_academico;
      const errMod = validateField('modalidad', "");
      if (errMod) next.modalidad = errMod; else delete next.modalidad;
      const errCarr = validateField('carrera_id', "");
      if (errCarr) next.carrera_id = errCarr; else delete next.carrera_id;
      return next;
    });
  };

  const handleModalidadChange = (e) => {
    const val = e.target.value;
    setModalidadSeleccionada(val);
    setCarreraId(""); 
    setServerAction(null); 
    setErrores(prev => {
      const next = { ...prev };
      const err = validateField('modalidad', val);
      if (err) next.modalidad = err; else delete next.modalidad;
      const errCarr = validateField('carrera_id', "");
      if (errCarr) next.carrera_id = errCarr; else delete next.carrera_id;
      return next;
    });
  };

  const handleCarreraChange = (e) => {
    const val = e.target.value;
    setCarreraId(val);
    setServerAction(null); 
    setErrores(prev => {
      const next = { ...prev };
      const err = validateField('carrera_id', val);
      if (err) next.carrera_id = err; else delete next.carrera_id;
      return next;
    });
  };

  const handleCuatrimestreChange = (e) => {
    const val = e.target.value;
    setCuatrimestreId(val);
    setServerAction(null);
    setErrores(prev => {
      const next = { ...prev };
      const err = validateField('cuatrimestre_id', val);
      if (err) next.cuatrimestre_id = err; else delete next.cuatrimestre_id;
      return next;
    });
  };

  const validate = () => {
    const newErrors = {};
    const e1 = validateField('nivel_academico', nivelSeleccionado);
    if (e1) newErrors.nivel_academico = e1;
    const e2 = validateField('modalidad', modalidadSeleccionada);
    if (e2) newErrors.modalidad = e2;
    const e3 = validateField('carrera_id', carreraId);
    if (e3) newErrors.carrera_id = e3;
    const e4 = validateField('cuatrimestre_id', cuatrimestreId);
    if (e4) newErrors.cuatrimestre_id = e4;

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando..." : "Generando grupo...");

    try {
      const payload = { 
        carrera_id: Number(carreraId),
        nivel_academico: nivelSeleccionado, 
        creado_por: user?.id_usuario,
        confirmar_rechazo: serverAction === 'WARN' 
      };

      if (isEditing) {
        // Incluir el cuatrimestre modificado en el payload del PUT
        payload.cuatrimestre_id = Number(cuatrimestreId);
        await api.put(`/grupos/${initialData.id_grupo}`, payload);
      } else {
        await api.post("/grupos", payload);
      }
      
      toast.success("Operación exitosa", { id: toastId });
      if (onSuccess) onSuccess();
      if (onBack) onBack();

    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};
      
      toast.dismiss(toastId);
      
      if (status === 409 && (errorData.action === 'BLOCK' || errorData.action === 'WARN')) {
        const detalles = errorData.detalles || errorData.error || "Conflicto de integridad referencial.";
        setServerAction(errorData.action); 
        setServerMessage(detalles); 
        
        if (errorData.action === 'BLOCK') {
          toast.error("Operación denegada por reglas de integridad", { duration: 8000 });
        }
      } else {
        const msg = errorData.message || errorData.error || "Ocurrió un error al procesar la solicitud.";
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const carreraSeleccionada = carreras.find(c => c.id_carrera === Number(carreraId));
  const codigoUnico = carreraSeleccionada?.codigo_unico || "XXXX";
  const anioActual = new Date().getFullYear();
  
  const previewIdentificador = isEditing 
    ? initialData.identificador 
    : `${anioActual}${codigoUnico}[###]`;

  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10">
        <button
          onClick={onBack}
          className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white">
            {isEditing ? "Modificar grupo" : "Nuevo grupo"}
          </h2>
          <p className="text-sm text-white/60 font-medium">
            {isEditing ? "Modifica la asignación de carrera y cuatrimestre." : "Filtra por nivel, modalidad y elige la carrera."}
          </p>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto space-y-10">
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Asignación académica</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <GraduationCap className="w-4 h-4 mr-2" /> Nivel académico <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  value={nivelSeleccionado}
                  onChange={handleNivelChange}
                  disabled={cargandoCarreras || serverAction === 'BLOCK'}
                  className={`${inputBaseClass} ${getValidationClass(errores.nivel_academico)}`}
                >
                  <option value="LICENCIATURA">Licenciatura</option>
                  <option value="MAESTRIA">Maestría</option>
                </select>
                {errores.nivel_academico && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nivel_academico}</p>}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Layers className="w-4 h-4 mr-2" /> Modalidad <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  value={modalidadSeleccionada}
                  onChange={handleModalidadChange}
                  disabled={!nivelSeleccionado || cargandoCarreras || serverAction === 'BLOCK'}
                  className={`${inputBaseClass} ${getValidationClass(errores.modalidad)}`}
                >
                  <option value="">{cargandoCarreras ? "Cargando..." : "-- Seleccione modalidad --"}</option>
                  <option value="ESCOLARIZADA">ESCOLARIZADA</option>
                  <option value="EJECUTIVA">EJECUTIVA</option>
                  <option value="HÍBRIDA">HÍBRIDA</option>
                </select>
                {errores.modalidad && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.modalidad}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <BookOpen className="w-4 h-4 mr-2" /> Programa académico asignado <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <select
                  value={carreraId}
                  onChange={handleCarreraChange}
                  disabled={!modalidadSeleccionada || cargandoCarreras || serverAction === 'BLOCK'}
                  className={`${inputBaseClass} ${getValidationClass(errores.carrera_id)}`}
                >
                  <option value="">-- Seleccione una carrera/maestría --</option>
                  {carrerasFiltradas.map(c => (
                    <option key={c.id_carrera} value={c.id_carrera}>
                      {c.nombre_carrera || "Programa sin nombre"}
                    </option>
                  ))}
                </select>
                {errores.carrera_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.carrera_id}</p>}
              </div>

              {/* Selector de Cuatrimestre: Renderizado condicional SOLO para edición */}
              {isEditing && (
                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Calendar className="w-4 h-4 mr-2" /> Cuatrimestre correspondiente <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <select
                    value={cuatrimestreId}
                    onChange={handleCuatrimestreChange}
                    disabled={cargandoCuatrimestres || serverAction === 'BLOCK'}
                    className={`${inputBaseClass} ${getValidationClass(errores.cuatrimestre_id)}`}
                  >
                    <option value="">{cargandoCuatrimestres ? "Cargando..." : "-- Seleccione el cuatrimestre --"}</option>
                    {cuatrimestres.map(c => (
                      <option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>{c.nombre}</option>
                    ))}
                  </select>
                  {errores.cuatrimestre_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.cuatrimestre_id}</p>}
                </div>
              )}

              <div className="md:col-span-2 space-y-2 mt-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                  <Hash className="w-4 h-4 mr-2" /> Identificador {isEditing ? "actual" : "generado"}
                </label>
                <div className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm flex items-center justify-between shadow-sm">
                  <span className="font-bold text-[#0B1828] font-mono text-base">
                    {carreraId || isEditing ? previewIdentificador : "Esperando programa..."}
                  </span>
                  {!isEditing && carreraId && (
                    <span className="text-[10px] bg-[#0B1828]/10 text-[#0B1828] px-2 py-1 rounded-md font-black uppercase tracking-wider">
                      Vista previa
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-slate-500 mt-1.5">
                  {isEditing 
                    ? "El identificador original no se puede modificar por integridad de datos." 
                    : "El fragmento [###] será reemplazado por el ID automático de la base de datos."}
                </p>
              </div>

              {serverAction === 'BLOCK' && (
                <div className="md:col-span-2 bg-amber-50 p-5 rounded-2xl border border-amber-200 flex items-start mt-4 shadow-sm">
                  <Ban className="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 mb-1">Acción bloqueada</h4>
                    <p className="text-sm text-amber-800 font-medium leading-relaxed">{serverMessage}</p>
                  </div>
                </div>
              )}

              {serverAction === 'WARN' && (
                <div className="md:col-span-2 bg-red-50 p-5 rounded-2xl border border-red-200 flex items-start mt-4 shadow-sm">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-red-900 mb-1">Advertencia de seguridad</h4>
                    <p className="text-sm text-red-800 font-medium leading-relaxed">{serverMessage}</p>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="pt-8 border-t border-dashed border-slate-200">
            {serverAction === 'BLOCK' ? (
              <button 
                type="button" 
                onClick={onBack} 
                className="w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 shadow-sm"
              >
                Cerrar y volver al listado
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting || cargandoCarreras || cargandoCuatrimestres} 
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg shadow-xl active:scale-[0.98] ${
                  serverAction === 'WARN' 
                    ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-red-600/30' 
                    : isSubmitting || cargandoCarreras || cargandoCuatrimestres
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300 shadow-none"
                      : "bg-[#0B1828] text-white hover:bg-[#162840] hover:shadow-[#0B1828]/30"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" /> 
                ) : (
                  serverAction === 'WARN' 
                    ? <AlertTriangle className="w-6 h-6 mr-2 text-white" /> 
                    : isEditing 
                      ? <RefreshCw className="w-6 h-6 mr-2 text-white" /> 
                      : <Save className="w-6 h-6 mr-2 text-white" />
                )}
                
                {isSubmitting
                  ? "Procesando cambios..."
                  : serverAction === 'WARN' ? "Confirmar cambio y rechazar clases" : (isEditing ? "Modificar grupo" : "Nuevo grupo")
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};