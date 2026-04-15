import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, BookOpen, UserCheck, FileText, Loader2, Save, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// ── Helper: construye el nombre completo de un coordinador de forma segura ──
// Cubre dos escenarios:
//   1. Objeto con campos separados (respuesta normal de /coordinadores-disponibles)
//   2. Objeto inyectado en modo edición donde "nombres" ya trae el nombre completo
//      concatenado (coordinador_nombre del listado de academias) y apellido_paterno
//      llega vacío para evitar duplicados.
const getNombreCompleto = (c) => {
  const partes = [c.nombres, c.apellido_paterno, c.apellido_materno]
    .map(p => (p || '').trim())
    .filter(Boolean);
  return partes.join(' ');
};

export const AltaAcademia = ({ academiaToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const isEditing = !!academiaToEdit;

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    usuario_id: '',
  });

  const [coordinadores, setCoordinadores] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCoordinadores, setIsLoadingCoordinadores] = useState(true);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Cargar datos si estamos en modo edición
  useEffect(() => {
    if (academiaToEdit) {
      setFormData({
        nombre: academiaToEdit.nombre || '',
        descripcion: academiaToEdit.descripcion || '',
        usuario_id: academiaToEdit.usuario_id || '',
      });
    }
  }, [academiaToEdit]);

  // Detección de cambios (Dirty State) para habilitar/deshabilitar el botón de guardado
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

  // Cargar coordinadores disponibles
  useEffect(() => {
    const fetchCoordinadores = async () => {
      try {
        setIsLoadingCoordinadores(true);
        const response = await api.get('/academias/coordinadores-disponibles');
        let data = response.data;

        // Si estamos editando, el coordinador actual podría no estar en la lista de
        // "disponibles" (p. ej. si ya coordina otra academia). Lo inyectamos manualmente
        // para que el select no quede en blanco.
        // Usamos coordinador_nombre (nombre completo ya concatenado desde el backend)
        // en el campo "nombres" y dejamos los apellidos vacíos para que el helper
        // getNombreCompleto no duplique partes del nombre.
        if (isEditing && academiaToEdit?.usuario_id) {
          const exists = data.find(
            c => String(c.id_usuario) === String(academiaToEdit.usuario_id)
          );
          if (!exists) {
            data = [
              {
                id_usuario: academiaToEdit.usuario_id,
                nombres: academiaToEdit.coordinador_nombre || '',
                apellido_paterno: '',
                apellido_materno: '',
              },
              ...data,
            ];
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'nombre') {
      // Solo letras y espacios
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;
      if (!regex.test(value)) return;

      setFormData(prev => ({
        ...prev,
        // Evitar múltiples espacios consecutivos o al inicio
        nombre: value.replace(/^\s+/g, '').replace(/\s{2,}/g, ' '),
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreLimpio = formData.nombre.trim();

    if (!nombreLimpio) {
      toast.error('El nombre no puede estar vacío.');
      return;
    }

    if (!formData.usuario_id) {
      toast.error('Seleccione un coordinador institucional.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? 'Guardando cambios...' : 'Registrando academia...');

    try {
      if (isEditing) {
        await api.put(`/academias/${academiaToEdit.id_academia}`, {
          ...formData,
          nombre: nombreLimpio,
          modificado_por: user.id_usuario,
        });
        toast.success('Academia actualizada correctamente', { id: toastId });
      } else {
        await api.post('/academias/registrar', {
          ...formData,
          nombre: nombreLimpio,
          creado_por: user.id_usuario,
        });
        toast.success('Academia registrada correctamente', { id: toastId });
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      if (status === 409) {
        toast.error(errorData.error || 'El nombre de la academia ya existe.', { id: toastId, duration: 5000 });
      } else {
        toast.error(
          errorData.error || `Error de servidor al ${isEditing ? 'actualizar' : 'registrar'} la academia.`,
          { id: toastId }
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se deshabilita si está cargando, si faltan campos obligatorios o si no hay cambios en modo edición
  const isSubmitDisabled =
    isSubmitting ||
    isLoadingCoordinadores ||
    !formData.nombre.trim() ||
    !formData.usuario_id ||
    (!isFormDirty && isEditing);

  const inputBaseClass =
    "w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828] transition-all text-[#0B1828] font-medium shadow-sm outline-none";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">

      {/* Encabezado Principal */}
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
            {isEditing
              ? "Actualiza los datos de la academia."
              : "Completa los datos de la nueva academia."}
          </p>
        </div>
      </div>

      <div className="p-6 md:p-10">
        <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto">

          {/* Banner de Campos Obligatorios */}
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-8 w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span>
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-10">
            {/* Sección 1: Datos de la Academia */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">
                Datos Generales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <BookOpen className="w-4 h-4 mr-2" /> Nombre de la Academia{' '}
                    <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    maxLength="70"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="EJ. INGENIERÍA DE SOFTWARE"
                    required
                    className={inputBaseClass}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <UserCheck className="w-4 h-4 mr-2" /> Coordinador{' '}
                    <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <select
                    name="usuario_id"
                    value={formData.usuario_id}
                    onChange={handleChange}
                    required
                    disabled={isLoadingCoordinadores}
                    className={`${inputBaseClass} appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    <option value="" disabled>
                      {isLoadingCoordinadores ? 'CARGANDO COORDINADORES...' : 'SELECCIONE UN COORDINADOR'}
                    </option>
                    {/* ── Nombre completo usando el helper: nombres + apellido_paterno + apellido_materno ── */}
                    {coordinadores.map(c => (
                      <option key={c.id_usuario} value={c.id_usuario}>
                        {getNombreCompleto(c)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <FileText className="w-4 h-4 mr-2" /> Descripción (Opcional)
                  </label>
                  <textarea
                    name="descripcion"
                    maxLength="500"
                    rows={3}
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="DESCRIPCIÓN BREVE DE LA ACADEMIA."
                    className={`${inputBaseClass} resize-none`}
                  />
                </div>
              </div>
            </div>

            {/* Footer Submit */}
            <div className="pt-8 border-t border-dashed border-slate-200 mt-2">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg ${
                  isSubmitDisabled
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
                  ? "Guardando..."
                  : isEditing
                  ? "Modificar Academia"
                  : "Nueva Academia"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};