import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2, Home, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { REGEX } from '../../utils/regex';
import { formatToGlobalUppercase } from '../../utils/textFormatter';

const EDIFICIOS_DISPONIBLES = [
  "Edificio A",
  "Edificio B",
  "Edificio C",
  "Edificio D",
  "Edificio E",
  "Edificio F",
  "Edificio G",
  "Edificio H",
  "Planta Baja",
  "Planta Alta"
];

export const AulaForm = ({ aulaToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!aulaToEdit;

  const ubicacionesFinales = isEditing 
    ? (EDIFICIOS_DISPONIBLES.includes(aulaToEdit.ubicacion) ? EDIFICIOS_DISPONIBLES : [...EDIFICIOS_DISPONIBLES, aulaToEdit.ubicacion].filter(Boolean))
    : EDIFICIOS_DISPONIBLES;

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'AULA',
    capacidad: '',
    ubicacion: '',
    estatus: 'ACTIVO'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [serverAction, setServerAction] = useState(null);

  useEffect(() => {
    if (aulaToEdit) {
      setFormData({
        nombre: aulaToEdit.nombre_codigo || '',
        tipo: aulaToEdit.tipo || 'AULA',
        capacidad: aulaToEdit.capacidad || '',
        ubicacion: aulaToEdit.ubicacion || '',
        estatus: aulaToEdit.estatus || 'ACTIVO'
      });
    }
  }, [aulaToEdit]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const formattedValue = formatToGlobalUppercase(value, name, type);

    // Standard Regex validation
    if (name === 'nombre' && formattedValue !== '' && !REGEX.ALFANUMERICO_ESPACIOS_PUNTUACION.test(formattedValue)) return;
    if (name === 'nombre' && REGEX.TRIPLE_LETRA_REPETIDA.test(formattedValue)) return;
    if (name === 'capacidad' && formattedValue !== '' && !REGEX.NUMEROS.test(formattedValue)) return;

    setFormData({ ...formData, [name]: formattedValue });
    setError(null);
    setServerAction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        capacidad: parseInt(formData.capacidad),
      };

      let response;
      if (isEditing) {
        payload.modificado_por = user.id_usuario;
        if (serverAction === 'WARN') {
          payload.confirmar_rechazo = true;
        }
        response = await api.patch(`/aulas/actualizar/${aulaToEdit.id_aula}`, payload);
      } else {
        payload.creado_por = user.id_usuario;
        response = await api.post('/aulas/registrar', payload);
      }

      if (response.status === 200 || response.status === 201) {
        toast.success(isEditing ? "¡Espacio actualizado con éxito!" : "¡Aula registrada con éxito!");
        onSuccess(); 
      }
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data || {};

      if (status === 409 && (data.action === "BLOCK" || data.action === "WARN")) {
        setServerAction(data.action);
        const detalles = data.detalles || data.error || "Conflicto de integridad referencial.";
        setError(detalles);
        if (data.action === "BLOCK") {
          toast.error("Operación denegada por reglas de integridad", { duration: 8000 });
        } else {
          toast.error("Atención requerida", { duration: 4000 });
        }
      } else {
        const msg = data.message || data.error || "Error al conectar con el servidor.";
        setError(msg);
        toast.error(isEditing ? "No se pudo actualizar el espacio" : "No se pudo registrar el espacio");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10">
        <button
          onClick={onBack}
          className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white">
            {isEditing ? "Modificar espacio académico" : "Nuevo espacio académico"}
          </h2>
          <p className="text-sm text-white/60 font-medium">
            Define la capacidad, tipo y ubicación del aula o laboratorio.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {error && serverAction !== 'WARN' && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 border mb-8 ${serverAction === 'BLOCK' ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-red-50 text-red-700 border-red-100/50'}`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-bold text-sm leading-snug">{error}</p>
            </div>
          )}

          {serverAction === 'WARN' && (
            <div className="p-5 bg-red-50 text-red-900 rounded-2xl flex items-start gap-3 border border-red-200 mb-8 shadow-sm">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-red-600" />
              <p className="font-bold text-sm leading-snug">{error}</p>
            </div>
          )}

          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-8 w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-10">
            {/* Sección 1: Datos Base */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Identificación del Espacio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Home className="w-4 h-4 mr-2 text-blue-500" /> Nombre / Código <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nombre" 
                    value={formData.nombre} 
                    onChange={handleChange} 
                    required 
                    placeholder="Ej. A-101 o Lab. Cómputo 1"
                    maxLength={50}
                    className={inputBaseClass}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Home className="w-4 h-4 mr-2 opacity-0" /> Tipo <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <select 
                    name="tipo" 
                    value={formData.tipo} 
                    onChange={handleChange}
                    className={`${inputBaseClass} appearance-none cursor-pointer`}
                  >
                    <option value="AULA">Aula</option>
                    <option value="LABORATORIO">Laboratorio</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección 2: Detalles Logísticos */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Capacidad y Logística</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    Capacidad Máxima <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    name="capacidad" 
                    value={formData.capacidad} 
                    onChange={handleChange} 
                    required 
                    placeholder="Ej. 40"
                    maxLength={3}
                    className={inputBaseClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    Edificio / Ubicación <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <select 
                    name="ubicacion" 
                    value={formData.ubicacion} 
                    onChange={handleChange} 
                    required
                    className={`${inputBaseClass} appearance-none cursor-pointer`}
                  >
                    <option value="" disabled>Selecciona un edificio...</option>
                    {ubicacionesFinales.map((edificio) => (
                      <option key={edificio} value={edificio}>
                        {edificio}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Sección 3: Opciones (Edición solamente) */}
            {isEditing && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Operatividad</h3>
                <div className="space-y-2 max-w-sm">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    Estatus
                  </label>
                  <select 
                    name="estatus" 
                    value={formData.estatus} 
                    onChange={handleChange}
                    className={`${inputBaseClass} appearance-none cursor-pointer`}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="MANTENIMIENTO">En Mantenimiento</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-8 border-t border-dashed border-slate-200 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg ${
                  isSubmitting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300"
                    : serverAction === 'WARN' 
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-xl hover:shadow-red-600/30 active:scale-[0.98]"
                      : "bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
                }`}
              >
                {isSubmitting
                  ? <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  : isEditing 
                    ? <RefreshCw className="w-6 h-6 mr-2 text-white" />
                    : <Save className="w-6 h-6 mr-2 text-white" />
                }
                {isSubmitting
                  ? "Procesando..."
                  : serverAction === 'WARN' ? "Confirmar y Rechazar Clases" 
                  : isEditing ? "Actualizar Espacio" : "Registrar Espacio"
                }
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
};
