import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, FileText, X, CheckCircle, RefreshCw, ExternalLink, User, Mail, ImagePlus, ChevronRight, Copy, Loader2, Lock, CheckCircle2, Phone, MapPin, AlertCircle } from "lucide-react";

const NIVEL_LABELS = {
  LICENCIATURA: "Licenciatura",
  MAESTRIA:     "Maestría",
  DOCTORADO:    "Doctorado",
};
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth"; 
import { TOAST_DOCENTES, TOAST_COMMON } from "../../../constants/toastMessages";
import { formatToGlobalUppercase } from "../../utils/textFormatter";
import { REGEX } from "../../utils/regex";

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
  
  const rolId = Number(user?.rol_id);
  const tienePrivilegiosAdmin = rolId === 1 || rolId === 2 || user?.rol === 'Superadministrador' || user?.rol === 'Administrador';
  
  const bloquearCamposLegales = isEditing && !tienePrivilegiosAdmin;

  const [paso, setPaso] = useState(isEditing ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(!isEditing);

  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [credenciales, setCredenciales] = useState({ matricula: "", password: "" });
  const [copied, setCopied] = useState(false);

  const [academiasDisponibles, setAcademiasDisponibles] = useState([]);
  const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
  const [estadoRepublica, setEstadoRepublica] = useState("");
  const [loadingCP, setLoadingCP] = useState(false);
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
  const regexCURP = /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d$/;

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
        personal_email: docenteToEdit.personal_email || "",
        institutional_email: docenteToEdit.institutional_email || "",
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
    if (!isEditing || !docenteToEdit) { setIsFormDirty(true); return; }

    const orig = (() => {
      if (!docenteToEdit.domicilio) return { calle: "", numero: "", colonia: "", cp: "" };
      const m = docenteToEdit.domicilio.match(/(.*?) Num\. (.*?), Col\. (.*?), C\.P\. (\d{5})/);
      return m ? { calle: m[1], numero: m[2], colonia: m[3], cp: m[4] }
               : { calle: docenteToEdit.domicilio, numero: "", colonia: "", cp: "" };
    })();

    const hasChanged =
      formData.rfc            !== (docenteToEdit.rfc            || "") ||
      formData.curp           !== (docenteToEdit.curp           || "") ||
      formData.clave_ine      !== (docenteToEdit.clave_ine      || "") ||
      formData.celular        !== (docenteToEdit.celular        || "") ||
      formData.calle          !== orig.calle  ||
      formData.numero         !== orig.numero ||
      formData.colonia        !== orig.colonia ||
      formData.cp             !== orig.cp     ||
      formData.nivel_academico !== (docenteToEdit.nivel_academico || "") ||
      String(formData.academia_id) !== String(docenteToEdit.academia_id || "") ||
      Object.values(archivos).some(f => f !== null);

    setIsFormDirty(hasChanged);
  }, [formData, archivos, docenteToEdit, isEditing]);

  useEffect(() => {
    if (formData.cp && formData.cp.length === 5) {
      setLoadingCP(true);
      (async () => {
        try {
          const res = await fetch(`https://api.zippopotam.us/mx/${formData.cp}`);
          if (res.ok) {
            const data = await res.json();
            setEstadoRepublica(data.places[0].state);
            const colonias = data.places.map(place => place["place name"]);
            setColoniasDisponibles(colonias);
            setErrores(prev => ({ ...prev, cp: null }));
            if (colonias.length === 1 && !formData.colonia) {
              setFormData(prev => ({ ...prev, colonia: colonias[0] }));
              setErrores(prev => { const n = {...prev}; delete n.colonia; return n; });
            }
          } else {
            setColoniasDisponibles([]);
            setEstadoRepublica("");
            setErrores(prev => ({ ...prev, cp: "Código postal no encontrado" }));
          }
        } catch {
          setColoniasDisponibles([]);
          setEstadoRepublica("");
          setErrores(prev => ({ ...prev, cp: "Error de conexión al validar C.P." }));
        } finally {
          setLoadingCP(false);
        }
      })();
    } else {
      setColoniasDisponibles(prev => prev.length ? [] : prev);
      setEstadoRepublica(prev => prev ? "" : prev);
    }
  }, [formData.cp]);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const handleKeyDownStrict = (e) => { if (e.key === " ") e.preventDefault(); };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const formattedValue = formatToGlobalUppercase(value, name, type);
    let sanitizedValue = formattedValue;

    if (['nombres', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      sanitizedValue = sanitizedValue
        .replace(/[^a-zA-ZÀ-ÿ\u00f1\u00d1\s]/g, '')
        .replace(/^\s+/g, '')
        .replace(/\s{2,}/g, ' ');
      if (REGEX.TRIPLE_LETRA_REPETIDA.test(sanitizedValue)) return;
    } else if (['personal_email', 'institutional_email'].includes(name)) {
      sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9@._%-+]/g, '');
      const parts = sanitizedValue.split('@');
      if (parts.length > 2) {
        sanitizedValue = parts[0] + '@' + parts.slice(1).join('').replace(/@/g, '');
      }
    } else if (name === "rfc" || name === "curp" || name === "clave_ine") {
      sanitizedValue = sanitizedValue.toUpperCase().replace(/[^A-Z0-9Ñ]/g, "");
    } else if (name === "celular" || name === "cp") {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
    } else if (name === "calle" || name === "colonia") {
      sanitizedValue = sanitizedValue.replace(/^\s+/g, '');
      if (sanitizedValue && (!REGEX.ALFANUMERICO_ESPACIOS_PUNTUACION.test(sanitizedValue) || REGEX.TRIPLE_LETRA_REPETIDA.test(sanitizedValue))) return;
    } else if (name === "numero") {
      sanitizedValue = sanitizedValue.replace(/^\s+/g, '');
      if (sanitizedValue && (!REGEX.ALFANUMERICO_GUIONES.test(sanitizedValue) || REGEX.TRIPLE_LETRA_REPETIDA.test(sanitizedValue))) return;
    }

    const nextFormData = { ...formData, [name]: sanitizedValue };
    setFormData(nextFormData);
    
    // Ejecutar validación en tiempo real pura
    const errorMsj = validateField(name, sanitizedValue, nextFormData);
    setErrores(prev => {
      const newE = { ...prev };
      if (errorMsj) newE[name] = errorMsj;
      else delete newE[name];
      return newE;
    });
  };

  const validateField = (name, value, allData) => {
    let errorMsj = null;
    const valTrimmed = typeof value === 'string' ? value.trim() : value;
    
    if (name === 'nombres') {
      if (!valTrimmed) errorMsj = "El nombre es un campo obligatorio.";
      else if (valTrimmed.length < 3) errorMsj = "El nombre debe tener al menos 3 caracteres.";
      else if (!REGEX.NOMBRES.test(valTrimmed)) errorMsj = "Solo se permiten letras y un espacio simple entre palabras.";
      else if (REGEX.TRIPLE_LETRA_REPETIDA.test(valTrimmed)) errorMsj = "El nombre no puede contener tres o más letras iguales consecutivas.";
    } else if (name === 'apellido_paterno') {
      if (!valTrimmed) errorMsj = "El apellido paterno es un campo obligatorio.";
      else if (valTrimmed.length < 3) errorMsj = "El apellido paterno debe tener al menos 3 caracteres.";
      else if (!REGEX.NOMBRES.test(valTrimmed)) errorMsj = "Solo se permiten letras y un espacio simple entre palabras.";
      else if (REGEX.TRIPLE_LETRA_REPETIDA.test(valTrimmed)) errorMsj = "El apellido no puede contener tres o más letras iguales consecutivas.";
    } else if (name === 'apellido_materno') {
      if (!valTrimmed) errorMsj = "El apellido materno es un campo obligatorio.";
      else if (valTrimmed.length < 3) errorMsj = "El apellido materno debe tener al menos 3 caracteres.";
      else if (!REGEX.NOMBRES.test(valTrimmed)) errorMsj = "Solo se permiten letras y un espacio simple entre palabras.";
      else if (REGEX.TRIPLE_LETRA_REPETIDA.test(valTrimmed)) errorMsj = "El apellido no puede contener tres o más letras iguales consecutivas.";
    } else if (name === 'personal_email') {
      if (!valTrimmed) errorMsj = "El correo personal es un campo obligatorio.";
      else if (!REGEX.EMAIL.test(valTrimmed)) errorMsj = "El formato del correo ingresado no es válido.";
    } else if (name === 'institutional_email') {
      if (!valTrimmed) errorMsj = "El correo institucional es un campo obligatorio.";
      else if (!REGEX.EMAIL.test(valTrimmed)) errorMsj = "El formato del correo ingresado no es válido.";
    }
    else if (name === "rfc") {
      if (!valTrimmed) errorMsj = "El RFC es obligatorio.";
      else if (valTrimmed.length < 13) errorMsj = "El RFC debe tener 13 caracteres.";
      else if (!regexRFC.test(valTrimmed)) errorMsj = "Formato inválido";
    }
    else if (name === "curp") {
      if (!valTrimmed) errorMsj = "El CURP es obligatorio.";
      else if (valTrimmed.length < 18) errorMsj = "El CURP debe tener 18 caracteres.";
      else if (!regexCURP.test(valTrimmed)) errorMsj = "Formato inválido";
    }
    else if (name === "clave_ine") {
      if (!valTrimmed && !bloquearCamposLegales) errorMsj = "La clave INE es obligatoria.";
    }
    else if (name === "nivel_academico" && !bloquearCamposLegales) {
      if (!valTrimmed) errorMsj = "El nivel académico es obligatorio.";
    }
    else if (name === "academia_id" && !bloquearCamposLegales) {
      if (!valTrimmed) errorMsj = "La academia es obligatoria.";
    }
    else if (name === "celular") {
      if (!valTrimmed || valTrimmed.length !== 10) errorMsj = "El celular debe tener exactamente 10 dígitos.";
    }
    else if (name === "cp") {
      if (!valTrimmed || valTrimmed.length !== 5) errorMsj = "El código postal es obligatorio y debe tener 5 dígitos.";
    }
    else if (name === "colonia") {
      if (!valTrimmed) errorMsj = "La colonia es un campo obligatorio.";
    }
    else if (name === "calle") {
      if (!valTrimmed) errorMsj = "La calle es un campo obligatorio.";
    }
    else if (name === "numero") {
      if (!valTrimmed) errorMsj = "El número es un campo obligatorio.";
    }

    if ((name === "rfc" || name === "curp" || name === "clave_ine") && valTrimmed && valTrimmed.length >= 4 && !errorMsj) {
      const raizEsperada = calcularRaizRFC(allData.nombres, allData.apellido_paterno, allData.apellido_materno);
      const raizIngresada = valTrimmed.substring(0, 4).replace(/Ñ/g, 'X');
      if (raizIngresada !== raizEsperada) {
         errorMsj = `No coincide, por favor verifique`;
      }
    }
    return errorMsj;
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    let finalValue = value.trim();

    if (['personal_email', 'institutional_email'].includes(name)) {
      finalValue = finalValue.toLowerCase();
      
      if (finalValue && (!isEditing || finalValue !== docenteToEdit[name])) {
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
    if (!formData.nombres.trim()) newErrors.nombres = "El nombre es un campo obligatorio.";
    else if (formData.nombres.trim().length < 3) newErrors.nombres = "El nombre debe tener al menos 3 caracteres.";
    else if (!REGEX.NOMBRES.test(formData.nombres)) newErrors.nombres = "Solo se permiten letras y un espacio simple entre palabras.";
    else if (REGEX.TRIPLE_LETRA_REPETIDA.test(formData.nombres)) newErrors.nombres = "El nombre no puede contener tres o más letras iguales consecutivas.";

    if (!formData.apellido_paterno.trim()) newErrors.apellido_paterno = "El apellido paterno es un campo obligatorio.";
    else if (formData.apellido_paterno.trim().length < 3) newErrors.apellido_paterno = "El apellido paterno debe tener al menos 3 caracteres.";
    else if (!REGEX.NOMBRES.test(formData.apellido_paterno)) newErrors.apellido_paterno = "Solo se permiten letras y un espacio simple entre palabras.";
    else if (REGEX.TRIPLE_LETRA_REPETIDA.test(formData.apellido_paterno)) newErrors.apellido_paterno = "El apellido no puede contener tres o más letras iguales consecutivas.";

    if (!formData.apellido_materno.trim()) newErrors.apellido_materno = "El apellido materno es un campo obligatorio.";
    else if (formData.apellido_materno.trim().length < 3) newErrors.apellido_materno = "El apellido materno debe tener al menos 3 caracteres.";
    else if (!REGEX.NOMBRES.test(formData.apellido_materno)) newErrors.apellido_materno = "Solo se permiten letras y un espacio simple entre palabras.";
    else if (REGEX.TRIPLE_LETRA_REPETIDA.test(formData.apellido_materno)) newErrors.apellido_materno = "El apellido no puede contener tres o más letras iguales consecutivas.";
    
    if (!formData.personal_email) {
      newErrors.personal_email = "El correo personal es un campo obligatorio.";
    } else if (!REGEX.EMAIL.test(formData.personal_email)) {
      newErrors.personal_email = "El formato del correo ingresado no es válido.";
    }

    if (!formData.institutional_email) {
      newErrors.institutional_email = "El correo institucional es un campo obligatorio.";
    } else if (!REGEX.EMAIL.test(formData.institutional_email)) {
      newErrors.institutional_email = "El formato del correo ingresado no es válido.";
    }

    if (errores.personal_email?.includes('registrado')) newErrors.personal_email = errores.personal_email;
    if (errores.institutional_email?.includes('registrado')) newErrors.institutional_email = errores.institutional_email;
    
    setErrores(newErrors);
    if (Object.keys(newErrors).length === 0) setPaso(2);
    else toast.error(TOAST_DOCENTES.validarPaso1);
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Propagar errores de formato en tiempo real
    if (errores.rfc)    newErrors.rfc    = errores.rfc;
    if (errores.curp)   newErrors.curp   = errores.curp;
    if (errores.calle)  newErrors.calle  = errores.calle;
    if (errores.numero) newErrors.numero = errores.numero;
    if (errores.colonia) newErrors.colonia = errores.colonia;
    if (errores.cp)     newErrors.cp     = errores.cp;

    // Validaciones requeridas + formato
    if (!formData.rfc || formData.rfc.length < 13)
      newErrors.rfc  = newErrors.rfc  || "El RFC debe tener 13 caracteres.";
    if (!formData.curp || formData.curp.length < 18)
      newErrors.curp = newErrors.curp || "El CURP debe tener 18 caracteres.";

    if (!bloquearCamposLegales) {
      if (!formData.clave_ine)       newErrors.clave_ine      = "La clave INE es obligatoria.";
      if (!formData.nivel_academico) newErrors.nivel_academico = "El nivel académico es obligatorio.";
      if (!formData.academia_id)     newErrors.academia_id    = "La academia es obligatoria.";
    }

    if (!formData.celular || formData.celular.length !== 10)
      newErrors.celular = "El celular debe tener exactamente 10 dígitos.";

    if (!formData.cp || formData.cp.length !== 5)
      newErrors.cp = "El código postal es obligatorio y debe tener 5 dígitos.";

    if (!formData.colonia)
      newErrors.colonia = newErrors.colonia || "La colonia es un campo obligatorio.";

    if (!formData.calle?.trim()) {
      newErrors.calle = newErrors.calle || "La calle es un campo obligatorio.";
    }

    if (!formData.numero?.trim()) {
      newErrors.numero = newErrors.numero || "El número es un campo obligatorio.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrores(prev => ({ ...prev, ...newErrors }));
      toast.error("Por favor, completa todos los campos requeridos antes de continuar.");
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
      if (error.response?.status === 409 && error.response.data?.detalles) {
        toast.error(`Operación denegada: ${error.response.data.detalles}`, { id: toastId, duration: 8000 });
      } else {
        const msg = error.response?.data?.error || TOAST_COMMON.errorServidor;
        toast.error(`Error: ${msg}`, { id: toastId });
      }
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
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-300 relative">
        <div className="bg-[#0B1828] h-16 w-full absolute top-0 left-0 z-0"></div>
        <div className="p-8 text-center max-w-lg mx-auto relative z-10 pt-12">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 border-4 border-white shadow-md mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-[#0B1828] mb-2">¡Alta de docente exitosa!</h2>
          <p className="text-slate-600 font-medium mb-6">El expediente digital y el usuario de acceso han sido creados bajo la misma transacción de base de datos.</p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-4 flex justify-between items-center shadow-inner">
            <span className="text-sm text-[#0B1828] font-bold">Matrícula generada:</span>
            <span className="text-xl font-black text-[#0B1828] tracking-widest">{credenciales.matricula}</span>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 relative group shadow-inner">
            <span className="block text-sm text-[#0B1828] font-bold mb-2">Contraseña temporal:</span>
            <code className="text-3xl font-mono font-black text-[#0B1828] tracking-wider">{credenciales.password}</code>
            <button
              onClick={handleCopyPassword}
              className="absolute top-4 right-4 p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-[#0B1828] hover:bg-slate-50 transition-all active:scale-95 focus:ring-2 focus:ring-slate-400"
              title="Copiar contraseña"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <button onClick={() => onSuccess()} className="w-full py-4 px-4 bg-[#0B1828] text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-[#0B1828]/30 hover:bg-[#162840] transition-all active:scale-[0.98]">
            Entendido, volver al listado
          </button>
        </div>
      </div>
    );
  }

  const coloniaOptions = coloniasDisponibles.length > 0
    ? (coloniasDisponibles.includes(formData.colonia) ? coloniasDisponibles : [formData.colonia, ...coloniasDisponibles].filter(Boolean))
    : [];

  const isSubmitDisabled = isSubmitting || (isEditing && !isFormDirty);

  const inputBaseClass =
    "w-full px-4 py-3.5 rounded-xl border text-sm focus:ring-1 transition-all text-[#0B1828] font-medium shadow-sm outline-none " +
    "[&:autofill]:shadow-[inset_0_0_0px_1000px_#fff] [&:autofill]:[-webkit-text-fill-color:#0B1828]";
  const getValidationClass = (hasError) => 
    hasError 
      ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
      : "border-slate-200 bg-white focus:border-[#0B1828] focus:ring-[#0B1828]";

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-8 relative">

      <div className="bg-[#0B1828] px-6 py-5 flex items-center shadow-md relative z-10">
        <button onClick={onBack} className="mr-4 p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all active:scale-95">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white">
            {isEditing ? "Modificar docente" : "Nuevo docente"}
          </h2>
          {!isEditing && (
            <p className="text-sm text-white/60 font-medium mt-0.5">Paso {paso} de 2</p>
          )}
        </div>
      </div>

      <form noValidate onSubmit={paso === 2 ? handleOpenModal : (e) => e.preventDefault()} className="p-6 md:p-10">
        
        {paso === 1 && !isEditing && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto">
            
            <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl mb-8 w-fit">
              <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span> 
              Indica un campo obligatorio para el sistema
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]">
                  <User className="w-4 h-4 mr-2" /> Nombres <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="text" name="nombres" maxLength="50" value={formData.nombres} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Ej. Juan Carlos"
                  className={`${inputBaseClass} ${getValidationClass(errores.nombres)}`}
                />
                {errores.nombres && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nombres}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]">
                  <User className="w-4 h-4 mr-2 opacity-0" /> Apellido paterno <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="text" name="apellido_paterno" maxLength="50" value={formData.apellido_paterno} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Ej. Pérez"
                  className={`${inputBaseClass} ${getValidationClass(errores.apellido_paterno)}`}
                />
                {errores.apellido_paterno && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.apellido_paterno}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]">
                  <User className="w-4 h-4 mr-2 opacity-0" /> Apellido materno <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="text" name="apellido_materno" maxLength="50" value={formData.apellido_materno} onChange={handleChange} onBlur={handleBlur}
                  placeholder="Ej. López"
                  className={`${inputBaseClass} ${getValidationClass(errores.apellido_materno)}`}
                />
                {errores.apellido_materno && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.apellido_materno}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]">
                  <Mail className="w-4 h-4 mr-2" /> Correo personal <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="email" name="personal_email" maxLength="100" value={formData.personal_email} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDownStrict}
                  placeholder="juan@gmail.com"
                  className={`${inputBaseClass} ${getValidationClass(errores.personal_email)}`}
                />
                {errores.personal_email && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.personal_email}</p>}
              </div>
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-[#0B1828]">
                  <Mail className="w-4 h-4 mr-2" /> Correo institucional <span className="text-[#0B1828] ml-1">*</span>
                </label>
                <input
                  type="email" name="institutional_email" maxLength="100" value={formData.institutional_email} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDownStrict}
                  placeholder="j.perez@red.unid.mx"
                  className={`${inputBaseClass} ${getValidationClass(errores.institutional_email)}`}
                />
                {errores.institutional_email && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.institutional_email}</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <label className="flex items-center text-sm font-bold text-[#0B1828] mb-4">
                <ImagePlus className="w-4 h-4 mr-2" /> Fotografía (Opcional)
              </label>
              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="h-28 w-28 rounded-full bg-white overflow-hidden border-4 border-white shadow-md flex items-center justify-center shrink-0">
                  {previewUrl ? <img src={previewUrl} alt="Previsualización" className="h-full w-full object-cover" /> : <User className="h-10 w-10 text-slate-300" />}
                </div>
                <div className="w-full">
                  <input
                    type="file" name="foto_perfil_url" accept="image/*" onChange={handleFileChange}
                    className="block w-full text-[#0B1828] text-sm file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-[#0B1828] file:text-white hover:file:bg-[#162840] hover:file:shadow-md cursor-pointer transition-all file:transition-all"
                  />
                  <p className="mt-3 text-xs font-medium text-slate-500 flex items-center">
                    <ImagePlus className="w-3.5 h-3.5 mr-1.5" /> Formatos soportados: JPG, PNG, WEBP (Max: 10MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-dashed border-slate-200 mt-2">
              <button
                type="button" onClick={validarPaso1}
                className="w-full flex justify-center items-center px-8 py-5 rounded-2xl font-black transition-all duration-300 text-lg bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
              >
                Siguiente Paso <ChevronRight className="w-6 h-6 ml-2" />
              </button>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-10 animate-in slide-in-from-right-8 duration-300 max-w-4xl mx-auto">

            <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl w-fit">
              <span className="text-[#0B1828] font-black mr-1.5 text-base leading-none">*</span>
              Indica un campo obligatorio para el sistema
            </div>

            {/* ── Datos Legales ── */}
            <div className="space-y-6">
              <div className="mb-6">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-black text-[#0B1828]">Datos Legales</h3>
                  {bloquearCamposLegales && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                      <Lock className="w-2.5 h-2.5" /> Solo lectura
                    </span>
                  )}
                </div>
                {bloquearCamposLegales && (
                  <p className="text-xs font-medium text-slate-400 mt-1">Gestionados exclusivamente por el área administrativa.</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">RFC <span className="text-[#0B1828] ml-1">*</span></label>
                  <input
                    type="text" name="rfc" maxLength="13" value={formData.rfc}
                    onChange={handleChange} onKeyDown={handleKeyDownStrict}
                    disabled={bloquearCamposLegales}
                    placeholder="XAXX010101000"
                    className={`${inputBaseClass} ${bloquearCamposLegales ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-mono' : 'bg-white'} ${errores.rfc ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-[#0B1828] focus:ring-[#0B1828]'}`}
                  />
                  {errores.rfc && <p className="text-xs font-bold text-red-500">{errores.rfc}</p>}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">CURP <span className="text-[#0B1828] ml-1">*</span></label>
                  <input
                    type="text" name="curp" maxLength="18" value={formData.curp}
                    onChange={handleChange} onKeyDown={handleKeyDownStrict}
                    disabled={bloquearCamposLegales}
                    placeholder="XAXX010101HXXXXXX0"
                    className={`${inputBaseClass} ${bloquearCamposLegales ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-mono' : 'bg-white'} ${errores.curp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-[#0B1828] focus:ring-[#0B1828]'}`}
                  />
                  {errores.curp && <p className="text-xs font-bold text-red-500">{errores.curp}</p>}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">Clave INE <span className="text-[#0B1828] ml-1">*</span></label>
                  <input
                    type="text" name="clave_ine" value={formData.clave_ine} onChange={handleChange}
                    disabled={bloquearCamposLegales}
                    maxLength="18"
                    placeholder="IDMEX..."
                    className={`${inputBaseClass} uppercase ${bloquearCamposLegales ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-mono border-slate-200' : getValidationClass(errores.clave_ine)}`}
                  />
                  {errores.clave_ine && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.clave_ine}</p>}
                </div>
              </div>
            </div>

            {/* ── Perfil Académico ── */}
            <div className="space-y-6">
              <div className="mb-6">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-black text-[#0B1828]">Perfil Académico</h3>
                  {bloquearCamposLegales && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                      <Lock className="w-2.5 h-2.5" /> Solo lectura
                    </span>
                  )}
                </div>
                {bloquearCamposLegales && (
                  <p className="text-xs font-medium text-slate-400 mt-1">Asignado por el área de gestión académica.</p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">Nivel académico <span className="text-[#0B1828] ml-1">*</span></label>
                  {bloquearCamposLegales ? (
                    <input
                      type="text" value={NIVEL_LABELS[formData.nivel_academico] ?? formData.nivel_academico} disabled readOnly
                      className={`${inputBaseClass} bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed font-mono`}
                    />
                  ) : (
                    <select
                      name="nivel_academico" value={formData.nivel_academico} onChange={handleChange}
                      className={`${inputBaseClass} appearance-none cursor-pointer ${getValidationClass(errores.nivel_academico)}`}
                    >
                      <option value="">Seleccione un nivel</option>
                      <option value="LICENCIATURA">Licenciatura</option>
                      <option value="MAESTRIA">Maestría</option>
                      <option value="DOCTORADO">Doctorado</option>
                    </select>
                  )}
                  {errores.nivel_academico && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.nivel_academico}</p>}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">Academia <span className="text-[#0B1828] ml-1">*</span></label>
                  {bloquearCamposLegales ? (
                    <input
                      type="text"
                      value={academiasDisponibles.find(a => String(a.id_academia) === String(formData.academia_id))?.nombre || formData.academia_id}
                      disabled readOnly
                      className={`${inputBaseClass} bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed font-mono`}
                    />
                  ) : (
                    <select
                      name="academia_id" value={formData.academia_id} onChange={handleChange}
                      className={`${inputBaseClass} appearance-none cursor-pointer ${getValidationClass(errores.academia_id)}`}
                    >
                      <option value="">Seleccione una academia</option>
                      {academiasDisponibles.map(a => <option key={a.id_academia} value={a.id_academia}>{a.nombre}</option>)}
                    </select>
                  )}
                  {errores.academia_id && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.academia_id}</p>}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">Fecha de ingreso</label>
                  <input
                    type="date" name="fecha_ingreso" value={formData.fecha_ingreso}
                    disabled readOnly
                    className={`${inputBaseClass} bg-slate-50 cursor-not-allowed text-slate-500 border-slate-200`}
                  />
                </div>
              </div>
            </div>

            {/* ── Contacto y Domicilio ── */}
            <div className="space-y-6">
              <div className="mb-6">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-black text-[#0B1828]">Contacto y Domicilio</h3>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-1">Puedes actualizar estos datos en cualquier momento.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">
                    <Phone className="w-4 h-4 mr-2" />
                    Celular <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="text" name="celular" maxLength="10" value={formData.celular} onChange={handleChange}
                    placeholder="5512345678"
                    className={`${inputBaseClass} ${getValidationClass(errores.celular)}`}
                  />
                  {errores.celular && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.celular}</p>}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">
                    C.P. <span className="text-[#0B1828] ml-1">*</span>
                    {estadoRepublica && <span className="ml-1.5 text-xs font-medium text-slate-400 normal-case">({estadoRepublica})</span>}
                  </label>
                  <div className="relative">
                    <input
                      type="text" name="cp" maxLength="5" value={formData.cp} onChange={handleChange}
                      placeholder="97000"
                      className={`${inputBaseClass} ${getValidationClass(errores.cp)}`}
                    />
                    {loadingCP && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>
                  {errores.cp && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.cp}</p>}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">
                    <MapPin className="w-4 h-4 mr-2" />
                    Colonia <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  {coloniaOptions.length > 0 ? (
                    <select
                      name="colonia" value={formData.colonia} onChange={handleChange}
                      className={`${inputBaseClass} appearance-none cursor-pointer ${getValidationClass(errores.colonia)}`}
                    >
                      <option value="">Seleccione una colonia</option>
                      {coloniaOptions.map((col, idx) => (
                        <option key={idx} value={col}>{col}</option>
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
                          : getValidationClass(errores.colonia)
                      }`}
                    />
                  )}
                  {errores.colonia && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.colonia}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">
                    <MapPin className="w-4 h-4 mr-2" />
                    Calle <span className="text-[#0B1828] ml-1">*</span>
                  </label>
                  <input
                    type="text" name="calle" value={formData.calle} onChange={handleChange}
                    placeholder="Av. Ejemplo"
                    className={`${inputBaseClass} ${getValidationClass(errores.calle)}`}
                  />
                  {errores.calle && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.calle}</p>}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-bold text-[#0B1828]">Número <span className="text-[#0B1828] ml-1">*</span></label>
                  <input
                    type="text" name="numero" value={formData.numero} onChange={handleChange}
                    placeholder="123"
                    className={`${inputBaseClass} ${getValidationClass(errores.numero)}`}
                  />
                  {errores.numero && <p className="text-xs font-bold text-red-500 mt-1.5">{errores.numero}</p>}
                </div>
              </div>
            </div>

            {/* ── Documentos Digitales ── */}
            <div className="space-y-6">
              <div className="mb-6">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-black text-[#0B1828]">Documentos Digitales</h3>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  {isEditing ? "Visualiza los archivos vigentes o sube una versión actualizada." : "Sube los documentos requeridos para el expediente."}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentosRequeridos.map((doc) => {
                  const urlActual = getDocumentoUrl(doc.tipoBackend);
                  const archivoSeleccionado = archivos[doc.id];
                  const tieneArchivo = Boolean(urlActual);
                  return (
                    <div
                      key={doc.id}
                      className={`rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 ${
                        archivoSeleccionado
                          ? "border-emerald-200 bg-emerald-50/40 shadow-sm"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                            <FileText className="w-3.5 h-3.5 text-[#0B1828]" />
                          </div>
                          <span className="text-sm font-bold text-[#0B1828] leading-tight">{doc.label}</span>
                        </div>
                        {tieneArchivo && (
                          <a href={`${BACKEND_URL}${urlActual}`} target="_blank" rel="noreferrer"
                            className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-[#0B1828] bg-white px-2 py-1 rounded-md border border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver PDF
                          </a>
                        )}
                      </div>
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
                      <div>
                        <input
                          type="file" name={doc.id} accept="application/pdf"
                          required={!isEditing && !archivoSeleccionado} onChange={handleFileChange}
                          className="block w-full text-[10px] text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-[#0B1828] file:text-white hover:file:bg-[#162840] hover:file:shadow-md cursor-pointer file:transition-all file:cursor-pointer"
                        />
                        {archivoSeleccionado && (
                          <p className="mt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1 truncate bg-white px-2 py-1 rounded-md border border-emerald-200" title={archivoSeleccionado.name}>
                            <CheckCircle className="w-3 h-3 shrink-0" />
                            {archivoSeleccionado.name}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-dashed border-slate-200 mt-2">
              {!isEditing ? (
                <button
                  type="button" onClick={() => setPaso(1)}
                  className="px-6 py-4 text-[#0B1828] font-black hover:bg-slate-50 rounded-2xl transition-all border border-slate-200"
                >
                  Volver al paso 1
                </button>
              ) : <div />}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`flex justify-center items-center px-8 py-4 rounded-2xl font-black transition-all duration-300 text-lg sm:min-w-[300px] ${
                  isSubmitDisabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300" : "bg-[#0B1828] text-white hover:bg-[#162840] shadow-xl hover:shadow-[#0B1828]/30 active:scale-[0.98]"
                }`}
              >
                {isSubmitting
                  ? <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                  : isEditing
                    ? <RefreshCw className="w-6 h-6 mr-2" />
                    : <Save className="w-6 h-6 mr-2" />
                }
                {isSubmitting ? "Guardando..." : (isEditing ? "Modificar Docente" : "Nuevo Docente")}
              </button>
            </div>
          </div>
        )}
      </form>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 bg-[#0B1828]">
              <h3 className="text-lg font-black text-white">
                {isEditing ? "Confirmar modificación" : "Confirmar registro"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-5 font-medium">
                {isEditing
                  ? "Esta acción actualizará el expediente del docente en la base de datos. ¿Los datos ingresados son correctos?"
                  : "Esta acción realizará inserciones dependientes en la base de datos. ¿Los datos son correctos?"}
              </p>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm space-y-3">
                <div className="flex">
                  <span className="font-black w-1/3 text-[#0B1828]">RFC:</span>
                  <span className="text-slate-600 font-medium">{formData.rfc}</span>
                </div>
                {isEditing ? (
                  <div className="flex">
                    <span className="font-black w-1/3 text-[#0B1828]">Celular:</span>
                    <span className="text-slate-600 font-medium">{formData.celular || 'No especificado'}</span>
                  </div>
                ) : (
                  <div className="flex">
                    <span className="font-black w-1/3 text-[#0B1828]">Correo inst.:</span>
                    <span className="text-slate-600 font-medium">{formData.institutional_email || 'No asignado'}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-[#0B1828] hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center px-6 py-3 rounded-xl font-black text-white bg-[#0B1828] hover:bg-[#162840] disabled:opacity-50 transition-all shadow-sm"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};