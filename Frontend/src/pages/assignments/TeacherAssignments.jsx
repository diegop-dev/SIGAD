import { useState, useEffect, useMemo } from 'react';
import { BookOpen, CalendarDays, MapPin, Clock, Loader2, CheckCircle2, XCircle, AlertCircle, Info, AlertTriangle, X, Users, Calendar } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

// Helper para convertir hora militar (HH:mm) a formato AM/PM amigable
const formatAMPM = (timeStr) => {
  if (!timeStr) return '--:--';
  const [hourStr, minuteStr] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; 
  return `${hour.toString().padStart(2, '0')}:${minuteStr} ${ampm}`;
};

export const TeacherAssignments = () => {
  const { user } = useAuth();
  
  const [asignacionesRaw, setAsignacionesRaw] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [rechazoModal, setRechazoModal] = useState({
    isOpen: false,
    asignacion: null
  });

  const diasSemanaMapa = {
    1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado"
  };

  const fetchMisAsignaciones = async () => {
    setIsLoading(true);
    try {
      const resDocentes = await api.get('/docentes');
      const docentes = resDocentes.data.data || resDocentes.data;
      const miPerfilDocente = docentes.find(d => d.usuario_id === user?.id_usuario);

      if (!miPerfilDocente) {
        toast.error("Tu cuenta de usuario no está vinculada a un expediente docente válido. Por favor, contacta a soporte.");
        setIsLoading(false);
        return;
      }

      const response = await api.get(`/asignaciones?docente_id=${miPerfilDocente.id_docente}`);
      const data = response.data.data || response.data;
      
      const resMaterias = await api.get('/materias').catch(() => ({ data: [] }));
      const materiasCatalogo = resMaterias.data?.data || resMaterias.data || [];

      const dataConTipo = (Array.isArray(data) ? data : []).map(asig => {
        const materiaInfo = materiasCatalogo.find(m => m.id_materia === asig.materia_id);
        return {
          ...asig,
          tipo_asignatura: materiaInfo ? materiaInfo.tipo_asignatura : 'DESCONOCIDO'
        };
      });

      setAsignacionesRaw(dataConTipo);
    } catch (error) {
      console.error("Error al cargar mis asignaciones:", error);
      toast.error('Ocurrió un problema de conexión al consultar tu carga académica. Inténtalo nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id_usuario) {
      fetchMisAsignaciones();
    }
  }, [user]);

  const asignacionesAgrupadas = useMemo(() => {
    const agrupadas = {};

    asignacionesRaw.forEach(item => {
      if (item.estatus_acta !== 'ABIERTA') return;

      const compositeKey = `${item.periodo_id}_${item.materia_id}_${item.grupo_id || 'NULL'}`;

      if (!agrupadas[compositeKey]) {
        agrupadas[compositeKey] = {
          ...item,
          horarios: []
        };
      }

      agrupadas[compositeKey].horarios.push({
        dia_semana: item.dia_semana,
        hora_inicio: item.hora_inicio,
        hora_fin: item.hora_fin,
        nombre_aula: item.nombre_aula
      });
    });

    return Object.values(agrupadas);
  }, [asignacionesRaw]);

  const procesarPeticion = async (asignacion, nuevoEstatus) => {
    const toastId = toast.loading(`Registrando tu decisión en el sistema...`);

    try {
      await api.patch('/asignaciones/confirmacion', {
        periodo_id: asignacion.periodo_id,
        materia_id: asignacion.materia_id,
        docente_id: asignacion.docente_id,
        grupo_id: asignacion.grupo_id, 
        estatus_confirmacion: nuevoEstatus
      });

      toast.success(
        nuevoEstatus === 'ACEPTADA' 
          ? 'La asignación ha sido aceptada y confirmada exitosamente.' 
          : 'La asignación ha sido declinada. Se ha notificado a la coordinación.',
        { id: toastId, duration: 4000 }
      );
      
      setRechazoModal({ isOpen: false, asignacion: null }); 
      fetchMisAsignaciones();
    } catch (error) {
      toast.error(error.response?.data?.error || "Ocurrió un error inesperado al procesar tu respuesta. Intenta nuevamente.", { id: toastId, duration: 5000 });
    }
  };

  const handleAceptar = (asignacion) => {
    procesarPeticion(asignacion, 'ACEPTADA');
  };

  const handleRechazarIntento = (asignacion) => {
    setRechazoModal({ isOpen: true, asignacion });
  };

  const getTipoAsignaturaStyles = (tipo) => {
    if (tipo === 'TRONCO_COMUN') return 'bg-white text-slate-700 border-slate-300';
    if (tipo === 'OBLIGATORIA') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tipo === 'OPTATIVA') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Encabezado Navy Estandarizado */}
      <div className="flex flex-col gap-4 bg-[#0B1828] p-6 md:p-8 rounded-3xl shadow-md relative overflow-hidden z-10">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Calendar className="w-7 h-7 mr-3 text-white/90" />
            Mis asignaciones
          </h1>
          <p className="mt-1.5 text-sm text-white/70 font-medium">
            Revisa las materias que te han sido asignadas para el ciclo escolar y confirma tu disponibilidad.
          </p>
        </div>
      </div>

      {/* Contenido Principal */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 text-[#0B1828] animate-spin mb-4" />
          <p className="text-sm text-slate-500 font-medium">Consultando tus asignaciones...</p>
        </div>
      ) : asignacionesAgrupadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-5 rounded-full mb-4 border border-slate-100">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-black text-[#0B1828] mb-1">Sin asignaciones activas</h3>
          <p className="text-sm text-slate-500 font-medium max-w-md text-center">
            No cuentas con asignaciones pendientes o activas en este momento. La coordinación académica te notificará cuando se te asigne una nueva asignación.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {asignacionesAgrupadas.map((asignacion, index) => {
            const isEnviada = asignacion.estatus_confirmacion === 'ENVIADA';
            const isAceptada = asignacion.estatus_confirmacion === 'ACEPTADA';
            const isRechazada = asignacion.estatus_confirmacion === 'RECHAZADA';
            const nivelStr = (asignacion.nivel_academico || 'LICENCIATURA').toUpperCase();
            const esGrupoGlobal = !asignacion.grupo_id || asignacion.nombre_grupo === 'TRONCO COMÚN / GLOBAL';

            return (
              <div key={index} className={`flex flex-col bg-white rounded-3xl shadow-sm border transition-all duration-200 ${
                isEnviada ? 'border-blue-200 shadow-blue-100/50 hover:shadow-md' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
              }`}>
                
                {/* Cabecera de la Tarjeta (NAVY) */}
                <div className="bg-[#0B1828] p-6 rounded-t-3xl border-b border-slate-800 flex flex-col gap-4">
                  {/* Fila de Badges Anclados firmemente a los Extremos */}
                  <div className="flex justify-between items-start gap-3 w-full">
                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-black bg-white/10 text-white border border-white/10 shadow-sm uppercase tracking-wider shrink-0">
                      <CalendarDays className="w-4 h-4 mr-2 text-white/70" /> {asignacion.nombre_periodo}
                    </span>
                    
                    <div className="flex justify-end text-right ml-auto shrink-0">
                      {isAceptada && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Aceptada
                        </span>
                      )}
                      {isRechazada && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 shadow-sm">
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Rechazada
                        </span>
                      )}
                      {isEnviada && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-500/40 shadow-sm animate-pulse">
                          <Info className="w-3.5 h-3.5 mr-1.5" /> Acción Requerida
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Título de la materia */}
                  <h3 className="text-xl font-black text-white leading-tight mt-1">
                    {asignacion.nombre_materia}
                  </h3>
                </div>

                {/* Cuerpo de la Tarjeta */}
                <div className="p-6 flex-1 flex flex-col gap-5">
                  
                  {/* Fila de Insignias Técnicas */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex items-center text-xs font-black text-slate-500 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm uppercase tracking-wider">
                      {asignacion.codigo_unico || 'SIN CÓDIGO'}
                    </span>
                    
                    <span className={`px-2.5 py-1.5 rounded-lg border shadow-sm font-black text-[10px] uppercase tracking-wider ${
                      nivelStr === 'DOCTORADO' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                      nivelStr === 'MAESTRIA' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
                      'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {nivelStr}
                    </span>

                    <span className={`px-2.5 py-1.5 rounded-lg border shadow-sm font-black text-[10px] uppercase tracking-wider ${getTipoAsignaturaStyles(asignacion.tipo_asignatura)}`}>
                      {(asignacion.tipo_asignatura || 'DESCONOCIDO').replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Fila de Información de Grupo */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center shadow-sm">
                    <Users className="w-6 h-6 text-slate-400 mr-4 shrink-0" />
                    <p className="text-sm font-medium text-slate-600">
                      {esGrupoGlobal ? (
                        <>Modalidad: <span className="text-[#0B1828] font-black text-base block mt-0.5">Tronco Común (Multidisciplinar)</span></>
                      ) : (
                        <>Grupo asignado: <span className="text-[#0B1828] font-black text-base block mt-0.5">{asignacion.nombre_grupo}</span></>
                      )}
                    </p>
                  </div>

                  {/* Horarios con AM/PM */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Bloques de Horario</h4>
                    <div className="space-y-3">
                      {asignacion.horarios.map((horario, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm gap-3">
                          <div className="flex items-center text-sm font-black text-[#0B1828]">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mr-3 text-[#0B1828] shrink-0">
                              {diasSemanaMapa[horario.dia_semana]?.substring(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span>{diasSemanaMapa[horario.dia_semana]}</span>
                              <span className="text-xs font-bold text-slate-500 flex items-center mt-0.5">
                                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> 
                                {/* Uso del formato AM/PM */}
                                {formatAMPM(horario.hora_inicio)} - {formatAMPM(horario.hora_fin)}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-black text-[#0B1828] flex items-center bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100 w-fit sm:w-auto">
                            <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                            {horario.nombre_aula}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acciones (Si está enviada) */}
                {isEnviada && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex gap-3">
                    <button
                      onClick={() => handleAceptar(asignacion)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center text-sm"
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" /> Aceptar asignación
                    </button>
                    <button
                      onClick={() => handleRechazarIntento(asignacion)}
                      className="flex-1 bg-white hover:bg-red-50 hover:border-red-300 text-red-600 font-black py-3.5 px-4 rounded-xl border border-red-200 transition-all shadow-sm active:scale-95 flex items-center justify-center text-sm"
                    >
                      <XCircle className="w-5 h-5 mr-2" /> Rechazar asignación
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación de Rechazo Estandarizado */}
      {rechazoModal.isOpen && rechazoModal.asignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center px-6 py-5 bg-[#0B1828] shrink-0">
              <div className="flex items-center text-white">
                <AlertTriangle className="w-6 h-6 mr-3 text-white" />
                <h3 className="text-xl font-black tracking-tight">Rechazar asignación</h3>
              </div>
              <button 
                onClick={() => setRechazoModal({ isOpen: false, asignacion: null })} 
                className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-full transition-all active:scale-95"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1">
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                A continuación, se presenta la información de la asignatura que estás declinando impartir para el periodo actual:
              </p>

              <div className="flex flex-col bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
                <span className="font-black text-[#0B1828] text-lg leading-tight mb-2">
                  {rechazoModal.asignacion.nombre_materia}
                </span>
                {(!rechazoModal.asignacion.grupo_id || rechazoModal.asignacion.nombre_grupo === 'TRONCO COMÚN / GLOBAL') ? (
                  <span className="text-sm font-bold text-slate-500">
                    Modalidad: <span className="text-slate-700">Tronco Común (Multidisciplinar)</span>
                  </span>
                ) : (
                  <span className="text-sm font-bold text-slate-500">
                    Grupo asignado: <span className="text-slate-700">{rechazoModal.asignacion.nombre_grupo}</span>
                  </span>
                )}
              </div>

              <div className="bg-red-50 p-5 rounded-2xl border border-red-100 shadow-sm">
                <p className="text-sm text-red-800 font-medium">
                  <strong className="font-black">Aviso institucional:</strong> Al confirmar esta acción, notificarás formalmente a la coordinación académica sobre tu indisponibilidad. La carga horaria será liberada y reasignada a otro docente. Esta decisión es definitiva.
                </p>
              </div>
            </div>

            {/* Solo botón de acción principal */}
            <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => procesarPeticion(rechazoModal.asignacion, 'RECHAZADA')}
                className="flex items-center justify-center px-6 py-3.5 text-sm font-black text-white bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-200 rounded-xl transition-all shadow-md active:scale-95 w-full sm:w-auto"
              >
                <XCircle className="w-5 h-5 mr-2" /> Sí, Rechazar Asignación
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};