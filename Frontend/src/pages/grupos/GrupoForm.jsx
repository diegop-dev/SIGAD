import { useState, useEffect, useMemo } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, Layers, Loader2, Trash2, Hash, BookOpen, AlertTriangle, Ban, GraduationCap } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const GrupoForm = ({ onBack, onSuccess, initialData = null }) => {
  const { user } = useAuth(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const [carreras, setCarreras] = useState([]); 
  const [cargandoCarreras, setCargandoCarreras] = useState(true);

  // --- PASO 1: MEMORIA DEL SEMÁFORO ---
  const [serverAction, setServerAction] = useState(null); 
  const [serverMessage, setServerMessage] = useState('');

  const isEditing = !!initialData;

  // NUEVO ESTADO: Nivel académico como filtro primario
  const [nivelSeleccionado, setNivelSeleccionado] = useState(initialData?.nivel_academico || "LICENCIATURA");
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState("");
  const [carreraId, setCarreraId] = useState(initialData?.carrera_id || "");

  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const response = await api.get("/carreras");
        const listaCarreras = Array.isArray(response.data) ? response.data : response.data.data;
        const carrerasActivas = listaCarreras.filter(c => c.estatus === 'ACTIVO');
        setCarreras(carrerasActivas || []);

        if (initialData?.carrera_id) {
          const carreraActual = carrerasActivas.find(c => c.id_carrera === initialData.carrera_id);
          if (carreraActual) {
            setModalidadSeleccionada(carreraActual.modalidad);
            setNivelSeleccionado(carreraActual.nivel_academico || "LICENCIATURA");
          }
        }
      } catch (error) {
        console.error("Error al cargar carreras:", error);
        toast.error("No se pudieron cargar las carreras disponibles.");
      } finally {
        setCargandoCarreras(false);
      }
    };
    fetchCarreras();
  }, [initialData]);

  // Doble filtro: Nivel Académico + Modalidad
  const carrerasFiltradas = useMemo(() => {
    if (!modalidadSeleccionada || !nivelSeleccionado) return [];
    return carreras.filter(c => 
      c.modalidad === modalidadSeleccionada && 
      (c.nivel_academico || "LICENCIATURA") === nivelSeleccionado
    );
  }, [carreras, modalidadSeleccionada, nivelSeleccionado]);

  // Manejador del Nuevo Nivel Académico (Filtro Padre)
  const handleNivelChange = (e) => {
    setNivelSeleccionado(e.target.value);
    setModalidadSeleccionada(""); // Limpiar cascada
    setCarreraId(""); // Limpiar cascada
    setServerAction(null); 
    if (errores.nivel_academico) setErrores({ ...errores, nivel_academico: null });
    if (errores.carrera_id) setErrores({ ...errores, carrera_id: null });
    if (errores.modalidad) setErrores({ ...errores, modalidad: null });
  };

  const handleModalidadChange = (e) => {
    setModalidadSeleccionada(e.target.value);
    setCarreraId(""); 
    setServerAction(null); 
    if (errores.carrera_id) setErrores({ ...errores, carrera_id: null });
    if (errores.modalidad) setErrores({ ...errores, modalidad: null });
  };

  const handleCarreraChange = (e) => {
    setCarreraId(e.target.value);
    setServerAction(null); 
    if (errores.carrera_id) setErrores({ ...errores, carrera_id: null });
  };

  const validate = () => {
    const newErrors = {};
    if (!nivelSeleccionado) {
      newErrors.nivel_academico = "Selecciona el nivel académico";
    }
    if (!modalidadSeleccionada) {
      newErrors.modalidad = "Selecciona una modalidad";
    }
    if (!carreraId) {
      newErrors.carrera_id = "Selecciona una carrera";
    }
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
      
      // Intercepción exacta de la acción definida en el controlador (BLOCK o WARN)
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">{isEditing ? "Gestionar grupo" : "Nuevo grupo"}</h2>
            <p className="text-sm text-slate-500 font-medium">
              {isEditing ? "Modifica la asignación de carrera." : "Filtra por nivel, modalidad y elige la carrera."}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* NUEVO CAMPO: Nivel Académico */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <GraduationCap className="w-4 h-4 mr-2 text-blue-500" /> Nivel Académico
              </label>
              <select
                value={nivelSeleccionado}
                onChange={handleNivelChange}
                disabled={cargandoCarreras || serverAction === 'BLOCK'}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.nivel_academico ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="LICENCIATURA">Licenciatura</option>
                <option value="MAESTRIA">Maestría</option>
              </select>
              {errores.nivel_academico && <p className="text-xs font-bold text-red-500">{errores.nivel_academico}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Layers className="w-4 h-4 mr-2 text-blue-500" /> Modalidad
              </label>
              <select
                value={modalidadSeleccionada}
                onChange={handleModalidadChange}
                disabled={!nivelSeleccionado || cargandoCarreras || serverAction === 'BLOCK'}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.modalidad ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">{cargandoCarreras ? "Cargando..." : "-- Seleccione modalidad --"}</option>
                <option value="ESCOLARIZADA">ESCOLARIZADA</option>
                <option value="EJECUTIVA">EJECUTIVA</option>
                <option value="HÍBRIDA">HÍBRIDA</option>
              </select>
              {errores.modalidad && <p className="text-xs font-bold text-red-500">{errores.modalidad}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Programa académico asignado
              </label>
              <select
                value={carreraId}
                onChange={handleCarreraChange}
                disabled={!modalidadSeleccionada || cargandoCarreras || serverAction === 'BLOCK'}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.carrera_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
                }`}
              >
                <option value="">-- Seleccione una carrera/maestría --</option>
                {/* ✨ AQUÍ MOSTRAMOS EL CÓDIGO ÚNICO DE LA CARRERA ✨ */}
                {carrerasFiltradas.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>{c.codigo_unico}</option>
                ))}
              </select>
              {errores.carrera_id && <p className="text-xs font-bold text-red-500">{errores.carrera_id}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Hash className="w-4 h-4 mr-2 text-blue-500" /> Identificador {isEditing ? "actual" : "generado"}
              </label>
              <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm flex items-center justify-between">
                <span className="font-bold">
                  {carreraId || isEditing ? previewIdentificador : "Esperando selección de programa..."}
                </span>
                {!isEditing && carreraId && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                    Vista previa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isEditing 
                  ? "El identificador original no se puede modificar." 
                  : "El fragmento [###] será reemplazado por el ID automático de la base de datos."}
              </p>
            </div>

            {/* --- PASO 4: INTERFAZ VISUAL DEL SEMÁFORO --- */}
            {serverAction === 'BLOCK' && (
              <div className="md:col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-start mt-2">
                <Ban className="w-5 h-5 text-amber-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">Acción bloqueada</h4>
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">{serverMessage}</p>
                </div>
              </div>
            )}

            {serverAction === 'WARN' && (
              <div className="md:col-span-2 bg-red-50 p-4 rounded-xl border border-red-200 flex items-start mt-2">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-3 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-900 mb-1">Advertencia de seguridad</h4>
                  <p className="text-sm text-red-800 font-medium leading-relaxed">{serverMessage}</p>
                </div>
              </div>
            )}
            {/* ------------------------------------------------ */}

          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            {serverAction === 'BLOCK' ? (
              <button type="button" onClick={onBack} className="px-8 py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all">
                Cerrar y volver
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isSubmitting || cargandoCarreras} 
                className={`flex items-center px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md disabled:opacity-50 ${
                  serverAction === 'WARN' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> 
                ) : (
                  serverAction === 'WARN' ? <AlertTriangle className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />
                )}
                
                {serverAction === 'WARN' ? "Confirmar cambio y rechazar clases" : (isEditing ? "Actualizar grupo" : "Generar grupo")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};