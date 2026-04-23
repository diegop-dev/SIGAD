import { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  User,
  Mail,
  Camera,
  Shield,
  ImagePlus,
  Loader2,
  Save,
  X
} from "lucide-react";
import api from "../../services/api";
import { TOAST_USUARIOS, TOAST_COMMON } from "../../../constants/toastMessages";

/* ─────────────────────────────────────────────
   Mapa de roles
───────────────────────────────────────────── */
const ROLE_CONFIG = {
  1: {
    label: "Superadministrador",
    color: "bg-violet-100 text-violet-700 border-violet-200",
  },
  2: {
    label: "Administrador",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  3: {
    label: "Docente",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

/* ─────────────────────────────────────────────
   Sub-componente: Fila de datos de perfil
───────────────────────────────────────────── */
const ProfileRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center py-3 border-b border-slate-100 last:border-0 gap-3">
    <div className="w-1/3 flex items-center text-[13px] font-bold text-slate-500">
      <Icon className="w-4 h-4 mr-2 text-slate-400" />
      {label}
    </div>
    <div className="w-2/3 text-[13px] font-bold text-[#0B1828]">
      {value || (
        <span className="text-slate-400 font-medium italic">No especificado</span>
      )}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Componente principal: UserProfile
───────────────────────────────────────────── */
export const UserProfile = ({ userToView, onBack, onPhotoUpdate }) => {
  const fileInputRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : "http://localhost:3000";

  const [previewUrl, setPreviewUrl] = useState(() =>
    userToView?.foto_perfil_url
      ? `${API_BASE}${userToView.foto_perfil_url}`
      : null
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const roleConfig = ROLE_CONFIG[userToView?.rol_id] ?? {
    label: "Rol Desconocido",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const fullName = [
    userToView?.nombres,
    userToView?.apellido_paterno,
    userToView?.apellido_materno,
  ]
    .filter(Boolean)
    .join(" ");

  /* ── Selección de archivo ── */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  /* ── Subida al backend ── */
  const handleUploadPhoto = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const toastId = toast.loading("Actualizando fotografía...");
    try {
      const form = new FormData();
      form.append("foto_perfil_url", selectedFile);

      const { data } = await api.put("/users/me/foto", form);

      toast.success(TOAST_USUARIOS.actualizadoOk, { id: toastId });
      setSelectedFile(null);

      if (onPhotoUpdate && data?.foto_perfil_url) {
        onPhotoUpdate(data.foto_perfil_url);
      }
    } catch {
      toast.error(TOAST_COMMON.errorServidor, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Descarte de selección ── */
  const handleDiscardPhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(
      userToView?.foto_perfil_url
        ? `${API_BASE}${userToView.foto_perfil_url}`
        : null
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative flex flex-col w-full">
      
      {/* ── Header ── */}
      <div className="bg-[#0B1828] px-5 py-4 flex items-center shadow-sm relative z-10 shrink-0">
        <button
          onClick={onBack}
          className="mr-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-lg font-black text-white leading-tight">Mi Perfil</h2>
          <p className="text-xs text-white/70 font-medium mt-0.5">
             Visualiza tu información personal, información de contacto y cambia tu fotografía de usuario.
          </p>
        </div>
      </div>

      <div className="p-5 md:p-6 max-w-6xl w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
          
          {/* Tarjeta de Identidad ── */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
              
              <div className="relative mb-5">
                <div className="h-32 w-32 rounded-full bg-slate-50 border-2 border-slate-100 shadow-sm overflow-hidden flex items-center justify-center mx-auto">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-slate-300" />
                  )}
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-1 p-2.5 bg-[#0B1828] rounded-full shadow-md hover:bg-[#162840] transition-all active:scale-95 border-2 border-white"
                  title="Cambiar fotografía"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <div className="w-full">
                <h3 className="text-base font-black text-[#0B1828] leading-tight mb-3 text-center break-words px-2">
                  {fullName || "—"}
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] tracking-widest font-black uppercase border ${roleConfig.color}`}
                >
                  <Shield className="w-3 h-3" />
                  {roleConfig.label}
                </span>
              </div>
            </div>
          </div>

          {/* Información y Acciones ── */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-black text-[#0B1828]">
                  Información de Contacto
                </h3>
              </div>
              <div className="px-5 py-1">
                <ProfileRow icon={Mail} label="Correo personal" value={userToView?.personal_email} />
                <ProfileRow icon={Mail} label="Correo institucional" value={userToView?.institutional_email} />
              </div>
            </div>

            {/* Acciones de Foto Nueva (Alineadas a la derecha en escritorio) */}
            {selectedFile && (
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-2.5 mr-auto min-w-0">
                  <ImagePlus className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-amber-900 leading-tight tracking-wide">Foto nueva</h4>
                    <p className="text-[10px] font-medium text-amber-700 truncate">{selectedFile.name}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDiscardPhoto}
                    disabled={isUploading}
                    className="flex-1 sm:flex-none flex items-center justify-center py-2.5 px-6 rounded-lg text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-60"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Descartar
                  </button>
                  <button
                    onClick={handleUploadPhoto}
                    disabled={isUploading}
                    className="flex-1 sm:flex-none flex items-center justify-center py-2.5 px-8 rounded-lg text-sm font-bold bg-[#0B1828] text-white hover:bg-[#162840] shadow-md transition-all active:scale-95 disabled:opacity-60"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Guardar
                  </button>
                </div>
              </div>
            )}

          </div>
          
        </div>
      </div>
    </div>
  );
};