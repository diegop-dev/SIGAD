import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft, User, Mail, Camera, Shield, Loader2, Save, X,
  FileText, ExternalLink, CheckCircle, Lock, Phone, MapPin,
  GraduationCap, ImagePlus, Hash, BadgeCheck, AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { TOAST_COMMON } from "../../../constants/toastMessages";

/* ─────────────────────────────────────────────────── */
/* Constantes de módulo                                */
/* ─────────────────────────────────────────────────── */

const API_BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace("/api", "")
  : "http://localhost:3000";

// Idéntica a UserForm — incluye parches de autofill de Chrome
const inputBaseClass =
  "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none " +
  "[&:autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:autofill]:[-webkit-text-fill-color:#0B1828]";

const getValidationClass = (hasError) =>
  hasError
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

const NIVEL_LABELS = {
  LICENCIATURA: "Licenciatura",
  MAESTRIA:     "Maestría",
  DOCTORADO:    "Doctorado",
};

const DOCUMENTOS = [
  { id: "titulo",    tipo: "TITULO",                label: "Título Profesional"    },
  { id: "cedula",    tipo: "CEDULA",                label: "Cédula Profesional"    },
  { id: "sat",       tipo: "CONSTANCIA_FISCAL",     label: "Constancia SAT"        },
  { id: "ine",       tipo: "INE",                   label: "INE"                   },
  { id: "domicilio", tipo: "COMPROBANTE_DOMICILIO", label: "Comprobante Domicilio" },
  { id: "cv",        tipo: "CV",                    label: "Currículum Vitae"      },
];

/* ── Helpers ── */

const parseDomicilio = (str) => {
  if (!str) return { calle: "", numero: "", colonia: "", cp: "" };
  const m = str.match(/(.*?) Num\. (.*?), Col\. (.*?), C\.P\. (\d{5})/);
  return m
    ? { calle: m[1], numero: m[2], colonia: m[3], cp: m[4] }
    : { calle: str, numero: "", colonia: "", cp: "" };
};

const formatFecha = (str) => {
  if (!str) return "";
  return new Date(str).toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });
};

/* ─────────────────────────────────────────────────── */
/* Sub-componentes                                     */
/* ─────────────────────────────────────────────────── */

/**
 * SectionHeader — equivalente a los <h3> con border-b de UserForm.
 * Cuando locked=true añade el badge "Solo lectura" junto al título,
 * igual que UserForm muestra lockedRoleLabel en el select deshabilitado.
 */
const SectionHeader = ({ title, subtitle, locked = false }) => (
  <div className="mb-6">
    <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
      <h3 className="text-lg font-black text-[#0B1828]">{title}</h3>
      {locked && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
          <Lock className="w-2.5 h-2.5" /> Solo lectura
        </span>
      )}
    </div>
    {subtitle && (
      <p className="text-xs font-medium text-slate-400 mt-1">{subtitle}</p>
    )}
  </div>
);

/**
 * LockedField — input deshabilitado con el mismo base class que UserForm usa
 * para su select bloqueado (bg-slate-50 text-slate-500 cursor-not-allowed).
 * font-mono diferencia visualmente los valores legales (RFC, CURP, etc.).
 */
const LockedField = ({ label, value, icon: Icon }) => (
  <div className="space-y-2">
    <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </label>
    <input
      type="text"
      value={value || ""}
      disabled
      readOnly
      className={`${inputBaseClass} bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed font-mono`}
    />
  </div>
);

/**
 * InfoChip — fila de solo lectura para la tarjeta de correos.
 */
const InfoChip = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-[#0B1828] truncate">
        {value || <span className="text-slate-400 italic font-medium text-xs">No especificado</span>}
      </p>
    </div>
  </div>
);

/**
 * DocCard — tarjeta de documento individual.
 * Extraída como componente para evitar fragments en ternarios dentro de .map().
 */
