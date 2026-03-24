import { useState, useEffect, useMemo } from 'react';
import { BookOpen, CalendarDays, MapPin, Clock, Loader2, CheckCircle2, XCircle, AlertCircle, Info, AlertTriangle, X, Hash } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export const TeacherAssignments = () => {
  const { user } = useAuth();
  
  const [asignacionesRaw, setAsignacionesRaw] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estado para controlar el modal de rechazo
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
        toast.error("Tu usuario no está vinculado a un perfil de docente.");
        setIsLoading(false);
        return;
      }

      // Nos traemos las asignaciones de este docente
      const response = await api.get(`/asignaciones?docente_id=${miPerfilDocente.id_docente}`);
      const data = response.data.data || response.data;
      
      // Hacemos una llamada extra al catálogo de materias para tener el "tipo_asignatura" exacto
      const resMaterias = await api.get('/materias').catch(() => ({ data: [] }));
      const materiasCatalogo = resMaterias.data?.data || resMaterias.data || [];

      // Cruzamos los datos para inyectar el tipo de asignatura
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
      toast.error('Error al cargar tu carga académica.');
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
    const toastId = toast.loading(`Procesando tu respuesta...`);

    try {
      await api.patch('/asignaciones/confirmacion', {
        periodo_id: asignacion.periodo_id,
        materia_id: asignacion.materia_id,
        docente_id: asignacion.docente_id,
        grupo_id: asignacion.grupo_id, // Puede ser null si es tronco común, el backend ya lo soporta
        estatus_confirmacion: nuevoEstatus
      });

      toast.success(
        nuevoEstatus === 'ACEPTADA' ? '¡Clase aceptada exitosamente!' : 'Clase rechazada. Coordinación notificada.',
        { id: toastId }
      );
      
      setRechazoModal({ isOpen: false, asignacion: null }); // Cerramos modal si estaba abierto
      fetchMisAsignaciones();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al procesar tu decisión.", { id: toastId });
    }
  };

  const handleAceptar = (asignacion) => {
    procesarPeticion(asignacion, 'ACEPTADA');
  };

  const handleRechazarIntento = (asignacion) => {
    setRechazoModal({ isOpen: true, asignacion });
  };

  // ✨ COLORES DE LA INSIGNIA DEL TIPO DE ASIGNATURA ✨
  const getTipoAsignaturaStyles = (tipo) => {
    if (tipo === 'TRONCO_COMUN') return 'bg-white text-slate-700 border-slate-300';
    if (tipo === 'OBLIGATORIA') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tipo === 'OPTATIVA') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
          <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
          Mi Carga Académica
        </h1>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          Revisa las materias que te han sido asignadas para el ciclo escolar y confirma tu disponibilidad.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Loader2 className="h-10 w-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Cargando tus horarios...</p>
        </div>
      ) : asignacionesAgrupadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Sin asignaciones pendientes</h3>
          <p className="text-sm text-slate-500 max-w-md text-center">
            Actualmente no tienes ninguna carga académica asignada. La coordinación te notificará cuando haya nuevos horarios disponibles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {asignacionesAgrupadas.map((asignacion, index) => {
            const isEnviada = asignacion.estatus_confirmacion === 'ENVIADA';
            const isAceptada = asignacion.estatus_confirmacion === 'ACEPTADA';
            const isRechazada = asignacion.estatus_confirmacion === 'RECHAZADA';
            const nivelStr = (asignacion.nivel_academico || 'LICENCIATURA').toUpperCase();

            // ✨ REGLA DE VISUALIZACIÓN: ¿Es tronco común global?
            const esGrupoGlobal = !asignacion.grupo_id || asignacion.nombre_grupo === 'TRONCO COMÚN / GLOBAL';

            return (
              <div key={index} className={`flex flex-col bg-white rounded-2xl shadow-sm border transition-all duration-200 ${
                isEnviada ? 'border-blue-200 shadow-blue-50/50 hover:shadow-md' : 'border-slate-200'
              }`}>
                <div className={`p-5 border-b ${isEnviada ? 'bg-blue-50/30 border-blue-100' : 'bg-slate-50/50 border-slate-100'} rounded-t-2xl`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-white border border-slate-200 text-slate-600 shadow-sm">
                      <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> {asignacion.nombre_periodo}
                    </span>
                    
                    {isAceptada && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aceptada
                      </span>
                    )}
                    {isRechazada && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazada
                      </span>
                    )}
                    {isEnviada && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 animate-pulse">
                        <Info className="w-3.5 h-3.5 mr-1" /> Requiere acción
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-black text-slate-800 leading-tight mt-1">
                    {asignacion.nombre_materia}
                  </h3>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="flex items-center text-xs font-bold text-slate-500">
                      {asignacion.codigo_unico || 'SIN CÓDIGO'}
                    </span>
                    
                    {/* Insignia Nivel Académico */}
                    <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] uppercase tracking-wider ${
                      nivelStr === 'DOCTORADO' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      nivelStr === 'MAESTRIA' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                      'bg-blue-100 text-blue-700 border-blue-200'
                    }`}>
                      {nivelStr}
                    </span>

                    {/* ✨ NUEVO: Insignia Tipo de Asignatura */}
                    <span className={`px-2 py-0.5 rounded-md border font-bold text-[10px] uppercase tracking-wider ${getTipoAsignaturaStyles(asignacion.tipo_asignatura)}`}>
                      {(asignacion.tipo_asignatura || 'DESCONOCIDO').replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-500 mt-2.5">
                    {/* ✨ Condicional para ocultar el grupo si es TRONCO COMÚN GLOBAL */}
                    {esGrupoGlobal ? (
                      <span className="text-slate-700 font-bold">Tronco Común (Multidisciplinar)</span>
                    ) : (
                      <>Grupo: <span className="text-slate-700 font-bold">{asignacion.nombre_grupo}</span></>
                    )}
                  </p>
                </div>

                <div className="p-5 flex-1">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Bloques de Horario</h4>
                  <div className="space-y-2.5">
                    {asignacion.horarios.map((horario, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center text-sm font-bold text-slate-700">
                          <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 flex items-center justify-center mr-3 text-blue-600">
                            {diasSemanaMapa[horario.dia_semana]?.substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span>{diasSemanaMapa[horario.dia_semana]}</span>
                            <span className="text-xs font-medium text-slate-500 flex items-center mt-0.5">
                              <Clock className="w-3 h-3 mr-1" /> 
                              {horario.hora_inicio?.substring(0,5)} - {horario.hora_fin?.substring(0,5)}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-slate-600 flex items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                          {horario.nombre_aula}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {isEnviada && (
                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex gap-3">
                    <button
                      onClick={() => handleAceptar(asignacion)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition-colors shadow-sm flex items-center justify-center text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Aceptar
                    </button>
                    <button
                      onClick={() => handleRechazarIntento(asignacion)}
                      className="flex-1 bg-white hover:bg-red-50 text-red-600 font-bold py-2.5 px-4 rounded-xl border border-red-200 transition-colors shadow-sm flex items-center justify-center text-sm"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Rechazar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación de rechazo */}
      {rechazoModal.isOpen && rechazoModal.asignacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-red-500" /> Confirmar rechazo
              </h3>
              <button 
                onClick={() => setRechazoModal({ isOpen: false, asignacion: null })} 
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                Estás a punto de declinar impartir la materia <span className="font-bold text-slate-900">{rechazoModal.asignacion.nombre_materia}</span>
                {(!rechazoModal.asignacion.grupo_id || rechazoModal.asignacion.nombre_grupo === 'TRONCO COMÚN / GLOBAL') ? '' : <span> para el grupo <span className="font-bold text-slate-900">{rechazoModal.asignacion.nombre_grupo}</span></span>}.
              </p>
              <p className="text-xs text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                La coordinación será notificada inmediatamente y esta carga académica será reasignada. Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setRechazoModal({ isOpen: false, asignacion: null })}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => procesarPeticion(rechazoModal.asignacion, 'RECHAZADA')}
                className="px-5 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm"
              >
                Sí, rechazar clase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};