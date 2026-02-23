import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, User } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const UserForm = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [formData, setFormData] = useState({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    personal_email: "",
    institutional_email: "",
    password_raw: "",
    rol_id: 1, 
    foto_perfil_url: null,
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, foto_perfil_url: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Función para interceptar la barra espaciadora
  const handleKeyDownStrict = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Validación de Nombres y Apellidos: Solo letras, acentos y un espacio entre palabras
    if (['nombres', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      sanitizedValue = sanitizedValue
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') // Elimina números y caracteres especiales
        .replace(/\t/g, '') // Bloquea tabulaciones
        .replace(/\s{2,}/g, ' '); // Convierte múltiples espacios en uno solo
    } 
    // Validación estricta de Correos: Solo letras, números, @, punto, guion y guion bajo
    else if (['personal_email', 'institutional_email'].includes(name)) {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9@._-]/g, ''); 
    }
    // Validación de Contraseña: Permite símbolos de seguridad, pero bloquea espacios
    else if (name === 'password_raw') {
      sanitizedValue = sanitizedValue.replace(/\s/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Registrando usuario...");

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          const finalValue = typeof formData[key] === 'string' ? formData[key].trim() : formData[key];
          form.append(key, finalValue);
        }
      });
      form.append("creado_por", user.id_usuario);

      await api.post("/users/register", form);
      toast.success("Usuario registrado exitosamente", { id: toastId });
      onSuccess(); 
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al conectar con el servidor";
      toast.error(`Error: ${errorMsg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Registrar nuevo usuario
        </h2>
        <button
          onClick={onBack}
          className="flex items-center text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Regresar al listado
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Nombres *</label>
            <input 
              type="text" 
              name="nombres" 
              required 
              value={formData.nombres} 
              onChange={handleChange} 
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Apellido paterno *</label>
            <input 
              type="text" 
              name="apellido_paterno" 
              required 
              value={formData.apellido_paterno} 
              onChange={handleChange} 
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Apellido materno *</label>
            <input 
              type="text" 
              name="apellido_materno" 
              required 
              value={formData.apellido_materno} 
              onChange={handleChange} 
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Correo personal *</label>
            <input 
              type="email" 
              name="personal_email" 
              required 
              value={formData.personal_email} 
              onChange={handleChange} 
              onKeyDown={handleKeyDownStrict}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Correo institucional *</label>
            <input 
              type="email" 
              name="institutional_email" 
              required 
              value={formData.institutional_email} 
              onChange={handleChange}
              onKeyDown={handleKeyDownStrict}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Contraseña temporal *</label>
            <input 
              type="text" 
              name="password_raw" 
              required 
              minLength="8" 
              value={formData.password_raw} 
              onChange={handleChange}
              onKeyDown={handleKeyDownStrict}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
              placeholder="Mínimo 8 caracteres" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Rol del sistema *</label>
            <select 
              name="rol_id" 
              value={formData.rol_id} 
              onChange={handleChange} 
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors appearance-none cursor-pointer"
            >
              {user?.rol_id === 1 && <option value="1">Superadministrador</option>}
              {user?.rol_id === 1 && <option value="2">Administrador</option>}
              <option value="3">Docente</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-800 mb-4">Fotografía de perfil (Opcional)</label>
          <div className="flex items-center space-x-8">
            <div className="h-32 w-32 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-300 flex items-center justify-center shrink-0 shadow-md">
              {previewUrl ? (
                <img src={previewUrl} alt="Previsualización" className="h-full w-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-slate-400" />
              )}
            </div>
            
            <div className="relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="block w-full text-slate-600
                  file:mr-4 file:py-3 file:px-6
                  file:rounded-xl file:border-0
                  file:text-sm file:font-bold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100 cursor-pointer transition-colors"
              />
              <p className="mt-2 text-xs text-slate-500 font-medium">Formatos soportados: JPG, PNG, WEBP (Max: 10MB)</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-8 py-3 bg-blue-600 rounded-xl shadow-md text-base font-bold text-white hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? "Guardando..." : "Guardar usuario"}
          </button>
        </div>
      </form>
    </div>
  );
};
