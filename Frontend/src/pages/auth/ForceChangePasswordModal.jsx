import { useState } from "react";
import { ShieldAlert, LogOut, Loader2, Save, Eye, EyeOff, User } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";

export const ForceChangePasswordModal = () => {
  const { user, completePasswordChange, logout } = useAuth();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user || user.es_password_temporal !== 1) {
    return null;
  }

  // Construcción robusta de la URL de la imagen
  const API_BASE = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://localhost:3000';
    
  const profileImageUrl = user.foto_perfil_url 
    ? `${API_BASE}${user.foto_perfil_url}` 
    : null;

  const handleKeyDownStrict = (e) => {
    if (e.key === ' ') e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      return toast.error("La contraseña debe tener al menos 8 caracteres.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Las contraseñas no coinciden. Verifícalas.");
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Actualizando credenciales...");

    try {
      await api.post("/auth/change-temporary-password", { new_password: newPassword });
      
      toast.success("¡Contraseña actualizada con éxito! Bienvenido.", { id: toastId });
      completePasswordChange(); 
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Error al cambiar la contraseña.";
      toast.error(`Error: ${errorMsg}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Cabecera del modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-amber-100 bg-amber-50/50">
          <div className="flex items-center text-amber-600">
            <ShieldAlert className="w-5 h-5 mr-2" />
            <h3 className="text-lg font-black tracking-tight">Actualización de Seguridad</h3>
          </div>
          {/* No hay botón X porque es un bloqueo obligatorio */}
        </div>
        
        {/* Cuerpo del modal */}
        <div className="p-6">
          <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
            Hola <span className="font-bold text-slate-800">{user.nombres}</span>. Estás utilizando una contraseña temporal. Por seguridad, debes establecer una nueva clave para acceder a tu panel.
          </p>

          <div className="flex items-center space-x-6 mb-6 p-5 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-20 w-20 rounded-full bg-white border-4 border-white shadow-sm overflow-hidden flex items-center justify-center shrink-0">
              {profileImageUrl ? (
                <img src={profileImageUrl} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900">
                {user.nombres} {user.apellido_paterno}
              </h4>
              <p className="text-sm font-medium text-slate-500 mt-1">
                A punto de iniciar sesión en SIGAD
              </p>
            </div>
          </div>

          <form id="force-password-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Nueva contraseña *</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength="8"
                  maxLength="50"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value.replace(/\s/g, ''))}
                  onKeyDown={handleKeyDownStrict}
                  className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-slate-900 sm:text-base py-3 pl-4 pr-12 transition-colors"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-4 text-slate-400 hover:text-amber-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Confirmar contraseña *</label>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength="8"
                maxLength="50"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.replace(/\s/g, ''))}
                onKeyDown={handleKeyDownStrict}
                className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-slate-900 sm:text-base py-3 px-4 transition-colors"
                placeholder="Vuelve a escribir la contraseña"
              />
            </div>
          </form>
        </div>
        
        {/* Pie del modal */}
        <div className="bg-slate-50/50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={logout} 
            disabled={isSubmitting}
            className="flex items-center px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 mr-2" /> Salir de la cuenta
          </button>
          <button
            type="submit"
            form="force-password-form"
            disabled={isSubmitting}
            className="flex items-center px-5 py-2.5 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 hover:shadow-md hover:shadow-amber-200 focus:ring-2 focus:ring-amber-200 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Actualizar e ingresar
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
