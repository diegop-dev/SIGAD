import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, User, RefreshCw, Copy, CheckCircle, Mail, KeyRound, Shield, ImagePlus, Loader2, CheckCircle2 } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { TOAST_USUARIOS, TOAST_COMMON } from "../../../constants/toastMessages";
import { REGEX } from "../../utils/regex";
import { formatToGlobalUppercase } from "../../utils/textFormatter";

export const UserForm = ({ userToEdit, onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errores, setErrores] = useState({});
  const [isFormDirty, setIsFormDirty] = useState(false);
  
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const isEditing = !!userToEdit;
  // Bloqueo de rol para Docentes (3) y Administradores (2) en modo edición
  const isRoleLocked = isEditing && (userToEdit?.rol_id === 2 || userToEdit?.rol_id === 3);
  const lockedRoleLabel = userToEdit?.rol_id === 3 
    ? "Docente (Rol No Modificable)" 
    : "Administrador (Rol No Modificable)";

  const [formData, setFormData] = useState({
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    personal_email: "",
    institutional_email: "",
    password_raw: "", 
    rol_id: "", 
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
        rol_id: userToEdit.rol_id || "",
        foto_perfil_url: null, 
      });

      if (userToEdit.foto_perfil_url) {
        const API_BASE = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace('/api', '') 
          : 'http://localhost:3000';
        setPreviewUrl(`${API_BASE}${userToEdit.foto_perfil_url}`);
      }
    }
  }, [userToEdit]);

  useEffect(() => {
    if (!isEditing) {
      setIsFormDirty(true);
      return;
    }

    const hasChanged = 
      formData.nombres !== userToEdit.nombres ||
      formData.apellido_paterno !== userToEdit.apellido_paterno ||
      formData.apellido_materno !== userToEdit.apellido_materno ||
      formData.personal_email !== userToEdit.personal_email ||
      formData.institutional_email !== userToEdit.institutional_email ||
      Number(formData.rol_id) !== Number(userToEdit.rol_id) ||
      formData.password_raw.trim() !== "" ||
      formData.foto_perfil_url !== null;

    setIsFormDirty(hasChanged);
  }, [formData, userToEdit, isEditing]);

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
    const { name, value, type } = e.target;
    const formattedValue = formatToGlobalUppercase(value, name, type);
    let sanitizedValue = formattedValue;

    if (['nombres', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      // Permitir solo letras (con acentos/eñe) y espacios simples intermedios
      sanitizedValue = sanitizedValue
        .replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, '')
        .replace(/^\s+/g, '')
        .replace(/\s{2,}/g, ' ');
      // Bloquear si contiene 3+ letras iguales consecutivas
      if (REGEX.TRIPLE_LETRA_REPETIDA.test(sanitizedValue)) return;
    } else if (['personal_email', 'institutional_email'].includes(name)) {
      // Permitir solo caracteres válidos para email, evitar doble '@'
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9@._%-+]/g, '');
      const parts = sanitizedValue.split('@');
      if (parts.length > 2) {
        sanitizedValue = parts[0] + '@' + parts.slice(1).join('').replace(/@/g, '');
      }
    } else if (name === 'password_raw') {
      // REGEX.SIN_ESPACIOS: no permite ningún tipo de espacio en la contraseña
      if (value !== '' && !REGEX.SIN_ESPACIOS.test(value)) return;
      sanitizedValue = value;
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    
    if (errores[name]) {
      const newErrors = { ...errores };
      delete newErrors[name];
      setErrores(newErrors);
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    let finalValue = value.trim();

    if (['personal_email', 'institutional_email'].includes(name)) {
      finalValue = finalValue.toLowerCase();
      
      if (finalValue && (!isEditing || finalValue !== userToEdit[name])) {
        try {
          const response = await api.get(`/users/check-email?email=${finalValue}`);
          if (response.data.exists) {
            const fieldMatch = response.data.field === 'personal_email' ? 'Personal' : 'Institucional';
            setErrores(prev => ({
              ...prev,
              [name]: `Este correo ya se encuentra registrado como correo ${fieldMatch.toLowerCase()}.`
            }));
          }
        } catch (error) {
          console.error("Error al validar el correo", error);
        }
      }
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombres) newErrors.nombres = "El nombre es un campo obligatorio.";
    else if (!REGEX.NOMBRES.test(formData.nombres)) newErrors.nombres = "Solo se permiten letras y un espacio simple entre palabras.";
    else if (REGEX.TRIPLE_LETRA_REPETIDA.test(formData.nombres)) newErrors.nombres = "El nombre no puede contener tres o más letras iguales consecutivas.";

    if (!formData.apellido_paterno) newErrors.apellido_paterno = "El apellido paterno es un campo obligatorio.";
    else if (!REGEX.NOMBRES.test(formData.apellido_paterno)) newErrors.apellido_paterno = "Solo se permiten letras y un espacio simple entre palabras.";
    else if (REGEX.TRIPLE_LETRA_REPETIDA.test(formData.apellido_paterno)) newErrors.apellido_paterno = "El apellido no puede contener tres o más letras iguales consecutivas.";

    if (!formData.apellido_materno) newErrors.apellido_materno = "El apellido materno es un campo obligatorio.";
    else if (!REGEX.NOMBRES.test(formData.apellido_materno)) newErrors.apellido_materno = "Solo se permiten letras y un espacio simple entre palabras.";
    else if (REGEX.TRIPLE_LETRA_REPETIDA.test(formData.apellido_materno)) newErrors.apellido_materno = "El apellido no puede contener tres o más letras iguales consecutivas.";

    if (!formData.personal_email) newErrors.personal_email = "El correo personal es un campo obligatorio.";
    else if (!REGEX.EMAIL.test(formData.personal_email)) newErrors.personal_email = "El formato del correo ingresado no es válido.";

    if (!formData.institutional_email) newErrors.institutional_email = "El correo institucional es un campo obligatorio.";
    else if (!REGEX.EMAIL.test(formData.institutional_email)) newErrors.institutional_email = "El formato del correo ingresado no es válido.";

    if (!formData.rol_id) newErrors.rol_id = "Debe seleccionar un rol para el usuario.";

    if (isEditing && formData.password_raw && !REGEX.PASSWORD_FUERTE_SIN_ESPACIOS.test(formData.password_raw)) {
      newErrors.password_raw = "La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula y un número, sin espacios.";
    }

    if (errores.personal_email?.includes('registrado')) newErrors.personal_email = errores.personal_email;
    if (errores.institutional_email?.includes('registrado')) newErrors.institutional_email = errores.institutional_email;

    setErrores(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(TOAST_USUARIOS.camposInvalidos);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      isEditing ? TOAST_USUARIOS.loadingActualizar : TOAST_USUARIOS.loadingRegistrar
    );

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
        toast.success(TOAST_USUARIOS.actualizadoOk, { id: toastId });
        onSuccess(); 
      } else {
        form.append("creado_por", user.id_usuario);
        const response = await api.post("/users/register", form);
        toast.success(TOAST_USUARIOS.registradoOk, { id: toastId });
        
        if (response.data && response.data.password_temporal) {
          setGeneratedPassword(response.data.password_temporal);
        } else {
          onSuccess(); 
        }
      }
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error, { id: toastId });
      } else {
        toast.error(TOAST_COMMON.errorServidor, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success(TOAST_COMMON.contrasenaCopiadaPortapapeles);
    setTimeout(() => setCopied(false), 2000);
  };

  if (generatedPassword) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
        <div className="bg-[#0B1828] h-16 w-full absolute top-0 left-0 z-0"></div>
        
        <div className="p-8 text-center max-w-lg mx-auto relative z-10 pt-12">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 border-4 border-white shadow-md mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-[#0B1828] mb-2">¡Usuario registrado!</h2>
          <p className="text-slate-600 font-medium mb-8">
            El sistema ha generado una contraseña temporal segura para este usuario. Cópiala y entrégala; el sistema le exigirá cambiarla en su primer inicio de sesión.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 relative group shadow-inner">
            <span className="block text-sm text-[#0B1828] font-bold mb-2">Contraseña temporal:</span>
            <code className="text-3xl font-mono font-black text-[#0B1828] tracking-wider">
              {generatedPassword}
            </code>
            <button 
              onClick={handleCopyPassword}
              className="absolute top-4 right-4 p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-[#0B1828] hover:bg-slate-50 transition-all active:scale-95 focus:ring-2 focus:ring-slate-400"
              title="Copiar contraseña"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button
            onClick={() => onSuccess()}
            className="w-full py-4 px-4 bg-[#0B1828] text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-[#0B1828]/30 hover:bg-[#162840] transition-all active:scale-[0.98]"
          >
            Entendido, volver al listado
          </button>
        </div>
      </div>
    );
  }

  const isSubmitDisabled = isSubmitting || !isFormDirty || Object.keys(errores).length > 0;

  const inputBaseClass = "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none [&:autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:autofill]:[-webkit-text-fill-color:#0B1828]";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

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
            {isEditing ? "Modificar usuario" : "Nuevo usuario"}
          </h2>
          <p className="text-sm text-white/60 font-medium">
            Define los datos personales, correos y rol de acceso.
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
            {/* Sección 1: Nombres y Apellidos */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <User className="w-4 h-4 mr-2" /> Nombres <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="nombres" 
                    maxLength="50"
                    value={formData.nombres} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    placeholder="Ej. Juan Carlos"
                    className={`${inputBaseClass} ${getValidationClass(errores.nombres)}`}
                  />
                  {errores.nombres && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nombres}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <User className="w-4 h-4 mr-2 opacity-0" /> Apellido paterno <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="apellido_paterno" 
                    maxLength="50"
                    value={formData.apellido_paterno} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    placeholder="Ej. Pérez"
                    className={`${inputBaseClass} ${getValidationClass(errores.apellido_paterno)}`}
                  />
                  {errores.apellido_paterno && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.apellido_paterno}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <User className="w-4 h-4 mr-2 opacity-0" /> Apellido materno <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="apellido_materno" 
                    maxLength="50"
                    value={formData.apellido_materno} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    placeholder="Ej. López"
                    className={`${inputBaseClass} ${getValidationClass(errores.apellido_materno)}`}
                  />
                  {errores.apellido_materno && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.apellido_materno}</p>}
                </div>
              </div>
            </div>

            {/* Sección 2 Correos */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Mail className="w-4 h-4 mr-2" /> Correo personal <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="personal_email" 
                    maxLength="100"
                    value={formData.personal_email} 
                    onChange={handleChange} 
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDownStrict}
                    placeholder="juan@gmail.com"
                    className={`${inputBaseClass} ${getValidationClass(errores.personal_email)}`}
                  />
                  {errores.personal_email && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.personal_email}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Mail className="w-4 h-4 mr-2" /> Correo institucional <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="institutional_email" 
                    maxLength="100"
                    value={formData.institutional_email} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDownStrict}
                    placeholder="j.perez@red.unid.mx"
                    className={`${inputBaseClass} ${getValidationClass(errores.institutional_email)}`}
                  />
                  {errores.institutional_email && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.institutional_email}</p>}
                </div>
              </div>
            </div>

            {/* Sección 3 Roles y Contraseña */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Seguridad y Acceso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Shield className="w-4 h-4 mr-2" /> Rol del sistema <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  {isRoleLocked ? (
                    <input 
                      type="text" 
                      value={lockedRoleLabel}
                      disabled 
                      className={`${inputBaseClass} bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed`}
                    />
                  ) : (
                    <>
                      <select 
                        name="rol_id" 
                        value={formData.rol_id} 
                        onChange={handleChange} 
                        className={`${inputBaseClass} ${getValidationClass(errores.rol_id)} appearance-none cursor-pointer`}
                      >
                        <option value="" disabled>Seleccione un rol</option>
                        {user?.rol_id === 1 && <option value="1">Superadministrador</option>}
                        {(user?.rol_id === 1 || user?.rol_id === 2) && <option value="2">Administrador</option>}
                      </select>
                      {errores.rol_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.rol_id}</p>}
                    </>
                  )}
                </div>

                {isEditing && (
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-bold mb-2 text-[#0B1828]">
                      <KeyRound className="w-4 h-4 mr-2" /> Forzar nueva contraseña (Opcional)
                    </label>
                    <input 
                      type="text" 
                      name="password_raw" 
                      maxLength="64"
                      value={formData.password_raw} 
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDownStrict}
                      placeholder="Dejar en blanco para conservar la actual" 
                      className={`${inputBaseClass} ${getValidationClass(errores.password_raw)}`}
                    />
                    {errores.password_raw 
                      ? <p className="text-xs font-bold text-red-500 mt-1.5">{errores.password_raw}</p>
                      : <p className="text-xs font-medium text-slate-500 mt-1.5">
                          Longitud recomendada: 8 a 15 caracteres. El usuario deberá cambiarla al iniciar sesión.
                        </p>
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Sección 4 Foto de Perfil */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-[#0B1828] border-b border-slate-100 pb-2">Fotografía (Opcional)</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm">
                <div className="h-28 w-28 rounded-full bg-white overflow-hidden border-4 border-white shadow-md flex items-center justify-center shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Previsualización" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-slate-300" />
                  )}
                </div>
                
                <div className="w-full">
                  <input 
                    type="file" 
                    accept="image/jpeg, image/png, image/webp" 
                    onChange={handleFileChange} 
                    className="block w-full text-[#0B1828] text-sm
                      file:mr-4 file:py-3 file:px-5
                      file:rounded-xl file:border-0
                      file:text-sm file:font-bold
                      file:bg-[#0B1828] file:text-white
                      hover:file:bg-[#162840] hover:file:shadow-md
                      cursor-pointer transition-all file:transition-all"
                  />
                  <p className="mt-3 text-xs font-medium text-slate-500 flex items-center">
                    <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> Formatos soportados: JPG, PNG, WEBP (Max: 10MB)
                  </p>
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
                {isSubmitting
                  ? <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  : isEditing 
                    ? <RefreshCw className="w-6 h-6 mr-2 text-white" />
                    : <Save className="w-6 h-6 mr-2 text-white" />
                }
                {isSubmitting
                  ? "Guardando cambios..."
                  : isEditing ? "Modificar Usuario" : "Nuevo Usuario"
                }
              </button>
            </div>
            
          </div>
        </form>
      </div>
    </div>
  );
};