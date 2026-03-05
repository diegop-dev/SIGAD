import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { PeriodosForm } from "./PeriodosForm";
import { PeriodosDelete } from "./periodosDelete";

export const PeriodosManagement = () => {

  const [periodos,setPeriodos] = useState([]);
  const [loading,setLoading] = useState(true);

  const [showForm,setShowForm] = useState(false);
  const [periodoToEdit,setPeriodoToEdit] = useState(null);
  const [periodoToDelete,setPeriodoToDelete] = useState(null);
const [filterYear, setFilterYear] = useState("");
const [filterStatus, setFilterStatus] = useState("");

  useEffect(()=>{
    fetchPeriodos();
  },[]);

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("es-MX");
};

  const fetchPeriodos = async ()=>{

    try{

      const res = await api.get("/periodos");

      setPeriodos(res.data);

    }catch{

      toast.error("Error cargando periodos");

    }finally{

      setLoading(false);

    }

  };

  if(showForm){
    return(
      <PeriodosForm
        periodoToEdit={periodoToEdit}
        onBack={()=>{setShowForm(false);setPeriodoToEdit(null)}}
        onSuccess={()=>{
          setShowForm(false);
          fetchPeriodos();
        }}
      />
    );
  }
const filteredPeriodos = periodos.filter(p => {

  const matchYear = filterYear ? p.anio == filterYear : true;

  const matchStatus = filterStatus
    ? p.estatus === filterStatus
    : true;

  return matchYear && matchStatus;

});
  return(

  <div className="bg-white rounded-2xl shadow-sm border border-slate-200">

    <div className="flex justify-between items-center px-6 py-5 border-b">

      <h2 className="text-xl font-black">Gestión de Periodos</h2>

      <button
        onClick={()=>setShowForm(true)}
        className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"
      >
        <Plus className="w-4 h-4 mr-2"/>
        Nuevo Periodo
      </button>

    </div>

    <div className="overflow-x-auto">
<div className="filters">

<select
value={filterYear}
onChange={(e)=>setFilterYear(e.target.value)}
>
<option value="">Todos los años</option>

{[...new Set(periodos.map(p => p.anio))].map(year => (
<option key={year} value={year}>
{year}
</option>
))}

</select>


<select
value={filterStatus}
onChange={(e)=>setFilterStatus(e.target.value)}
>

<option value="">Todos los estatus</option>
<option value="ACTIVO">Activo</option>
<option value="INACTIVO">Inactivo</option>

</select>

</div>
      <table className="w-full text-sm">

        <thead className="bg-slate-50">

          <tr>

            <th className="px-6 py-3 text-left">Periodo</th>
            <th className="px-6 py-3 text-left">Año</th>
            <th className="px-6 py-3 text-left">Fecha inicio</th>
            <th className="px-6 py-3 text-left">Fecha fin</th>
            <th className="px-6 py-3 text-left">Fecha límite calif.</th>
            <th className="px-6 py-3 text-left">Estatus</th>
            <th className="px-6 py-3 text-right">Acciones</th>

          </tr>

        </thead>

        <tbody>

          {filteredPeriodos.map(p=>(

          <tr key={p.id_periodo} className="border-t">

            <td className="px-6 py-4 font-bold">{p.codigo}</td>
            <td className="px-6 py-4">{p.anio}</td>
            <td className="px-6 py-4">{formatDate(p.fecha_inicio)}</td>
            <td className="px-6 py-4">{formatDate(p.fecha_fin)}</td>
            <td className="px-6 py-4">{formatDate(p.fecha_limite_calif)}</td>

            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                p.estatus === "ACTIVO"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
              }`}>
                {p.estatus}
              </span>
            </td>

            <td className="px-6 py-4 flex justify-end space-x-3">

              <button
                onClick={()=>{
                  setPeriodoToEdit(p);
                  setShowForm(true);
                }}
                className="text-blue-600"
              >
                <Pencil className="w-4 h-4"/>
              </button>

              <button
                onClick={()=>setPeriodoToDelete(p)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4"/>
              </button>

            </td>

          </tr>

          ))}

        </tbody>

      </table>

    </div>

    {periodoToDelete && (

      <PeriodosDelete
        periodo={periodoToDelete}
        onClose={()=>setPeriodoToDelete(null)}
        onSuccess={()=>{
          setPeriodoToDelete(null);
          fetchPeriodos();
        }}
      />

    )}

  </div>

  );

};