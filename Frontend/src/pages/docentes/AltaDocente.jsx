import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, FileText, X, CheckCircle, RefreshCw, ExternalLink, User, Mail, ImagePlus, ChevronRight, Copy, Loader2, Lock } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth"; 
import { TOAST_DOCENTES, TOAST_COMMON } from "../../../constants/toastMessages";

const calcularRaizRFC = (nombres, paterno, materno) => {
  if (!nombres || !paterno) return "";
  const limpia = (str) => str.toUpperCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-ZÑ\s]/g, '');

  const nom = limpia(nombres);
  const pat = limpia(paterno);
  const mat = limpia(materno) || "X";

  const partesNom = nom.split(/\s+/).filter(n => n.length > 0);
  let nombreUsar = partesNom[0];
  if (partesNom.length > 1 && ["JOSE", "MARIA", "MA", "J"].includes(nombreUsar)) {
    nombreUsar = partesNom[1];
  }

  const patInicial = pat.charAt(0) || "X";
  
  let patVocal = "X";
  for (let i = 1; i < pat.length; i++) {
    if (["A", "E", "I", "O", "U"].includes(pat.charAt(i))) {
      patVocal = pat.charAt(i);
      break;
    }
  }

  const matInicial = mat.charAt(0) || "X";
  const nomInicial = nombreUsar.charAt(0) || "X";

  let raiz = `${patInicial}${patVocal}${matInicial}${nomInicial}`.replace(/Ñ/g, 'X');

  const groserias = ["BACA","BAKA","BUEI","BUEY","CACA","CACO","CAGA","CAGO","CAKA","CAKO","COGE","COGI","COJA","COJE","COJI","COJO","COLA","CULO","FALO","JETA","JOTO","MACA","MACO","MAME","MAMI","MAMO","MEAR","MEAS","MEON","MIAR","MION","MOCO","OKUP","PEDA","PEDO","PENE","PIPI","PITO","POPO","PUTA","PUTO","QULO","RATA","ROBA","ROBE","ROBO","RUIN","SENO","TETA","VACA","VAGA","VAGO","VAKA","VUEI","VUEY","WUEI","WUEY"];

  if (groserias.includes(raiz)) {
    raiz = raiz.substring(0, 3) + 'X';
  }

  return raiz;
};

