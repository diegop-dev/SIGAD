import { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const PeriodosForm = ({periodoToEdit,onBack,onSuccess})=>{

const { user } = useAuth();

const isEditing = !!periodoToEdit;

const [isSubmitting,setIsSubmitting] = useState(false);

const [formData,setFormData] = useState({

codigo:periodoToEdit?.codigo || "",
anio:periodoToEdit?.anio || "",
fecha_inicio:periodoToEdit?.fecha_inicio || "",
fecha_fin:periodoToEdit?.fecha_fin || "",
fecha_limite_calif:periodoToEdit?.fecha_limite_calif || ""

});



const handleChange = (e)=>{

const {name,value} = e.target;

setFormData(prev=>({
...prev,
[name]:value
}));

};

const handleSubmit = async (e)=>{

e.preventDefault();

setIsSubmitting(true);

const toastId = toast.loading("Guardando periodo...");

try{

if(isEditing){

await api.put(`/periodos/${periodoToEdit.id_periodo}`,{
...formData,
modificado_por:user.id_usuario
});

toast.success("Periodo actualizado",{id:toastId});

}else{

await api.post("/periodos",{
...formData,
creado_por:user.id_usuario
});

toast.success("Periodo creado",{id:toastId});

}

onSuccess();

}catch{

toast.error("Error al guardar",{id:toastId});

}finally{

setIsSubmitting(false);

}

};

return(

<div className="bg-white rounded-2xl shadow-sm border border-slate-200">

<div className="flex justify-between px-6 py-5 border-b">

<h2 className="text-xl font-black">

{isEditing ? "Editar periodo":"Registrar periodo"}

</h2>

<button onClick={onBack} className="flex items-center text-sm font-bold">

<ArrowLeft className="w-4 h-4 mr-1"/> Regresar

</button>

</div>

<form onSubmit={handleSubmit} className="p-6 space-y-6">

<div>
<label className="text-sm font-bold">Código del periodo</label>
<input
name="codigo"
value={formData.codigo}
onChange={handleChange}
className="w-full border rounded-xl px-4 py-3"
/>
</div>

<div>
<label className="text-sm font-bold">Año</label>
<input
type="number"
name="anio"
value={formData.anio}
onChange={handleChange}
className="w-full border rounded-xl px-4 py-3"
/>
</div>

<div>
<label className="text-sm font-bold">Fecha inicio</label>
<input
type="date"
name="fecha_inicio"
value={formData.fecha_inicio}
onChange={handleChange}
className="w-full border rounded-xl px-4 py-3"
/>
</div>

<div>
<label className="text-sm font-bold">Fecha fin</label>
<input
type="date"
name="fecha_fin"
value={formData.fecha_fin}
onChange={handleChange}
className="w-full border rounded-xl px-4 py-3"
/>
</div>

<div>
<label className="text-sm font-bold">Fecha límite de calificaciones</label>
<input
type="date"
name="fecha_limite_calif"
value={formData.fecha_limite_calif}
onChange={handleChange}
className="w-full border rounded-xl px-4 py-3"
/>
</div>

<button
type="submit"
disabled={isSubmitting}
className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl"
>

<Save className="w-5 h-5 mr-2"/>

Guardar

</button>

</form>

</div>

);

};