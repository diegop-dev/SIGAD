import { useState } from "react";
import { ShieldAlert, LogOut, Loader2, Save, Eye, EyeOff, User, Lock } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";

export const ForceChangePasswordModal = () => {
  const { user, completePasswordChange, logout } = useAuth();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errores, setErrores] = useState({});

  if (!user || user.es_password_temporal !== 1) {
    return null;
  }

  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
    
  const profileImageUrl = user.foto_perfil_url 
    ? `${API_BASE}${user.foto_perfil_url}` 
    : null;

  const firstAndLast = `${user?.nombres?.split(' ')[0] || ''} ${user?.apellido_paterno || ''}`.trim();
  
  const fullDisplayName = [
    user?.nombres, 
    user?.apellido_paterno, 
    user?.apellido_materno
  ].filter(Boolean).join(' ');

  const handleKeyDownStrict = (e) => {
    if (e.key === ' ') e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validaciones personalizadas en lugar de etiquetas HTML
    if (!newPassword) {
      newErrors.newPassword = "La nueva contraseña es obligatoria.";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "La contraseña debe tener al menos 8 caracteres.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Debes confirmar tu nueva contraseña.";
    } else if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden. Verifícalas.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrores(newErrors);
      return;
    }

    setErrores({});
    setIsSubmitting(true);
    const toastId = toast.loading("Actualizando...");

    try {
      await api.post("/auth/change-temporary-password", { new_password: newPassword });
      toast.success("Contraseña actualizada con éxito.", { id: toastId });
      completePasswordChange(); 
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al cambiar la contraseña.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputBaseClass = "block w-full rounded-xl border text-sm py-3 outline-none transition-all";
  // Modificado solo marca el contorno, el fondo sigue siendo blanco
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500 bg-white" 
      : "border-slate-300 bg-white focus:border-[#0B1828] focus:ring-1 focus:ring-[#0B1828]";

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Cabecera compacta */}
        <div className="flex justify-between items-center px-6 py-4 bg-[#0B1828] shrink-0">
          <div className="flex items-center text-white">
            <ShieldAlert className="w-5 h-5 mr-3" />
            <h3 className="text-lg font-black text-white tracking-tight">Cambiar contraseña</h3>
          </div>
        </div>
        
        {/* Cuerpo del modal */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-5">
            Hola, <span className="font-bold text-[#0B1828]">{firstAndLast}</span>. Debes actualizar tu contraseña temporal para continuar.
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 mb-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-300" />
              )}
            </div>
            <div className="pt-2 flex-1 min-w-0">
              <h4 className="text-base font-black text-[#0B1828] leading-tight break-words uppercase">
                {fullDisplayName}
              </h4>
              <span className="mt-2 inline-flex px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border shadow-sm bg-slate-100 text-slate-500 border-slate-200">
                Cambio Obligatorio
              </span>
            </div>
          </div>

          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-xl mb-5 w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
            Indica un campo obligatorio para el sistema
          </div>

          {/* Formulario con validación 100% personalizada en JS */}
          <form id="force-password-form" onSubmit={handleSubmit} noValidate className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center mb-1">
              <h5 className="text-[14px] font-black text-[#0B1828] tracking-widest">Nuevas credenciales</h5>
            </div>

            <div className="space-y-4">
              <div>
                <label className="flex items-center text-xs font-bold text-[#0B1828] mb-1.5 tracking-wider">
                  Nueva contraseña <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value.replace(/\s/g, ''));
                      if (errores.newPassword) setErrores({ ...errores, newPassword: null });
                    }}
                    onKeyDown={handleKeyDownStrict}
                    className={`${inputBaseClass} ${getValidationClass(errores.newPassword)} pl-4 pr-12`}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-[#0B1828] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errores.newPassword && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.newPassword}</p>}
              </div>

              <div>
                <label className="flex items-center text-xs font-bold text-[#0B1828] mb-1.5 tracking-wider">
                  Confirmar contraseña <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value.replace(/\s/g, ''));
                    if (errores.confirmPassword) setErrores({ ...errores, confirmPassword: null });
                  }}
                  onKeyDown={handleKeyDownStrict}
                  className={`${inputBaseClass} ${getValidationClass(errores.confirmPassword)} px-4`}
                  placeholder="Repite la contraseña"
                />
                {errores.confirmPassword && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.confirmPassword}</p>}
              </div>
            </div>
          </form>
        </div>
        
        {/* Pie del Modal con Botones más Grandes */}
        <div className="bg-white px-6 py-5 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <button 
            type="button"
            onClick={logout} 
            disabled={isSubmitting}
            className="flex items-center px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4 mr-2" /> Salir
          </button>
          <button
            type="submit"
            form="force-password-form"
            disabled={isSubmitting}
            className="flex items-center px-6 py-3 text-sm font-bold text-white bg-[#0B1828] hover:bg-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Cambiar Contraseña
          </button>
        </div>

      </div>
    </div>
  );
};