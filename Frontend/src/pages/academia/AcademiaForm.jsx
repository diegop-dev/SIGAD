import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, UserCheck, FileText, Loader2, Save, RefreshCw, Info } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { REGEX } from '../../utils/regex';
import { formatToGlobalUppercase } from '../../utils/textFormatter';

// Helper para construir el nombre completo de un coordinador de forma segura
const getNombreCompleto = (c) => {
  const partes = [c.nombres, c.apellido_paterno, c.apellido_materno]
    .map(p => (p || '').trim())
    .filter(Boolean);
  return partes.join(' ');
};

export const AcademiaForm = ({ academiaToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!academiaToEdit;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCoordinadores, setIsLoadingCoordinadores] = useState(true);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [errores, setErrores] = useState({});

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    usuario_id: '',
  });

  const [coordinadores, setCoordinadores] = useState([]);

  // 1. Cargar datos en modo edición
  useEffect(() => {
    if (academiaToEdit) {
      setFormData({
        nombre: academiaToEdit.nombre || '',
        descripcion: academiaToEdit.descripcion || '',
        usuario_id: academiaToEdit.usuario_id || '',
      });
    }
  }, [academiaToEdit]);

  // 2. Cargar lista de coordinadores (Lógica idéntica a la original pero integrada)
  useEffect(() => {
    const fetchCoordinadores = async () => {
      try {
        setIsLoadingCoordinadores(true);
        const response = await api.get('/academias/coordinadores-disponibles');
        let data = response.data;

        if (isEditing && academiaToEdit?.usuario_id) {
          const exists = data.find(c => String(c.id_usuario) === String(academiaToEdit.usuario_id));
          if (!exists) {
            data = [{
              id_usuario: academiaToEdit.usuario_id,
              nombres: academiaToEdit.coordinador_nombre || '',
              apellido_paterno: '',
              apellido_materno: '',
            }, ...data];
          }
        }
        setCoordinadores(data);
      } catch {
        toast.error('Error al cargar la lista de coordinadores.');
      } finally {
        setIsLoadingCoordinadores(false);
      }
    };
    fetchCoordinadores();
  }, [isEditing, academiaToEdit]);

  // 3. Detección de cambios (Dirty State)
  useEffect(() => {
    if (!isEditing) {
      setIsFormDirty(true);
      return;
    }
    const hasChanged =
      formData.nombre !== academiaToEdit.nombre ||
      formData.descripcion !== (academiaToEdit.descripcion || '') ||
      String(formData.usuario_id) !== String(academiaToEdit.usuario_id);
    setIsFormDirty(hasChanged);
  }, [formData, academiaToEdit, isEditing]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const formattedValue = formatToGlobalUppercase(value, name, type);
    let sanitizedValue = formattedValue;

    if (name === 'nombre') {
      // Solo letras y espacios, sin espacios al inicio ni dobles espacios
      const clean = sanitizedValue
        .replace(/^\s+/g, '')
        .replace(/\s{2,}/g, ' ');
      if (clean !== '' && !REGEX.LETRAS_Y_ESPACIOS.test(clean)) return;
      // Bloquear triple letra consecutiva
      if (REGEX.TRIPLE_LETRA_REPETIDA.test(clean)) return;
      sanitizedValue = clean.toUpperCase();
    }

    if (name === 'descripcion') {
      // Limpiar espacios iniciales dobles en el textarea
      sanitizedValue = sanitizedValue
        .replace(/^\s+/g, '')
        .replace(/\s{3,}/g, '  '); // Máximo 2 espacios/saltos consecutivos
    }

    setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    
    const errorMsg = validateField(name, sanitizedValue);
    setErrores(prev => {
      const newE = { ...prev };
      if (errorMsg) newE[name] = errorMsg;
      else delete newE[name];
      return newE;
    });
  };

  const validateField = (name, value) => {
    const valStr = (value || '').toString().trim();
    if (name === 'nombre') {
      if (!valStr) return "El nombre de la academia es obligatorio.";
      if (valStr.length < 3) return "El nombre debe tener al menos 3 caracteres.";
      if (!REGEX.LETRAS_Y_ESPACIOS.test(valStr)) return "El nombre solo puede contener letras y espacios.";
      if (REGEX.TRIPLE_LETRA_REPETIDA.test(valStr)) return "El nombre no puede contener tres o más letras iguales consecutivas.";
    }
    if (name === 'descripcion') {
      if (valStr.length > 0 && valStr.length < 10) return "La descripción debe tener al menos 10 caracteres o dejarse en blanco.";
    }
    if (name === 'usuario_id') {
      if (!valStr) return "Debe asignar un coordinador.";
    }
    return null;
  };

  const validateForm = () => {
    const newErrors = {};
    
    const errNombre = validateField('nombre', formData.nombre);
    if (errNombre) newErrors.nombre = errNombre;

    const errDesc = validateField('descripcion', formData.descripcion);
    if (errDesc) newErrors.descripcion = errDesc;

    const errUser = validateField('usuario_id', formData.usuario_id);
    if (errUser) newErrors.usuario_id = errUser;

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? 'Actualizando academia...' : 'Registrando academia...');

    try {
      const payload = {
        ...formData,
        nombre: formData.nombre.trim(),
        [isEditing ? 'modificado_por' : 'creado_por']: user.id_usuario
      };

      if (isEditing) {
        await api.put(`/academias/${academiaToEdit.id_academia}`, payload);
        toast.success('Academia actualizada con éxito', { id: toastId });
      } else {
        await api.post('/academias/registrar', payload);
        toast.success('Academia registrada con éxito', { id: toastId });
      }
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error de conexión con el servidor.";
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      
      {/* Header Estilo Usuarios */}
      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10">
        <button
          onClick={onBack}
          className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white">
            {isEditing ? "Modificar academia" : "Nueva academia"}
          </h2>
          <p className="text-sm text-white/60 font-medium">
            Define el nombre, descripción y el docente responsable de la coordinación.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto">
          
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-8 w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-10">
            {/* Sección 1: Identificación */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2 flex items-center">
                <Info className="w-5 h-5 mr-2 text-slate-400" />
                Información General
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <BookOpen className="w-4 h-4 mr-2" /> Nombre de la academia <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nombre" 
                    maxLength="70"
                    value={formData.nombre} 
                    onChange={handleChange} 
                    placeholder="EJ. CIENCIAS BÁSICAS"
                    className={`${inputBaseClass} ${getValidationClass(errores.nombre)}`}
                  />
                  {errores.nombre && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nombre}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <UserCheck className="w-4 h-4 mr-2" /> Coordinador asignado <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <select 
                    name="usuario_id" 
                    value={formData.usuario_id} 
                    onChange={handleChange} 
                    disabled={isLoadingCoordinadores}
                    className={`${inputBaseClass} ${getValidationClass(errores.usuario_id)} appearance-none cursor-pointer disabled:bg-slate-50 disabled:text-slate-400`}
                  >
                    <option value="" disabled>
                      {isLoadingCoordinadores ? 'Cargando personal...' : 'Seleccione un docente'}
                    </option>
                    {coordinadores.map(c => (
                      <option key={c.id_usuario} value={c.id_usuario}>
                        {getNombreCompleto(c)}
                      </option>
                    ))}
                  </select>
                  {errores.usuario_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.usuario_id}</p>}
                </div>
              </div>
            </div>

            {/* Sección 2: Detalle */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-slate-400" />
                Descripción del área
              </h3>
              <div className="space-y-2">
                <textarea 
                  name="descripcion" 
                  maxLength="500"
                  rows={4}
                  value={formData.descripcion} 
                  onChange={handleChange} 
                  placeholder="Detalles adicionales sobre los objetivos o funciones de esta academia..."
                  className={`${inputBaseClass} ${getValidationClass(errores.descripcion)} resize-none`}
                />
                <div className="flex justify-between items-center mt-1.5">
                  {errores.descripcion
                    ? <p className="text-xs font-bold text-red-500">{errores.descripcion}</p>
                    : <span />
                  }
                  <p className="text-xs font-medium text-slate-500 text-right">
                    {formData.descripcion.length} / 500 caracteres
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de Acción */}
            <div className="pt-8 border-t border-dashed border-slate-200 mt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isFormDirty || Object.keys(errores).length > 0}
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg ${
                  (isSubmitting || !isFormDirty || Object.keys(errores).length > 0)
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300"
                    : "bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                ) : isEditing ? (
                  <RefreshCw className="w-6 h-6 mr-2 text-white" />
                ) : (
                  <Save className="w-6 h-6 mr-2 text-white" />
                )}
                {isSubmitting
                  ? "Guardando cambios..."
                  : isEditing ? "Actualizar Academia" : "Registrar Academia"
                }
              </button>
            </div>
            
          </div>
        </form>
      </div>
    </div>
  );
};