import { useState, useEffect } from "react";
import { Save, ArrowLeft, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const MateriasForm = ({ materiaToEdit, onBack, onSuccess }) => {

const { user } = useAuth();
const isEditing = !!materiaToEdit;

const [isSubmitting,setIsSubmitting] = useState(false);

const [carreras,setCarreras] = useState([]);
const [periodos,setPeriodos] = useState([]);
const [cuatrimestres,setCuatrimestres] = useState([]);

const [formData,setFormData] = useState({

nombre:"",
creditos:1,
cupo_maximo:30,
tipo_asignatura:"TRONCO_COMUN",
periodo_id:"",
cuatrimestre_id:"",
carrera_id:""

});

useEffect(()=>{

fetchCarreras();
fetchPeriodos();
fetchCuatrimestres();

},[]);

const fetchCarreras = async ()=>{

try{

const res = await api.get("/carreras");

setCarreras(res.data);

}catch{

toast.error("Error cargando carreras");

}

};

const fetchPeriodos = async ()=>{

try{

const res = await api.get("/periodos");

setPeriodos(res.data);

}catch{

toast.error("Error cargando periodos");

}

};

const fetchCuatrimestres = async ()=>{

try{

const res = await api.get("/cuatrimestres");

setCuatrimestres(res.data);

}catch{

toast.error("Error cargando cuatrimestres");

}

};

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

const toastId = toast.loading("Guardando materia...");

try{

if(isEditing){

await api.put(`/materias/${materiaToEdit.id_materia}`,{

...formData,

modificado_por:user.id_usuario

});

toast.success("Materia actualizada",{id:toastId});

}else{

await api.post("/materias",{

...formData,

creado_por:user.id_usuario

});

toast.success("Materia creada",{id:toastId});

}

onSuccess();

}catch(error){

console.log("Error completo:", error);
console.log("Respuesta backend:", error.response?.data);

toast.error("Error al guardar",{id:toastId});

}

};

return(

<div className="bg-white rounded-2xl shadow-sm border border-slate-200">

<div className="flex justify-between px-6 py-5 border-b">

<h2 className="text-xl font-black">

{isEditing ? "Modificar materia":"Registrar materia"}

</h2>

<button

onClick={onBack}

className="flex items-center text-sm font-bold"

>

<ArrowLeft className="w-4 h-4 mr-1"/> Regresar

</button>

</div>

<form onSubmit={handleSubmit} className="p-6 space-y-6">

<div className="grid grid-cols-2 gap-6">

<div>
<label className="block text-sm font-semibold mb-1">
Nombre de la materia
</label>
<input
name="nombre"
value={formData.nombre}
onChange={handleChange}
placeholder="Ej. Programación Web"
className="w-full border rounded-lg px-3 py-2"
/>
</div>

<div>
<label className="block text-sm font-semibold mb-1">
Tipo de asignatura
</label>
<select
name="tipo_asignatura"
value={formData.tipo_asignatura}
onChange={handleChange}
className="w-full border rounded-lg px-3 py-2"
>
<option value="TRONCO_COMUN">Tronco común</option>
<option value="OBLIGATORIA">Obligatoria</option>
<option value="OPTATIVA">Optativa</option>
</select>
</div>

<div>
<label className="block text-sm font-semibold mb-1">
Créditos
</label>
<input
type="number"
min="1"
max="30"
name="creditos"
value={formData.creditos}
onChange={handleChange}
className="w-full border rounded-lg px-3 py-2"
/>
</div>

<div>
<label className="block text-sm font-semibold mb-1">
Cupo máximo
</label>
<input
type="number"
min="1"
max="100"
name="cupo_maximo"
value={formData.cupo_maximo}
onChange={handleChange}
className="w-full border rounded-lg px-3 py-2"
/>
</div>

<div>
<label className="block text-sm font-semibold mb-1">
Periodo escolar
</label>
<select
name="periodo_id"
value={formData.periodo_id}
onChange={handleChange}
className="w-full border rounded-lg px-3 py-2"
>
<option value="">Seleccione periodo</option>
{periodos.map(p=>(
<option key={p.id_periodo} value={p.id_periodo}>
{p.codigo}
</option>
))}
</select>
</div>

<div>
<label className="block text-sm font-semibold mb-1">
Cuatrimestre
</label>
<select
name="cuatrimestre_id"
value={formData.cuatrimestre_id}
onChange={handleChange}
className="w-full border rounded-lg px-3 py-2"
>
<option value="">Seleccione cuatrimestre</option>
{cuatrimestres.map(c=>(
<option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>
{c.nombre}
</option>
))}
</select>
</div>

<div className="col-span-2">
<label className="block text-sm font-semibold mb-1">
Carrera
</label>
<select
name="carrera_id"
value={formData.carrera_id}
onChange={handleChange}
className="w-full border rounded-lg px-3 py-2"
>
<option value="">Seleccione carrera</option>
{carreras.map(c=>(
<option key={c.id_carrera} value={c.id_carrera}>
{c.nombre_carrera}
</option>
))}
</select>
</div>

</div>

<div className="flex justify-end pt-4">

<button
type="submit"
disabled={isSubmitting}
className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
>
<Save className="w-5 h-5 mr-2"/>
Guardar materia
</button>

</div>

</form>

</div>

);

};