export const AltaDocente = ({ onBack, onSuccess, docenteToEdit }) => {
  const { user } = useAuth();
  const isEditing = !!docenteToEdit;
  
// --- REGLA DE ROLES (RBAC) EXPLICITA Y SEGURA ---
  const rolId = Number(user?.rol_id);
  const tienePrivilegiosAdmin = rolId === 1 || rolId === 2 || user?.rol === 'Superadministrador' || user?.rol === 'Administrador';
  
  const bloquearCamposLegales = isEditing && !tienePrivilegiosAdmin;

  const [paso, setPaso] = useState(isEditing ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [credenciales, setCredenciales] = useState({ matricula: "", password: "" });
  const [copied, setCopied] = useState(false);

  const [academiasDisponibles, setAcademiasDisponibles] = useState([]);
  const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
  const [estadoRepublica, setEstadoRepublica] = useState("");
  const [errores, setErrores] = useState({});

  const hoy = new Date();
  const fechaActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  const [formData, setFormData] = useState({
    nombres: "", apellido_paterno: "", apellido_materno: "",
    personal_email: "", institutional_email: "",
    rfc: "", curp: "", celular: "", 
    calle: "", numero: "", colonia: "", cp: "",
    clave_ine: "", fecha_ingreso: fechaActual,
    nivel_academico: "", academia_id: ""
  });

  const [archivos, setArchivos] = useState({
    foto_perfil_url: null, titulo: null, cedula: null, sat: null, ine: null, domicilio: null, cv: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:3000';
  
  const documentosRequeridos = [
    { id: "titulo",    tipoBackend: "TITULO",             label: "Título" },
    { id: "cedula",    tipoBackend: "CEDULA",             label: "Cédula" },
    { id: "sat",       tipoBackend: "CONSTANCIA_FISCAL",  label: "Constancia SAT" },
    { id: "ine",       tipoBackend: "INE",                label: "INE" },
    { id: "domicilio", tipoBackend: "COMPROBANTE_DOMICILIO", label: "Comprobante" },
    { id: "cv",        tipoBackend: "CV",                 label: "CV" }
  ];

  const getDocumentoUrl = (tipoBackend) => {
    if (!isEditing || !docenteToEdit?.documentos) return null;
    const doc = docenteToEdit.documentos.find(d => d.tipo_documento === tipoBackend);
    return doc ? doc.url_archivo : null;
  };

  const regexRFC  = /^([A-ZÑ&]{4})\d{6}([A-Z0-9]{3})$/;
  const regexCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const resAcademias = await api.get("/academias"); 
        setAcademiasDisponibles(resAcademias.data);
      } catch (error) {
        toast.error(TOAST_DOCENTES.errorCargaAcademias);
      }
    };
    fetchCatalogos();
  }, []);

  useEffect(() => {
    if (isEditing && docenteToEdit) {
      let calleExtraida = "", numeroExtraido = "", coloniaExtraida = "", cpExtraido = "";
      if (docenteToEdit.domicilio) {
        const match = docenteToEdit.domicilio.match(/(.*?) Num\. (.*?), Col\. (.*?), C\.P\. (\d{5})/);
        if (match) {
          calleExtraida = match[1]; numeroExtraido = match[2]; coloniaExtraida = match[3]; cpExtraido = match[4];
        } else {
          calleExtraida = docenteToEdit.domicilio; 
        }
      }
      setFormData(prev => ({
        ...prev,
        nombres: docenteToEdit.nombres || "",
        apellido_paterno: docenteToEdit.apellido_paterno || "",
        apellido_materno: docenteToEdit.apellido_materno || "",
        rfc: docenteToEdit.rfc || "",
        curp: docenteToEdit.curp || "",
        celular: docenteToEdit.celular || "",
        calle: calleExtraida, numero: numeroExtraido, colonia: coloniaExtraida, cp: cpExtraido,
        clave_ine: docenteToEdit.clave_ine || "",
        fecha_ingreso: docenteToEdit.antiguedad_fecha ? docenteToEdit.antiguedad_fecha.split('T')[0] : fechaActual,
        nivel_academico: docenteToEdit.nivel_academico || "",
        academia_id: docenteToEdit.academia_id || ""
      }));
    }
  }, [isEditing, docenteToEdit, fechaActual]);

  useEffect(() => {
    if (formData.cp && formData.cp.length === 5) {
      const fetchCP = async () => {
        try {
          const res = await fetch(`https://api.zippopotam.us/mx/${formData.cp}`);
          if (res.ok) {
            const data = await res.json();
            setEstadoRepublica(data.places[0].state);
            const colonias = data.places.map(place => place["place name"]);
            setColoniasDisponibles(colonias);
            if (colonias.length === 1 && !formData.colonia) {
              setFormData(prev => ({ ...prev, colonia: colonias[0] }));
            }
          }
        } catch (error) {
          console.error("Error al buscar CP", error);
        }
      };
      fetchCP();
    }
  }, [formData.cp]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleKeyDownStrict = (e) => { if (e.key === " ") e.preventDefault(); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (['nombres', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '').replace(/\s{2,}/g, ' '); 
    } else if (['personal_email', 'institutional_email'].includes(name)) {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase(); 
    } else if (name === "rfc" || name === "curp" || name === "clave_ine") {
      sanitizedValue = sanitizedValue.toUpperCase().replace(/[^A-Z0-9Ñ]/g, "");
      
      let errorMsj = null;
      if (name === "rfc" && !regexRFC.test(sanitizedValue) && sanitizedValue !== "") errorMsj = "Formato inválido";
      if (name === "curp" && !regexCURP.test(sanitizedValue) && sanitizedValue !== "") errorMsj = "Formato inválido";

      if (!errorMsj && sanitizedValue.length >= 4 && formData.nombres) {
        const raizEsperada = calcularRaizRFC(formData.nombres, formData.apellido_paterno, formData.apellido_materno);
        const raizIngresada = sanitizedValue.substring(0, 4).replace(/Ñ/g, 'X');
        if (raizIngresada !== raizEsperada) errorMsj = `No coincide, porfavor verifique`;
      }

      setErrores(prev => ({ ...prev, [name]: errorMsj }));
    } else if (name === "celular" || name === "cp") {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (errores[name] && !['rfc', 'curp'].includes(name)) setErrores({ ...errores, [name]: null });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      if (name === 'foto_perfil_url' && file.type.startsWith('image/')) {
        setArchivos(prev => ({ ...prev, [name]: file }));
        setPreviewUrl(URL.createObjectURL(file));
      } else if (file.type === "application/pdf") {
        setArchivos((prev) => ({ ...prev, [name]: file }));
      } else {
        toast.error(TOAST_DOCENTES.archivoFormatoInvalido);
        e.target.value = null; 
      }
    }
  };

  const validarPaso1 = () => {
    const newErrors = {};
    if (!formData.nombres.trim()) newErrors.nombres = "Requerido";
    if (!formData.apellido_paterno.trim()) newErrors.apellido_paterno = "Requerido";
    if (!formData.apellido_materno.trim()) newErrors.apellido_materno = "Requerido";
    if (!regexEmail.test(formData.personal_email)) newErrors.personal_email = "Correo inválido";
    if (!regexEmail.test(formData.institutional_email)) newErrors.institutional_email = "Correo inválido";
    
    setErrores(newErrors);
    if (Object.keys(newErrors).length === 0) setPaso(2);
    else toast.error(TOAST_DOCENTES.validarPaso1);
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    if (errores.rfc || errores.curp || formData.rfc.length < 13 || formData.curp.length < 18) {
      toast.error("Por favor, corrige los formatos de RFC o CURP antes de continuar.");
      return;
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowModal(false);
    const toastId = toast.loading(
      isEditing ? TOAST_DOCENTES.loadingActualizar : TOAST_DOCENTES.loadingRegistrar
    );

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "fecha_ingreso") form.append(key, formData[key].split("T")[0]); 
        else form.append(key, formData[key]);
      });

      if (isEditing && user?.id_usuario) form.append("modificado_por", user.id_usuario);
      else if (user?.id_usuario) form.append("creado_por", user.id_usuario);

      Object.keys(archivos).forEach((key) => { if (archivos[key]) form.append(key, archivos[key]); });

      if (isEditing) {
        await api.put(`/docentes/${docenteToEdit.id_docente}`, form);
        toast.success(TOAST_DOCENTES.actualizadoOk, { id: toastId });
        if (onSuccess) onSuccess();
      } else {
        const response = await api.post("/docentes/registrar", form);
        toast.success(TOAST_DOCENTES.registradoOk, { id: toastId });
        setCredenciales({
          matricula: response.data.matricula_generada,
          password: response.data.password_temporal
        });
        setRegistroExitoso(true);
      }
    } catch (error) {
      const msg = error.response?.data?.error || TOAST_COMMON.errorServidor;
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(credenciales.password);
    setCopied(true);
    toast.success(TOAST_COMMON.contrasenaCopiadaPortapapeles);
    setTimeout(() => setCopied(false), 2000);
  };

  if (registroExitoso) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 text-center max-w-lg mx-auto">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">¡Alta de docente exitosa!</h2>
          <p className="text-slate-600 font-medium mb-6">El expediente digital y el usuario de acceso han sido creados bajo la misma transacción de base de datos.</p>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-4 flex justify-between items-center">
            <span className="text-sm text-slate-500 font-bold">Matrícula generada:</span>
            <span className="text-xl font-black text-blue-700 tracking-widest">{credenciales.matricula}</span>
          </div>

          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 relative group">
            <span className="block text-sm text-slate-500 font-bold mb-2">Contraseña temporal:</span>
            <code className="text-3xl font-mono font-black text-slate-900 tracking-wider">{credenciales.password}</code>
            <button
              onClick={handleCopyPassword}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all focus:ring-2 focus:ring-blue-100"
              title="Copiar contraseña"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button onClick={() => onSuccess()} className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition-all">
            Entendido, volver al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">

      <div className="bg-slate-50/50 px-6 py-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditing ? "Editar expediente de docente" : "Nuevo expediente de docente"}
            </h2>
            {!isEditing && (
              <p className="text-sm text-slate-500 font-medium mt-0.5">Paso {paso} de 2</p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={paso === 2 ? handleOpenModal : (e) => e.preventDefault()} className="p-6 md:p-8">
        
        {paso === 1 && !isEditing && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* ... Contenido del Paso 1 sin cambios ... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <User className="w-4 h-4 mr-2 text-blue-500" /> Nombres *
                </label>
                <input
                  type="text" name="nombres" value={formData.nombres} onChange={handleChange}
                  placeholder="Ej. Juan Carlos"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${errores.nombres ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
                {errores.nombres && <p className="text-xs font-bold text-red-500">{errores.nombres}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <User className="w-4 h-4 mr-2 opacity-0" /> Apellido paterno *
                </label>
                <input
                  type="text" name="apellido_paterno" value={formData.apellido_paterno} onChange={handleChange}
                  placeholder="Ej. Pérez"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${errores.apellido_paterno ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
                {errores.apellido_paterno && <p className="text-xs font-bold text-red-500">{errores.apellido_paterno}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <User className="w-4 h-4 mr-2 opacity-0" /> Apellido materno *
                </label>
                <input
                  type="text" name="apellido_materno" value={formData.apellido_materno} onChange={handleChange}
                  placeholder="Ej. López"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${errores.apellido_materno ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
                {errores.apellido_materno && <p className="text-xs font-bold text-red-500">{errores.apellido_materno}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" /> Correo personal *
                </label>
                <input
                  type="email" name="personal_email" value={formData.personal_email} onChange={handleChange}
                  placeholder="juan@gmail.com"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${errores.personal_email ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
                {errores.personal_email && <p className="text-xs font-bold text-red-500">{errores.personal_email}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" /> Correo institucional *
                </label>
                <input
                  type="email" name="institutional_email" value={formData.institutional_email} onChange={handleChange}
                  placeholder="j.perez@unid.edu.mx"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${errores.institutional_email ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
                {errores.institutional_email && <p className="text-xs font-bold text-red-500">{errores.institutional_email}</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center text-sm font-bold text-slate-700 mb-4">
                <ImagePlus className="w-4 h-4 mr-2 text-blue-500" /> Fotografía de perfil (Opcional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="h-28 w-28 rounded-full bg-white overflow-hidden border-4 border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  {previewUrl ? <img src={previewUrl} alt="Previsualización" className="h-full w-full object-cover" /> : <User className="h-12 w-12 text-slate-300" />}
                </div>
                <div className="w-full">
                  <input
                    type="file" name="foto_perfil_url" accept="image/*" onChange={handleFileChange}
                    className="block w-full text-slate-600 text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer transition-colors"
                  />
                  <p className="mt-2 text-xs font-medium text-slate-500">Formatos soportados: JPG, PNG, WEBP (Max: 10MB)</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button
                type="button" onClick={validarPaso1}
                className="flex items-center px-8 py-3 rounded-xl shadow-md font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all"
              >
                Siguiente paso <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: Expediente docente */}
        {paso === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
            {bloquearCamposLegales && (
              <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm font-medium border border-blue-100">
                <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                <p>Por políticas de seguridad, los datos legales (RFC, CURP, INE) solo pueden ser modificados por un Administrador.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">RFC *</label>
                <input
                  type="text" name="rfc" required maxLength="13" value={formData.rfc}
                  onChange={handleChange} onKeyDown={handleKeyDownStrict}
                  disabled={bloquearCamposLegales}
                  placeholder="XAXX010101000"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${bloquearCamposLegales ? 'bg-slate-100 cursor-not-allowed text-slate-500 font-medium' : 'bg-white'} ${errores.rfc ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
                {errores.rfc && <p className="text-xs font-bold text-red-500">{errores.rfc}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">CURP *</label>
                <input
                  type="text" name="curp" required maxLength="18" value={formData.curp}
                  onChange={handleChange} onKeyDown={handleKeyDownStrict}
                  disabled={bloquearCamposLegales}
                  placeholder="XAXX010101HXXXXXX0"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${bloquearCamposLegales ? 'bg-slate-100 cursor-not-allowed text-slate-500 font-medium' : 'bg-white'} ${errores.curp ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
                {errores.curp && <p className="text-xs font-bold text-red-500">{errores.curp}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">Celular *</label>
                <input
                  type="text" name="celular" required maxLength="10" value={formData.celular} onChange={handleChange}
                  placeholder="5512345678"
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all ${errores.celular ? 'border-red-300 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">C.P. *</label>
                <input
                  type="text" name="cp" required maxLength="5" value={formData.cp} onChange={handleChange}
                  placeholder="97000"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <div className="col-span-3 space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">
                  Colonia *
                  {estadoRepublica && <span className="ml-2 text-xs font-medium text-slate-400">({estadoRepublica})</span>}
                </label>
                {coloniasDisponibles.length > 0 ? (
                  <select
                    name="colonia" required value={formData.colonia} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Seleccione una colonia</option>
                    {coloniasDisponibles.map((col, idx) => <option key={idx} value={col}>{col}</option>)}
                  </select>
                ) : (
                  <input
                    type="text" name="colonia" required value={formData.colonia} onChange={handleChange}
                    placeholder="Nombre de la colonia"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <label className="flex items-center text-sm font-bold text-slate-700">Calle *</label>
                  <input
                    type="text" name="calle" required value={formData.calle} onChange={handleChange}
                    placeholder="Av. Reforma"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div className="w-28 space-y-2">
                  <label className="flex items-center text-sm font-bold text-slate-700">No. *</label>
                  <input
                    type="text" name="numero" required value={formData.numero} onChange={handleChange}
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">Clave INE *</label>
                <input
                  type="text" name="clave_ine" required value={formData.clave_ine} onChange={handleChange}
                  disabled={bloquearCamposLegales}
                  placeholder="IDMEX..."
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 transition-all uppercase ${bloquearCamposLegales ? 'bg-slate-100 cursor-not-allowed text-slate-500 font-medium' : 'bg-white'} border-slate-200 focus:ring-blue-100`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">Grado máximo *</label>
                <select
                  name="nivel_academico" required value={formData.nivel_academico} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Seleccione --</option>
                  <option value="Licenciatura">Licenciatura</option>
                  <option value="Maestria">Maestría</option>
                  <option value="Doctorado">Doctorado</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-slate-700">Academia *</label>
                <select
                  name="academia_id" required value={formData.academia_id} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Seleccione una academia --</option>
                  {academiasDisponibles.map(a => <option key={a.id_academia} value={a.id_academia}>{a.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Archivos digitales del expediente</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {documentosRequeridos.map((doc) => {
                  const urlActual = getDocumentoUrl(doc.tipoBackend);
                  return (
                    <div key={doc.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center">
                          <FileText className="w-4 h-4 mr-1 text-blue-500" /> {doc.label}
                        </label>
                        {urlActual && (
                          <a href={`${BACKEND_URL}${urlActual}`} target="_blank" rel="noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center"
                          >
                            <ExternalLink className="inline w-3 h-3 mr-0.5" /> Ver
                          </a>
                        )}
                      </div>
                      <input
                        type="file" name={doc.id} accept="application/pdf"
                        required={!isEditing} onChange={handleFileChange}
                        className="block w-full text-xs file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-100">
              {!isEditing ? (
                <button
                  type="button" onClick={() => setPaso(1)}
                  className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Volver al paso 1
                </button>
              ) : <div />}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center px-8 py-3 rounded-xl shadow-md font-bold text-white disabled:opacity-50 transition-all ${
                  isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting
                  ? <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  : isEditing
                    ? <RefreshCw className="w-5 h-5 mr-2" />
                    : <CheckCircle className="w-5 h-5 mr-2" />
                }
                {isEditing ? "Actualizar expediente" : "Finalizar y guardar"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Modal de confirmación */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">Confirmar registro</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4 font-medium">Esta acción realizará inserciones dependientes en la base de datos. ¿Los datos son correctos?</p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm space-y-2">
                <div className="flex">
                  <span className="font-bold w-1/3 text-slate-700">RFC:</span>
                  <span className="text-slate-600">{formData.rfc}</span>
                </div>
                <div className="flex">
                  <span className="font-bold w-1/3 text-slate-700">Correo inst.:</span>
                  <span className="text-slate-600">{formData.institutional_email || 'No modificado'}</span>
                </div>
              </div>
            </div>
            <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-5 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};