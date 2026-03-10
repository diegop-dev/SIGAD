import { X, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export const MateriasDelete = ({
  materia,
  onClose,
  onSuccess,
}) => {

  const handleDelete = async () => {

const toastId = toast.loading("Procesando eliminación...");

try{

await api.delete(`/materias/${materia.id_materia}`);

toast.success("Materia eliminada correctamente",{id:toastId});

onSuccess();

}catch(error){

if(error.response?.status === 409){

toast.error("Tiene historial. Se aplicará baja lógica.",{id:toastId});

await handleLogicalDelete();

}else{

toast.error("Error eliminando",{id:toastId});

}

}

};

const handleLogicalDelete = async ()=>{

const toastId = toast.loading("Aplicando baja lógica...");

try{

await api.patch(`/materias/${materia.id_materia}/toggle`);

toast.success("Materia desactivada",{id:toastId});

onSuccess();

}catch{

toast.error("Error aplicando baja lógica",{id:toastId});

}

};

 return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">

      <div className="flex justify-between items-center px-6 py-5 border-b bg-red-50">
        <h2 className="text-lg font-black text-red-700 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2"/>
          Administrar materia
        </h2>

        <button onClick={onClose}>
          <X/>
        </button>
      </div>

      <div className="p-6 space-y-4 text-sm text-slate-700">

        <p>
          ¿Qué desea hacer con la materia
          <span className="font-bold"> {materia.nombre}</span>?
        </p>

        <div className="space-y-3">

          <button
            onClick={handleLogicalDelete}
            className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600"
          >
            Desactivar materia
          </button>

          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-center px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2"/>
            Eliminar permanentemente
          </button>

        </div>

        <p className="text-xs text-slate-500">
          Desactivar mantiene el historial. Eliminar borra completamente si no tiene relaciones.
        </p>

      </div>

      <div className="flex justify-end px-6 py-4 border-t bg-slate-50">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-slate-200 font-bold"
        >
          Cancelar
        </button>
      </div>

    </div>
  </div>
);
};