import { useState, useEffect } from "react"; 
import toast from "react-hot-toast";
import { Save, ArrowLeft, Calendar, Loader2, Hash, Layers, Trash2, Edit3 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const GrupoForm = ({ onBack, onSuccess, initialData = null }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});
  const [carreras, setCarreras] = useState([]); 
  const [cargandoCarreras, setCargandoCarreras] = useState(true);
  const [cuatrimestres, setCuatrimestres] = useState([]);
  const [cargandoCuatrimestres, setCargandoCuatrimestres] = useState(true);

  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    identificador: initialData?.identificador || "",
    cuatrimestre_id: initialData?.cuatrimestre_id || "",
    carrera_id: initialData?.carrera_id || "",
  });

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resCarreras, resCuatrimestres] = await Promise.all([
          api.get("/carreras"),
          api.get("/cuatrimestres")
        ]);
        
        const listaCarreras = Array.isArray(resCarreras.data) ? resCarreras.data : resCarreras.data.data;
        const carrerasActivas = listaCarreras.filter(c => c.estatus === 'ACTIVO');
        setCarreras(carrerasActivas || []);

        const listaCuatrimestres = Array.isArray(resCuatrimestres.data) ? resCuatrimestres.data : resCuatrimestres.data.data;
        setCuatrimestres(listaCuatrimestres || []);

      } catch (error) {
        console.error("Error al cargar catálogos:", error);
        toast.error("No se pudieron cargar las opciones del formulario.");
      } finally {
        setCargandoCarreras(false);
        setCargandoCuatrimestres(false);
      }
    };
    fetchCatalogos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const finalValue = name === 'identificador' ? value.toUpperCase().slice(0, 10) : value;
    
    setFormData({ ...formData, [name]: finalValue });
    if (errores[name]) setErrores({ ...errores, [name]: null });
  };

  const validate = () => {
    const newErrors = {};
    const { identificador, cuatrimestre_id, carrera_id } = formData;
    const identificadorLimpio = identificador.trim();

    if (!identificadorLimpio) {
      newErrors.identificador = "El identificador del grupo es obligatorio";
    } else if (identificadorLimpio.length > 10) {
      newErrors.identificador = "El identificador no puede exceder los 10 caracteres";
    }

    if (!cuatrimestre_id) {
      newErrors.cuatrimestre_id = "Selecciona un cuatrimestre";
    }
    
    if (!carrera_id) {
      newErrors.carrera_id = "Selecciona una carrera";
    }

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando..." : "Guardando...");

    try {
      const payload = {
        identificador: formData.identificador,
        cuatrimestre_id: Number(formData.cuatrimestre_id),
        carrera_id: Number(formData.carrera_id),
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
      if (error.response?.data?.errores) {
        const backendErrors = {};
        error.response.data.errores.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrores(backendErrors);
        toast.error("Por favor corrige los campos señalados en rojo", { id: toastId });
      } else {
        const msg = error.response?.data?.message || "Error al procesar la solicitud";
        toast.error(msg, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlaceholder = () => toast("Función de eliminación en desarrollo", { icon: "🚧" });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">{isEditing ? "Gestionar grupo" : "Nuevo grupo"}</h2>
            <p className="text-sm text-slate-500 font-medium">Define el identificador, cuatrimestre y la carrera asignada.</p>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex gap-2">
            <button onClick={handleDeletePlaceholder} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Hash className="w-4 h-4 mr-2 text-blue-500" /> Identificador
              </label>
              <input
                type="text"
                name="identificador"
                value={formData.identificador}
                onChange={handleChange}
                placeholder="Ej: 1-A"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.identificador ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              />
              {errores.identificador && <p className="text-xs font-bold text-red-500">{errores.identificador}</p>}
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" /> Cuatrimestre
              </label>
              <select
                name="cuatrimestre_id"
                value={formData.cuatrimestre_id}
                onChange={handleChange}
                disabled={cargandoCuatrimestres}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.cuatrimestre_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">{cargandoCuatrimestres ? "Cargando..." : "-- Seleccione un cuatrimestre --"}</option>
                {cuatrimestres.map(c => (
                  <option key={c.id_cuatrimestre} value={c.id_cuatrimestre}>{c.nombre}</option>
                ))}
              </select>
              {errores.cuatrimestre_id && <p className="text-xs font-bold text-red-500">{errores.cuatrimestre_id}</p>}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Layers className="w-4 h-4 mr-2 text-blue-500" /> Carrera asignada
              </label>
              <select
                name="carrera_id"
                value={formData.carrera_id}
                onChange={handleChange}
                disabled={cargandoCarreras}
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${
                  errores.carrera_id ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:ring-blue-100"
                }`}
              >
                <option value="">{cargandoCarreras ? "Cargando..." : "-- Seleccione una carrera --"}</option>
                {carreras.map(c => (
                  <option key={c.id_carrera} value={c.id_carrera}>{c.nombre_carrera}</option>
                ))}
              </select>
              {errores.carrera_id && <p className="text-xs font-bold text-red-500">{errores.carrera_id}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            {isEditing ? (
              <button type="submit" disabled={isSubmitting || cargandoCarreras || cargandoCuatrimestres} className="flex items-center px-6 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-all shadow-md">
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Edit3 className="w-5 h-5 mr-2" />}
                Actualizar datos
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting || cargandoCarreras || cargandoCuatrimestres} className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar grupo
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};