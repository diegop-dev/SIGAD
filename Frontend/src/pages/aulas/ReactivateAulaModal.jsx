import React, { useState } from 'react';
import { AlertCircle, X, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast';

const ReactivateAulaModal = ({ aula, alCerrar, alExito, adminId }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  if (!aula) return null;

  const manejarReactivacion = async () => {
    setCargando(true);
    setError(null);
    const toastId = toast.loading("Procesando reactivación...");

    try {
      const payload = {
        nombre: aula.nombre_codigo,
        tipo: aula.tipo,
        capacidad: aula.capacidad,
        ubicacion: aula.ubicacion,
        estatus: 'ACTIVO',
        modificado_por: adminId 
      };

      const response = await api.patch(`/aulas/actualizar/${aula.id_aula}`, payload);

      if (response.status === 200) {
        toast.success("¡Espacio reactivado con éxito!", { id: toastId });
        alExito(); 
        alCerrar(); 
      }
    } catch (err) {
      const msj = err.response?.data?.message || err.response?.data?.error || "Error al conectar con el servidor.";
      setError(msj);
      toast.error("Hubo un problema al reactivar el espacio", { id: toastId });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1828]/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center px-6 py-5 shrink-0 bg-[#0B1828]">
          <div className="flex items-center text-white">
            <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-400" />
            <h3 className="text-xl font-black tracking-tight">Confirmar reactivación</h3>
          </div>
          <button onClick={alCerrar} disabled={cargando} className="p-2.5 bg-white/10 text-white hover:bg-black/20 rounded-full transition-all active:scale-95 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto flex-1 text-center sm:text-left">
          {error && (
            <div className="mb-6 p-4 rounded-2xl flex gap-3 text-left border bg-red-50 text-red-800 border-red-100 shadow-sm">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <p className="font-bold text-sm leading-relaxed">{error}</p>
            </div>
          )}

          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            Estás a punto de restaurar el estatus activo del siguiente espacio:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="h-16 w-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xl font-black text-[#0B1828] leading-tight uppercase">{aula.nombre_codigo}</h4>
              <p className="text-sm font-bold text-slate-500 mt-1">Ubicación: {aula.ubicacion}</p>
            </div>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm text-left">
            <p className="text-sm text-emerald-800 font-medium">
              El espacio cambiará a estatus <span className="font-black" >ACTIVO</span> y podrá volver a ser utilizado para nuevas asignaciones de clases.
            </p>
          </div>
        </div>

        <div className="bg-slate-50/80 px-6 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            onClick={alCerrar} disabled={cargando}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0B1828] disabled:opacity-50 transition-all shadow-sm active:scale-95"
          >
            Cancelar
          </button>
          <button 
            onClick={manejarReactivacion} disabled={cargando}
            className="flex items-center justify-center px-6 py-3 text-sm font-black text-white hover:shadow-md rounded-xl transition-all active:scale-95 disabled:opacity-50 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
          >
            {cargando ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            {cargando ? 'Reactivando...' : 'Reactivar Espacio'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReactivateAulaModal;
