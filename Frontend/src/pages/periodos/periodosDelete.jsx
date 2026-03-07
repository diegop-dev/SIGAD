import { X, Trash2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

export const PeriodosDelete = ({periodo,onClose,onSuccess})=>{

const handleDelete = async ()=>{

const toastId = toast.loading("Inactivando periodo...");

try{

await api.delete(`/periodos/${periodo.id_periodo}`);

toast.success("Periodo inactivado",{id:toastId});

onSuccess();

}catch{

toast.error("Error al eliminar",{id:toastId});

}

};

return(

<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

<div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

<div className="flex justify-between items-center px-6 py-5 border-b bg-red-50">

<h2 className="text-lg font-black text-red-700 flex items-center">

<AlertTriangle className="w-5 h-5 mr-2"/>

Cerrar periodo

</h2>

<button onClick={onClose}><X/></button>

</div>

<div className="p-6 text-sm text-slate-700 space-y-4">

<p>

¿Está seguro de cerrar el periodo{" "}

<span className="font-bold">{periodo.codigo}</span>?

</p>

<p className="text-red-600 font-semibold">

El periodo pasará a estatus INACTIVO y no podrá usarse en nuevas asignaciones.

</p>

</div>

<div className="flex justify-end space-x-4 px-6 py-4 border-t bg-slate-50">

<button
onClick={onClose}
className="px-4 py-2 rounded-xl bg-slate-200 font-bold"
>
Cancelar
</button>

<button
onClick={handleDelete}
className="flex items-center px-4 py-2 rounded-xl bg-red-600 text-white font-bold"
>

<Trash2 className="w-4 h-4 mr-2"/>

Cerrar periodo

</button>

</div>

</div>

</div>

);

};