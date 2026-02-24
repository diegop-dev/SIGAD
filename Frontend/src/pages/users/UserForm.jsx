import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, User, RefreshCw } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const UserForm = ({ userToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const isEditing = !!userToEdit;

  // El valor por defecto al crear depende del rol del usuario actual
  const defaultRole = user?.rol_id === 1 ? 1 : 3;

  const [formData, setFormData] = useState({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    personal_email: "",
    institutional_email: "",
    password_raw: "",
    rol_id: defaultRole, 
    foto_perfil_url: null,
  });

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        nombres: userToEdit.nombres || "",
        apellido_paterno: userToEdit.apellido_paterno || "",
        apellido_materno: userToEdit.apellido_materno || "",
        personal_email: userToEdit.personal_email || "",
        institutional_email: userToEdit.institutional_email || "",
        password_raw: "", 
        rol_id: userToEdit.rol_id || defaultRole, // Prioridad al rol que trae de BD
        foto_perfil_url: null, 
      });

      if (userToEdit.foto_perfil_url) {
        const API_BASE = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace('/api', '') 
          : 'http://localhost:3000';
        setPreviewUrl(`${API_BASE}${userToEdit.foto_perfil_url}`);
      }
    }
  }, [userToEdit, defaultRole]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
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

  const handleKeyDownStrict = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (['nombres', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      sanitizedValue = sanitizedValue
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '') 
        .replace(/\t/g, '') 
        .replace(/\s{2,}/g, ' '); 
    } 
    else if (['personal_email', 'institutional_email'].includes(name)) {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9@._-]/g, ''); 
    }
    else if (name === 'password_raw') {
      sanitizedValue = sanitizedValue.replace(/\s/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const loadingMessage = isEditing ? "Actualizando usuario..." : "Registrando usuario...";
    const toastId = toast.loading(loadingMessage);

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'password_raw' && isEditing && formData.password_raw === '') {
          return; 
        }

        if (formData[key] !== null) {
          const finalValue = typeof formData[key] === 'string' ? formData[key].trim() : formData[key];
          form.append(key, finalValue);
        }
      });

      if (isEditing) {
        form.append("modificado_por", user.id_usuario);
        await api.put(`/users/${userToEdit.id_usuario}`, form);
        toast.success("Usuario actualizado exitosamente", { id: toastId });
      } else {
        form.append("creado_por", user.id_usuario);
        await api.post("/users/register", form);
        toast.success("Usuario registrado exitosamente", { id: toastId });
      }
      
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
          {isEditing ? "Modificar expediente de usuario" : "Registrar nuevo usuario"}
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
            <label className="block text-sm font-bold text-slate-800 mb-2">
              Contraseña {isEditing ? "(Opcional)" : "temporal *"}
            </label>
            <input 
              type="text" 
              name="password_raw" 
              required={!isEditing}
              minLength="8" 
              value={formData.password_raw} 
              onChange={handleChange}
              onKeyDown={handleKeyDownStrict}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
              placeholder={isEditing ? "Dejar en blanco para conservar la actual" : "Mínimo 8 caracteres"} 
            />
            {isEditing && (
              <p className="mt-1.5 text-xs text-amber-600 font-medium">
                Nota: Si escribes una contraseña, el usuario será obligado a cambiarla al iniciar sesión.
              </p>
            )}
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
            className={`flex items-center px-8 py-3 rounded-xl shadow-md text-base font-bold text-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              isEditing ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-200" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-200"
            }`}
          >
            {isEditing ? <RefreshCw className="w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isSubmitting 
              ? (isEditing ? "Actualizando..." : "Guardando...") 
              : (isEditing ? "Actualizar usuario" : "Guardar usuario")
            }
          </button>
        </div>
      </form>
    </div>
  );
};
