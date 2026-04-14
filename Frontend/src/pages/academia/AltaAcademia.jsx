import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle, X, BookOpen, UserCheck, FileText, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export const AltaAcademia = ({ onBack, onSuccess }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    usuario_id: '',
  });

  const [coordinadores, setCoordinadores] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoadingCoordinadores, setIsLoadingCoordinadores] = useState(true);

  useEffect(() => {
    const fetchCoordinadores = async () => {
      try {
        setIsLoadingCoordinadores(true);
        const response = await api.get('/academias/coordinadores-disponibles');
        setCoordinadores(response.data);
      } catch {
        toast.error('Error al cargar coordinadores.');
      } finally {
        setIsLoadingCoordinadores(false);
      }
    };
    fetchCoordinadores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'nombre') {
      // Solo letras y espacios (SIN números)
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/;

      // Bloquea caracteres inválidos SIN mostrar toast
      if (!regex.test(value)) {
        return;
      }

      setFormData(prev => ({
        ...prev,
        nombre: value.replace(/\s+/g, ' '),
      }));

      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarNombreUnico = async () => {
    try {
      const response = await api.get(
        `/academias/validar-nombre/${encodeURIComponent(formData.nombre)}`
      );
      return response.data.existe;
    } catch {
      return null;
    }
  };

  const handleOpenModal = async (e) => {
    e.preventDefault();

    const nombreLimpio = formData.nombre.trim();

    // Validar vacío o solo espacios
    if (!nombreLimpio) {
      toast.error('El nombre no puede estar vacío.');
      return;
    }

    // Validar solo letras
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    if (!regex.test(nombreLimpio)) {
      toast.error('El nombre solo puede contener letras.');
      return;
    }

    if (!formData.usuario_id) {
      toast.error('Seleccione un coordinador.');
      return;
    }

    const toastId = toast.loading('Verificando disponibilidad...');
    const existe = await validarNombreUnico();
    toast.dismiss(toastId);
    
    if (existe) {
      toast.error('El nombre de la academia ya existe.');
      return;
    }

    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowModal(false);
    const toastId = toast.loading('Registrando academia...');
    try {
      await api.post('/academias/registrar', {
        ...formData,
        creado_por: user.id_usuario,
      });
      toast.success('Academia registrada correctamente', { id: toastId });
      if (onSuccess) onSuccess();
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data || {};

      if (status === 409) {
        toast.error(errorData.error || 'El nombre ya está registrado.', { id: toastId, duration: 5000 });
      } else {
        toast.error(errorData.error || 'Error de servidor al registrar la academia.', { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-800">Registrar nueva academia</h2>
          <p className="text-sm text-slate-500 font-medium">
            Completa los datos del nuevo programa académico.
          </p>
        </div>
      </div>

      <div className="p-6 md:p-8">
        <form onSubmit={handleOpenModal} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <BookOpen className="w-4 h-4 mr-2 text-blue-500" /> Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                maxLength="70"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Academia de Matemáticas"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <UserCheck className="w-4 h-4 mr-2 text-blue-500" /> Coordinador *
              </label>
              <select
                name="usuario_id"
                value={formData.usuario_id}
                onChange={handleChange}
                required
                disabled={isLoadingCoordinadores}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all disabled:opacity-60 cursor-pointer"
              >
                <option value="">
                  {isLoadingCoordinadores ? 'Cargando...' : 'Seleccione un coordinador'}
                </option>
                {coordinadores.map(c => (
                  <option key={c.id_usuario} value={c.id_usuario}>
                    {c.nombres} {c.apellido_paterno}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <FileText className="w-4 h-4 mr-2 text-blue-500" /> Descripción
              </label>
              <textarea
                name="descripcion"
                maxLength="500"
                rows={3}
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Descripción opcional de la academia..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSubmitting || isLoadingCoordinadores}
              className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
            >
              {isSubmitting
                ? <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                : <CheckCircle className="w-5 h-5 mr-2" />}
              Guardar academia
            </button>
          </div>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-800">Confirmar registro</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-2 text-sm text-slate-600">
              <p><span className="font-bold text-slate-800">Nombre:</span> {formData.nombre}</p>
              <p><span className="font-bold text-slate-800">Descripción:</span> {formData.descripcion || 'N/A'}</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};