const DocCard = ({ doc, urlActual, archivo, onFileChange }) => {
  const tieneArchivo = Boolean(urlActual);
  return (
    <div
      className={`rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 ${
        archivo
          ? "border-emerald-200 bg-emerald-50/40 shadow-sm"
          : "border-slate-200 bg-slate-50/50"
      }`}
    >
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
            <FileText className="w-3.5 h-3.5 text-[#0B1828]" />
          </div>
          <span className="text-sm font-bold text-[#0B1828] leading-tight">{doc.label}</span>
        </div>
        {tieneArchivo && (
          <a
            href={`${API_BASE}${urlActual}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#0B1828] bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all"
          >
            <ExternalLink className="w-3 h-3" />
            Ver PDF
          </a>
        )}
      </div>

      {/* Estado */}
      {tieneArchivo ? (
        <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 shrink-0" />
          <span>Archivo vigente</span>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>Sin archivo</span>
        </div>
      )}

      {/* Input */}
      <div>
        <input
          type="file"
          name={doc.id}
          accept="application/pdf"
          onChange={onFileChange}
          className="block w-full text-[10px] text-slate-500
            file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0
            file:text-[11px] file:font-bold file:bg-[#0B1828] file:text-white
            hover:file:bg-[#162840] hover:file:shadow-md cursor-pointer
            file:transition-all file:cursor-pointer"
        />
        {archivo && (
          <p
            className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1 truncate bg-white px-2 py-1 rounded-md border border-emerald-200"
            title={archivo.name}
          >
            <CheckCircle className="w-3 h-3 shrink-0" />
            {archivo.name}
          </p>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────── */
/* Componente principal                                */
/* ─────────────────────────────────────────────────── */

export const DocenteProfile = ({ expediente, onBack, onPhotoUpdate }) => {
  const photoInputRef = useRef(null);

  /* ── Estado: foto ── */
  const [previewUrl, setPreviewUrl] = useState(() =>
    expediente?.foto_perfil_url ? `${API_BASE}${expediente.foto_perfil_url}` : null
  );
  const [selectedPhoto, setSelectedPhoto]       = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  /* ── Estado: expediente ── */
  const parsed = parseDomicilio(expediente?.domicilio);
  const [formData, setFormData] = useState({
    celular: expediente?.celular || "",
    calle:   parsed.calle,
    numero:  parsed.numero,
    colonia: parsed.colonia,
    cp:      parsed.cp,
  });
  const [archivos, setArchivos] = useState({
    titulo: null, cedula: null, sat: null, ine: null, domicilio: null, cv: null,
  });
  const [errores, setErrores]           = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Estado: CP ── */
  const [colonias, setColonias]   = useState([]);
  const [estado, setEstado]       = useState("");
  const [loadingCP, setLoadingCP] = useState(false);

  /* ── CP effect ── */
  useEffect(() => {
    if (formData.cp.length === 5) {
      setLoadingCP(true);
      (async () => {
        try {
          const res = await fetch(`https://api.zippopotam.us/mx/${formData.cp}`);
          if (res.ok) {
            const data = await res.json();
            setEstado(data.places[0].state);
            setColonias(data.places.map((p) => p["place name"]));
            setErrores((prev) => ({ ...prev, cp: null }));
          } else {
            setColonias([]); setEstado("");
            setErrores((prev) => ({ ...prev, cp: "Código postal no encontrado" }));
          }
        } catch {
          setColonias([]); setEstado("");
          setErrores((prev) => ({ ...prev, cp: "Error de conexión" }));
        } finally {
          setLoadingCP(false);
        }
      })();
    } else {
      setColonias([]); setEstado("");
    }
  }, [formData.cp]);

  /* Cleanup blob URL */
  useEffect(() => () => { if (selectedPhoto) URL.revokeObjectURL(previewUrl); }, []);

  const fullName = [expediente?.nombres, expediente?.apellido_paterno, expediente?.apellido_materno]
    .filter(Boolean).join(" ");

  const coloniaOptions = colonias.length > 0
    ? (colonias.includes(formData.colonia) ? colonias : [formData.colonia, ...colonias].filter(Boolean))
    : [];

  const getDocUrl = (tipo) => {
    const doc = expediente?.documentos?.find((d) => d.tipo_documento === tipo);
    return doc ? doc.url_archivo : null;
  };

  /* ─── Handlers: foto ─── */

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDiscardPhoto = () => {
    setSelectedPhoto(null);
    setPreviewUrl(expediente?.foto_perfil_url ? `${API_BASE}${expediente.foto_perfil_url}` : null);
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto) return;
    setIsUploadingPhoto(true);
    const toastId = toast.loading("Actualizando fotografía...");
    try {
      const form = new FormData();
      form.append("foto_perfil_url", selectedPhoto);
      const { data } = await api.put("/docentes/mi-perfil/foto", form);
      toast.success("Fotografía actualizada correctamente.", { id: toastId });
      setSelectedPhoto(null);
      if (onPhotoUpdate && data?.foto_perfil_url) onPhotoUpdate(data.foto_perfil_url);
    } catch {
      toast.error(TOAST_COMMON.errorServidor, { id: toastId });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  /* ─── Handlers: expediente ─── */

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "celular" || name === "cp") v = v.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: v }));
    if (errores[name]) setErrores((prev) => ({ ...prev, [name]: null }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Solo se aceptan archivos en formato PDF.");
      e.target.value = null;
      return;
    }
    setArchivos((prev) => ({ ...prev, [name]: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.celular || formData.celular.length !== 10)
      errs.celular = "Debe tener exactamente 10 dígitos.";
    if (formData.cp && formData.cp.length !== 5)
      errs.cp = "Debe tener exactamente 5 dígitos.";
    if (Object.keys(errs).length) {
      setErrores(errs);
      toast.error("Corrige los errores antes de guardar.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Guardando cambios...");
    try {
      const form = new FormData();
      form.append("celular", formData.celular);
      if (formData.calle)   form.append("calle",   formData.calle);
      if (formData.numero)  form.append("numero",  formData.numero);
      if (formData.colonia) form.append("colonia", formData.colonia);
      if (formData.cp)      form.append("cp",      formData.cp);
      Object.entries(archivos).forEach(([k, f]) => { if (f) form.append(k, f); });

      await api.put("/docentes/mi-perfil", form);
      toast.success("Expediente actualizado correctamente.", { id: toastId });
      setArchivos({ titulo: null, cedula: null, sat: null, ine: null, domicilio: null, cv: null });
    } catch (err) {
      toast.error(err.response?.data?.error || TOAST_COMMON.errorServidor, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ═══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col gap-6 w-full">

      {/* ══════════════════════════════════════════════════
          SECCIÓN 1 — PERFIL PERSONAL
          rounded-3xl / border-slate-100 / px-6 py-5 / p-6 md:p-10
      ══════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

        <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md">
          <button
            type="button"
            onClick={onBack}
            className="mr-4 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white leading-tight">Mi perfil</h2>
            <p className="text-sm text-white/60 font-medium mt-0.5">
              Visualiza tu información personal y actualiza tu fotografía.
            </p>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Columna izquierda: identidad */}
            <div className="lg:col-span-4">
              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 flex flex-col items-center text-center h-full">
                <div className="relative mb-5">
                  <div className="h-32 w-32 rounded-full bg-white border-2 border-slate-200 shadow-md overflow-hidden flex items-center justify-center">
                    {previewUrl
                      ? <img src={previewUrl} alt={fullName} className="h-full w-full object-cover" />
                      : <User className="h-12 w-12 text-slate-300" />
                    }
                  </div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute bottom-0.5 right-0.5 p-2.5 bg-[#0B1828] rounded-full shadow-lg hover:bg-[#162840] transition-all active:scale-95 border-2 border-white"
                    title="Cambiar fotografía"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                <h3 className="text-base font-black text-[#0B1828] mb-2 leading-tight break-words px-2">
                  {fullName || "—"}
                </h3>

                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] tracking-widest font-black uppercase border bg-emerald-100 text-emerald-700 border-emerald-200">
                  <Shield className="w-3 h-3" /> Docente
                </span>

                {expediente?.matricula_empleado && (
                  <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-black text-slate-600 font-mono tracking-wider">
                      {expediente.matricula_empleado}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha: correos + banner foto */}
            <div className="lg:col-span-8 flex flex-col gap-5">

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-sm font-black text-[#0B1828]">Información de contacto</h3>
                </div>
                <div className="px-5 py-2">
                  <InfoChip icon={Mail} label="Correo personal"      value={expediente?.personal_email} />
                  <InfoChip icon={Mail} label="Correo institucional"  value={expediente?.institutional_email} />
                </div>
              </div>

              {selectedPhoto && (
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center gap-2.5 mr-auto min-w-0">
                    <ImagePlus className="w-5 h-5 text-amber-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-amber-900">Nueva foto seleccionada</p>
                      <p className="text-[10px] font-medium text-amber-700 truncate">{selectedPhoto.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleDiscardPhoto}
                      disabled={isUploadingPhoto}
                      className="flex-1 sm:flex-none flex items-center justify-center py-2.5 px-5 rounded-xl text-sm font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-60"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Descartar
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadPhoto}
                      disabled={isUploadingPhoto}
                      className="flex-1 sm:flex-none flex items-center justify-center py-2.5 px-6 rounded-xl text-sm font-bold bg-[#0B1828] text-white hover:bg-[#162840] shadow-md transition-all active:scale-95 disabled:opacity-60"
                    >
                      {isUploadingPhoto
                        ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        : <Save   className="w-4 h-4 mr-1.5" />
                      }
                      Guardar foto
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SECCIÓN 2 — EXPEDIENTE DOCENTE
          rounded-3xl / border-slate-100 / px-6 py-5 / p-6 md:p-10
          space-y-10 entre secciones / space-y-6 dentro / space-y-2 por campo
      ══════════════════════════════════════════════════ */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
      >
        <div className="bg-[#0B1828] px-6 py-5 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-xl font-black text-white">Expediente Docente</h2>
            <p className="text-sm text-white/60 font-medium mt-0.5">
              Actualiza tu información de contacto y archivos digitales.
            </p>
          </div>
          {expediente?.nivel_academico && (
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white/80">
                {NIVEL_LABELS[expediente.nivel_academico] ?? expediente.nivel_academico}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 md:p-10">

          {/* Aviso campos obligatorios — idéntico a UserForm */}
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-10 w-fit">
            <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span>
            Indica un campo obligatorio para el sistema
          </div>

          <div className="space-y-10">

            {/* ── A: Datos Legales ── */}
            <div className="space-y-6">
              <SectionHeader
                title="Datos Legales"
                subtitle="Gestionados exclusivamente por el área administrativa."
                locked
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LockedField label="RFC"       value={expediente?.rfc} />
                <LockedField label="CURP"      value={expediente?.curp} />
                <LockedField label="Clave INE" value={expediente?.clave_ine} />
              </div>
            </div>

            {/* ── B: Perfil Académico ── */}
            <div className="space-y-6">
              <SectionHeader
                title="Perfil Académico"
                subtitle="Asignado por el área de gestión académica."
                locked
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <LockedField
                  label="Nivel académico"
                  value={NIVEL_LABELS[expediente?.nivel_academico] ?? expediente?.nivel_academico}
                  icon={GraduationCap}
                />
                <LockedField label="Academia"         value={expediente?.nombre_academia} />
                <LockedField label="Antigüedad desde" value={formatFecha(expediente?.antiguedad_fecha)} />
              </div>
            </div>

            {/* ── C: Contacto y Domicilio ── */}
            <div className="space-y-6">
              <SectionHeader
                title="Contacto y Domicilio"
                subtitle="Puedes actualizar estos datos en cualquier momento."
              />

              {/* Fila 1: Celular · CP · Colonia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Phone className="w-4 h-4 mr-2" />
                    Celular <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="celular"
                    value={formData.celular}
                    onChange={handleChange}
                    maxLength={10}
                    placeholder="5512345678"
                    className={`${inputBaseClass} ${getValidationClass(errores.celular)}`}
                  />
                  {errores.celular && (
                    <p className="text-xs font-bold text-red-500 mt-1.5">{errores.celular}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <Hash className="w-4 h-4 mr-2" />
                    Código Postal
                    {estado && (
                      <span className="ml-1.5 text-xs font-medium text-slate-400 normal-case">
                        ({estado})
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="cp"
                      value={formData.cp}
                      onChange={handleChange}
                      maxLength={5}
                      placeholder="97000"
                      className={`${inputBaseClass} ${getValidationClass(errores.cp)}`}
                    />
                    {loadingCP && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>
                  {errores.cp && (
                    <p className="text-xs font-bold text-red-500 mt-1.5">{errores.cp}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    Colonia
                  </label>
                  {coloniaOptions.length > 0 ? (
                    <select
                      name="colonia"
                      value={formData.colonia}
                      onChange={handleChange}
                      className={`${inputBaseClass} border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828] appearance-none cursor-pointer`}
                    >
                      <option value="">Seleccione una colonia</option>
                      {coloniaOptions.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="colonia"
                      value={formData.colonia}
                      readOnly={formData.cp.length < 5}
                      onChange={formData.cp.length >= 5 ? handleChange : undefined}
                      placeholder={formData.cp.length < 5 ? "Ingresa primero el C.P." : "Colonia"}
                      className={`${inputBaseClass} ${
                        formData.cp.length < 5
                          ? "bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                          : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]"
                      }`}
                    />
                  )}
                </div>
              </div>

              {/* Fila 2: Calle · Número */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    Calle
                  </label>
                  <input
                    type="text"
                    name="calle"
                    value={formData.calle}
                    onChange={handleChange}
                    placeholder="Av. Ejemplo"
                    className={`${inputBaseClass} border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828] mb-2">
                    Número
                  </label>
                  <input
                    type="text"
                    name="numero"
                    value={formData.numero}
                    onChange={handleChange}
                    placeholder="123"
                    className={`${inputBaseClass} border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]`}
                  />
                </div>
              </div>
            </div>

            {/* ── D: Documentos Digitales ── */}
            <div className="space-y-6">
              <SectionHeader
                title="Documentos Digitales"
                subtitle="Visualiza tus archivos vigentes o sube una versión actualizada."
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOCUMENTOS.map((doc) => (
                  <DocCard
                    key={doc.id}
                    doc={doc}
                    urlActual={getDocUrl(doc.tipo)}
                    archivo={archivos[doc.id]}
                    onFileChange={handleFileChange}
                  />
                ))}
              </div>
            </div>

            {/* ── Submit — mismo estilo que UserForm ── */}
            <div className="pt-8 border-t border-dashed border-slate-200 mt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg ${
                  isSubmitting
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300"
                    : "bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Guardando cambios...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-6 h-6 mr-2 text-white" />
                    Guardar cambios
                  </span>
                )}
              </button>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};