import React, { useState } from 'react';
import { AlertTriangle, X, Loader2, Trash2, Ban } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast';
<<<<<<< HEAD

const ModalEstatusAula = ({ aula, alCerrar, alExito, adminId }) => {
  const [estaCargando, setEstaCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState(null);
  const [accionServidor, setAccionServidor] = useState(null);

  const estaActiva = aula.estatus === 'ACTIVO';
  const accionTexto = estaActiva ? 'desactivar' : 'reactivar';
  const temaColor = estaActiva ? 'red' : 'emerald';

  const manejarCambioEstatus = async () => {
    setEstaCargando(true);
    setMensajeError(null);
    const toastId = toast.loading("Procesando ${accionTexto}ción...");

    try {
      const endpoint = estaActiva 
        ? `/aulas/desactivar/${aula.id_aula}` 
        : `/aulas/reactivar/${aula.id_aula}`;
      const respuesta = await api.patch(endpoint, {
        modificado_por: adminId 
      });

      if (respuesta.status === 200) {
        toast.success("¡Espacio ${accionTexto}do con éxito!", { id: toastId });
        alExito(); 
        alCerrar(); 
      }
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data || {};
      
      // intercepción del bloqueo de integridad relacional
      if (status === 409 && data.action === "BLOCK") {
        setAccionServidor("BLOCK");
        setMensajeError(detalles.detalles || "Conflicto de integridad referencial.");
        toast.error("Operación denegada por reglas de integridad", { id: toastId, duration: 8000 });
      } else {
        setMensajeError(data.message || data.error || "Error al conectar con el servidor.");
        toast.error("Hubo un problema al ${accionTexto} el espacio", { id: toastId });
=======

const DeactivateAulaModal = ({ aula, alCerrar, alExito, adminId }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [serverAction, setServerAction] = useState(null);

  const manejarDesactivacion = async () => {
    setCargando(true);
    setError(null);
    const toastId = toast.loading("Procesando desactivación...");

    try {
      const response = await api.patch(`/aulas/desactivar/${aula.id_aula}`, {
        eliminado_por: adminId 
      });

      if (response.status === 200) {
        toast.success("¡Espacio desactivado con éxito!", { id: toastId });
        alExito(); 
        alCerrar(); 
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};
      
      // intercepción del bloqueo de integridad relacional
      if (status === 409 && data.action === "BLOCK") {
        setServerAction("BLOCK");
        const detalles = data.detalles || "Conflicto de integridad referencial.";
        setError(detalles);
        toast.error("Operación denegada por reglas de integridad", { id: toastId, duration: 8000 });
      } else {
        const msg = data.message || data.error || "Error al conectar con el servidor.";
        setError(msg);
        toast.error("Hubo un problema al desactivar el espacio", { id: toastId });
>>>>>>> f077882590116f3213427c490c599d2888b309b2
      }
    } finally {
      setEstaCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 transition-all">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        
<<<<<<< HEAD
        <div className={`p-4 flex items-center gap-3 border-b ${accionServidor === 'BLOCK' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`p-2 rounded-full shrink-0 ${accionServidor === 'BLOCK' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
            {accionServidor === 'BLOCK' ? <Ban className="w-6 h-6" /> : estaActiva ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${accionServidor === 'BLOCK' ? 'text-amber-800' : 'text-${temaColor}-800'}`}>
              {accionServidor === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar ${accionTexto}ción'}
            </h2>
            <p className={`text-sm ${accionServidor === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
              {accionServidor === 'BLOCK' ? 'Restricción del sistema' : 'Esta acción cambiará el estatus del espacio.'}
            </p>
          </div>
          <button onClick={alCerrar} disabled={estaCargando} className={`ml-auto transition-colors disabled:opacity-50 text-gray-400 hover:text-gray-600`}>
=======
        <div className={`p-4 flex items-center gap-3 border-b ${serverAction === 'BLOCK' ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`p-2 rounded-full shrink-0 ${serverAction === 'BLOCK' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
            {serverAction === 'BLOCK' ? <Ban className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h2 className={`text-lg font-bold ${serverAction === 'BLOCK' ? 'text-amber-800' : 'text-red-800'}`}>
              {serverAction === 'BLOCK' ? 'Acción bloqueada' : 'Confirmar desactivación'}
            </h2>
            <p className={`text-sm ${serverAction === 'BLOCK' ? 'text-amber-600' : 'text-red-600'}`}>
              {serverAction === 'BLOCK' ? 'Restricción del sistema' : 'Esta acción cambiará el estatus del espacio.'}
            </p>
          </div>
          <button onClick={alCerrar} disabled={cargando} className={`ml-auto transition-colors disabled:opacity-50 ${serverAction === 'BLOCK' ? 'text-amber-400 hover:text-amber-600' : 'text-red-400 hover:text-red-600'}`}>
>>>>>>> f077882590116f3213427c490c599d2888b309b2
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
<<<<<<< HEAD
          {mensajeError && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${accionServidor === 'BLOCK' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              {mensajeError}
            </div>
          )}

         {accionServidor !== 'BLOCK' && (
            <>
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas <span className="font-bold">{accionTexto}</span> el espacio: <br/>
                <span className="font-bold text-gray-900 text-lg">{aula.nombre_codigo}</span>?
              </p>
              <p className="text-sm text-gray-500">
                {estaActiva 
                  ? 'El aula ya no estará disponible para asignar nuevas clases, pero se mantendrá en el historial.' 
                  : 'El aula volverá a estar disponible para recibir asignaciones en los próximos periodos.'}
=======
          {error && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${serverAction === 'BLOCK' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-red-50 text-red-600'}`}>
              {error}
            </div>
          )}

          {serverAction !== 'BLOCK' && (
            <>
              <p className="text-gray-700 mb-2">
                ¿Estás seguro de que deseas desactivar el espacio: <br/>
                <span className="font-bold text-gray-900 text-lg">{aula.nombre_codigo}</span>?
              </p>
              <p className="text-sm text-gray-500">
                El aula ya no estará disponible para asignar nuevas clases, pero se mantendrá en el historial para consultas pasadas.
>>>>>>> f077882590116f3213427c490c599d2888b309b2
              </p>
            </>
          )}

          {/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end gap-3 mt-8">
            <button 
<<<<<<< HEAD
              onClick={alCerrar} disabled={estaCargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {accionServidor === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
            </button>
            
            {accionServidor !== 'BLOCK' && (
              <button 
                onClick={manejarCambioEstatus} disabled={estaCargando}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 font-medium disabled:opacity-50 ${estaActiva ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {estaCargando ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                 estaActiva ? <Trash2 className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                {estaCargando ? 'Procesando...' : `Sí, ${accionTexto} espacio`}
=======
              onClick={alCerrar} disabled={cargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
            >
              {serverAction === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
            </button>
            
            {serverAction !== 'BLOCK' && (
              <button 
                onClick={manejarDesactivacion} disabled={cargando}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
              >
                {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {cargando ? 'Desactivando...' : 'Sí, desactivar espacio'}
>>>>>>> f077882590116f3213427c490c599d2888b309b2
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ModalEstatusAula;