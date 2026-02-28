import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, User, RefreshCw, Copy, CheckCircle } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const UserForm = ({ userToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Nuevo estado para atrapar y mostrar la contraseña generada
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const isEditing = !!userToEdit;

  const defaultRole = user?.rol_id === 1 ? 1 : 3;

  const [formData, setFormData] = useState({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    personal_email: "",
    institutional_email: "",
    password_raw: "", // Solo se usará en edición
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
        rol_id: userToEdit.rol_id || defaultRole,
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
    if (e.key === ' ') e.preventDefault();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (['nombres', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      sanitizedValue = sanitizedValue
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '') 
        .replace(/\t/g, '') 
        .replace(/\s{2,}/g, ' '); 
    } else if (['personal_email', 'institutional_email'].includes(name)) {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9@._-]/g, ''); 
    } else if (name === 'password_raw') {
      sanitizedValue = sanitizedValue.replace(/\s/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let finalValue = value.trim();

    if (['personal_email', 'institutional_email'].includes(name)) {
      finalValue = finalValue.toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(formData.personal_email)) {
      toast.error("El correo personal no tiene un formato válido.");
      return false;
    }
    if (!emailRegex.test(formData.institutional_email)) {
      toast.error("El correo institucional no tiene un formato válido.");
      return false;
    }

    if (formData.nombres.length < 2 || formData.apellido_paterno.length < 2 || formData.apellido_materno.length < 2) {
      toast.error("Los nombres y apellidos deben tener al menos 2 caracteres.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const loadingMessage = isEditing ? "Actualizando usuario..." : "Registrando usuario...";
    const toastId = toast.loading(loadingMessage);

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        // En creación ya no enviamos password_raw. En edición, solo si el admin escribe algo.
        if (key === 'password_raw' && (!isEditing || formData.password_raw === '')) {
          return; 
        }
        if (formData[key] !== null) {
          form.append(key, formData[key]);
        }
      });

      if (isEditing) {
        form.append("modificado_por", user.id_usuario);
        await api.put(`/users/${userToEdit.id_usuario}`, form);
        toast.success("Usuario actualizado exitosamente", { id: toastId });
        onSuccess(); // Si es edición, terminamos directo
      } else {
        form.append("creado_por", user.id_usuario);
        const response = await api.post("/users/register", form);
        toast.success("Usuario registrado exitosamente", { id: toastId });
        
        // Atrapamos la contraseña generada en lugar de cerrar el formulario
        if (response.data && response.data.password_temporal) {
          setGeneratedPassword(response.data.password_temporal);
        } else {
          onSuccess(); // Por si acaso no viene la contraseña, cerramos normal.
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al conectar con el servidor";
      toast.error(`Error: ${errorMsg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success("Contraseña copiada al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  // Renderizado del Modal de Contraseña Generada
  if (generatedPassword) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 text-center max-w-lg mx-auto">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">¡Usuario registrado!</h2>
          <p className="text-slate-600 font-medium mb-8">
            El sistema ha generado una contraseña temporal segura para este usuario. Cópiala y entrégala; el sistema le exigirá cambiarla en su primer inicio de sesión.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 relative group">
            <span className="block text-sm text-slate-500 font-bold mb-2">Contraseña generada:</span>
            <code className="text-3xl font-mono font-bold text-slate-900 tracking-wider">
              {generatedPassword}
            </code>
            <button 
              onClick={handleCopyPassword}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all focus:ring-2 focus:ring-blue-100"
              title="Copiar contraseña"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={() => onSuccess()}
            className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-emerald-200"
          >
            Entendido, volver al listado
          </button>
        </div>
      </div>
    );
  }

  // Renderizado Normal del Formulario
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
        
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Nombres *</label>
            <input 
              type="text" 
              name="nombres" 
              required 
              minLength="2"
              maxLength="50"
              value={formData.nombres} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Apellido paterno *</label>
            <input 
              type="text" 
              name="apellido_paterno" 
              required 
              minLength="2"
              maxLength="50"
              value={formData.apellido_paterno} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Apellido materno *</label>
            <input 
              type="text" 
              name="apellido_materno" 
              required 
              minLength="2"
              maxLength="50"
              value={formData.apellido_materno} 
              onChange={handleChange} 
              onBlur={handleBlur}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
        </div>

        {/* Correos */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Correo personal *</label>
            <input 
              type="email" 
              name="personal_email" 
              required 
              maxLength="254"
              value={formData.personal_email} 
              onChange={handleChange} 
              onBlur={handleBlur}
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
              maxLength="254"
              value={formData.institutional_email} 
              onChange={handleChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDownStrict}
              className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
            />
          </div>
        </div>

        {/* Roles y Contraseña (Dinámico) */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          
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

          {/* Solo mostramos el campo de contraseña manual si estamos Editando */}
          {isEditing && (
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Forzar nueva contraseña (Opcional)
              </label>
              <input 
                type="text" 
                name="password_raw" 
                minLength="8" 
                maxLength="50"
                value={formData.password_raw} 
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDownStrict}
                className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 sm:text-base py-3 px-4 transition-colors placeholder:text-slate-400" 
                placeholder="Dejar en blanco para conservar la actual" 
              />
              <p className="mt-1.5 text-xs text-amber-600 font-medium">
                Nota: Si escribes una contraseña, el usuario será obligado a cambiarla al iniciar sesión.
              </p>
            </div>
          )}
        </div>

        {/* Foto de perfil */}
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

        {/* Submit */}
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
