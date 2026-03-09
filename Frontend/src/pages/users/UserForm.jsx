import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, User, RefreshCw, Copy, CheckCircle, Mail, KeyRound, Shield, ImagePlus, Loader2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";

export const UserForm = ({ userToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errores, setErrores] = useState({});
  
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
    if (errores[name]) setErrores({ ...errores, [name]: null });
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let finalValue = value.trim();

    if (['personal_email', 'institutional_email'].includes(name)) {
      finalValue = finalValue.toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  // Validación manual reactiva para reemplazar el comportamiento del navegador
  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.nombres.trim()) newErrors.nombres = "El nombre es obligatorio";
    else if (formData.nombres.length < 2) newErrors.nombres = "Debe tener al menos 2 caracteres";

    if (!formData.apellido_paterno.trim()) newErrors.apellido_paterno = "El apellido paterno es obligatorio";
    else if (formData.apellido_paterno.length < 2) newErrors.apellido_paterno = "Debe tener al menos 2 caracteres";

    if (!formData.apellido_materno.trim()) newErrors.apellido_materno = "El apellido materno es obligatorio";
    else if (formData.apellido_materno.length < 2) newErrors.apellido_materno = "Debe tener al menos 2 caracteres";

    if (!formData.personal_email.trim()) newErrors.personal_email = "El correo personal es obligatorio";
    else if (!emailRegex.test(formData.personal_email)) newErrors.personal_email = "Formato de correo inválido";

    if (!formData.institutional_email.trim()) newErrors.institutional_email = "El correo institucional es obligatorio";
    else if (!emailRegex.test(formData.institutional_email)) newErrors.institutional_email = "Formato de correo inválido";

    if (isEditing && formData.password_raw && formData.password_raw.length < 8) {
      newErrors.password_raw = "La nueva contraseña debe tener al menos 8 caracteres";
    }

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor, corrige los campos señalados en rojo.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(isEditing ? "Actualizando expediente..." : "Registrando usuario...");

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
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
        onSuccess(); 
      } else {
        form.append("creado_por", user.id_usuario);
        const response = await api.post("/users/register", form);
        toast.success("Usuario registrado exitosamente", { id: toastId });
        
        if (response.data && response.data.password_temporal) {
          setGeneratedPassword(response.data.password_temporal);
        } else {
          onSuccess(); 
        }
      }
    } catch (error) {
      if (error.response?.data?.errores) {
        const backendErrors = {};
        error.response.data.errores.forEach(err => {
          backendErrors[err.path || err.param] = err.msg;
        });
        setErrores(backendErrors);
        toast.error("El servidor rechazó algunos datos. Revisa el formulario.", { id: toastId });
      } else {
        const errorMsg = error.response?.data?.error || "Error al conectar con el servidor";
        toast.error(`Error: ${errorMsg}`, { id: toastId });
      }
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
            <span className="block text-sm text-slate-500 font-bold mb-2">Contraseña temporal:</span>
            <code className="text-3xl font-mono font-black text-slate-900 tracking-wider">
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditing ? "Modificar expediente de usuario" : "Registrar nuevo usuario"}
            </h2>
            <p className="text-sm text-slate-500 font-medium">Define los datos personales, correos y rol de acceso.</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Se añadió noValidate para desactivar los tooltips nativos del navegador */}
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className={`flex items-center text-sm font-bold ${errores.nombres ? 'text-red-600' : 'text-slate-700'}`}>
                <User className={`w-4 h-4 mr-2 ${errores.nombres ? 'text-red-500' : 'text-blue-500'}`} /> Nombres *
              </label>
              <input 
                type="text" 
                name="nombres" 
                maxLength="50"
                value={formData.nombres} 
                onChange={handleChange} 
                onBlur={handleBlur}
                placeholder="Ej. Juan Carlos"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.nombres ? "border-red-300 focus:ring-red-100 bg-red-50/30" : "border-slate-300 focus:ring-blue-100"
                }`} 
              />
              {errores.nombres && <p className="text-xs font-bold text-red-500 mt-1">{errores.nombres}</p>}
            </div>
            
            <div className="space-y-2">
              <label className={`flex items-center text-sm font-bold ${errores.apellido_paterno ? 'text-red-600' : 'text-slate-700'}`}>
                <User className="w-4 h-4 mr-2 opacity-0" /> Apellido paterno *
              </label>
              <input 
                type="text" 
                name="apellido_paterno" 
                maxLength="50"
                value={formData.apellido_paterno} 
                onChange={handleChange} 
                onBlur={handleBlur}
                placeholder="Ej. Pérez"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.apellido_paterno ? "border-red-300 focus:ring-red-100 bg-red-50/30" : "border-slate-300 focus:ring-blue-100"
                }`} 
              />
              {errores.apellido_paterno && <p className="text-xs font-bold text-red-500 mt-1">{errores.apellido_paterno}</p>}
            </div>
            
            <div className="space-y-2">
              <label className={`flex items-center text-sm font-bold ${errores.apellido_materno ? 'text-red-600' : 'text-slate-700'}`}>
                <User className="w-4 h-4 mr-2 opacity-0" /> Apellido materno *
              </label>
              <input 
                type="text" 
                name="apellido_materno" 
                maxLength="50"
                value={formData.apellido_materno} 
                onChange={handleChange} 
                onBlur={handleBlur}
                placeholder="Ej. López"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.apellido_materno ? "border-red-300 focus:ring-red-100 bg-red-50/30" : "border-slate-300 focus:ring-blue-100"
                }`} 
              />
              {errores.apellido_materno && <p className="text-xs font-bold text-red-500 mt-1">{errores.apellido_materno}</p>}
            </div>
          </div>

          {/* Correos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className={`flex items-center text-sm font-bold ${errores.personal_email ? 'text-red-600' : 'text-slate-700'}`}>
                <Mail className={`w-4 h-4 mr-2 ${errores.personal_email ? 'text-red-500' : 'text-blue-500'}`} /> Correo personal *
              </label>
              <input 
                type="email" 
                name="personal_email" 
                maxLength="254"
                value={formData.personal_email} 
                onChange={handleChange} 
                onBlur={handleBlur}
                onKeyDown={handleKeyDownStrict}
                placeholder="juan@gmail.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.personal_email ? "border-red-300 focus:ring-red-100 bg-red-50/30" : "border-slate-300 focus:ring-blue-100"
                }`} 
              />
              {errores.personal_email && <p className="text-xs font-bold text-red-500 mt-1">{errores.personal_email}</p>}
            </div>
            
            <div className="space-y-2">
              <label className={`flex items-center text-sm font-bold ${errores.institutional_email ? 'text-red-600' : 'text-slate-700'}`}>
                <Mail className={`w-4 h-4 mr-2 ${errores.institutional_email ? 'text-red-500' : 'text-blue-500'}`} /> Correo institucional *
              </label>
              <input 
                type="email" 
                name="institutional_email" 
                maxLength="254"
                value={formData.institutional_email} 
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDownStrict}
                placeholder="j.perez@unid.edu.mx"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                  errores.institutional_email ? "border-red-300 focus:ring-red-100 bg-red-50/30" : "border-slate-300 focus:ring-blue-100"
                }`} 
              />
              {errores.institutional_email && <p className="text-xs font-bold text-red-500 mt-1">{errores.institutional_email}</p>}
            </div>
          </div>

          {/* Roles y Contraseña */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-slate-700">
                <Shield className="w-4 h-4 mr-2 text-blue-500" /> Rol del sistema *
              </label>
              <select 
                name="rol_id" 
                value={formData.rol_id} 
                onChange={handleChange} 
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-100 text-sm transition-all appearance-none cursor-pointer"
              >
                {user?.rol_id === 1 && <option value="1">Superadministrador</option>}
                {user?.rol_id === 1 && <option value="2">Administrador</option>}
                <option value="3">Docente</option>
              </select>
            </div>

            {isEditing && (
              <div className="space-y-2">
                <label className={`flex items-center text-sm font-bold ${errores.password_raw ? 'text-red-600' : 'text-amber-600'}`}>
                  <KeyRound className="w-4 h-4 mr-2" /> Forzar nueva contraseña (Opcional)
                </label>
                <input 
                  type="text" 
                  name="password_raw" 
                  maxLength="50"
                  value={formData.password_raw} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDownStrict}
                  placeholder="Dejar en blanco para conservar la actual" 
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all bg-white ${
                    errores.password_raw ? "border-red-300 focus:ring-red-100 bg-red-50/30" : "border-amber-200 focus:border-amber-300 focus:ring-amber-100"
                  }`} 
                />
                {errores.password_raw 
                  ? <p className="text-xs font-bold text-red-500 mt-1">{errores.password_raw}</p>
                  : <p className="text-xs font-medium text-amber-600/80 mt-1">Nota: El usuario será obligado a cambiarla al iniciar sesión.</p>
                }
              </div>
            )}
          </div>

          {/* Foto de perfil */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center text-sm font-bold text-slate-700 mb-4">
              <ImagePlus className="w-4 h-4 mr-2 text-blue-500" /> Fotografía de perfil (Opcional)
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="h-28 w-28 rounded-full bg-white overflow-hidden border-4 border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                {previewUrl ? (
                  <img src={previewUrl} alt="Previsualización" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-slate-300" />
                )}
              </div>
              
              <div className="w-full">
                <input 
                  type="file" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleFileChange} 
                  className="block w-full text-slate-600 text-sm
                    file:mr-4 file:py-2.5 file:px-5
                    file:rounded-xl file:border-0
                    file:text-sm file:font-bold
                    file:bg-blue-600 file:text-white
                    hover:file:bg-blue-700 cursor-pointer transition-colors"
                />
                <p className="mt-2 text-xs font-medium text-slate-500">Formatos soportados: JPG, PNG, WEBP (Max: 10MB)</p>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end pt-6 border-t border-slate-100">
            {isEditing ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <RefreshCw className="w-5 h-5 mr-2" />}
                Actualizar usuario
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Guardar usuario
              </button>
            )}
          </div>
          
        </form>
      </div>
    </div>
  );
};