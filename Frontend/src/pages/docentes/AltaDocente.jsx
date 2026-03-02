import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, FileText, X, CheckCircle } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth"; 

export const AltaDocente = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  // NUEVOS ESTADOS para Código Postal y Validaciones
  const [errores, setErrores] = useState({ rfc: "", curp: "" });
  const [coloniasDisponibles, setColoniasDisponibles] = useState([]);
  const [estadoRepublica, setEstadoRepublica] = useState("");
const [siguienteMatricula, setSiguienteMatricula] = useState("AUTOMÁTICA");  
  // Obtener fecha local de hoy
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd = String(hoy.getDate()).padStart(2, '0');
  const fechaActual = `${yyyy}-${mm}-${dd}`;

  // Se inicializa con la fecha de hoy
  const [antiguedad, setAntiguedad] = useState("0 años y 0 meses");

  const [formData, setFormData] = useState({
    usuario_id: "", rfc: "", curp: "", celular: "", 
    calle: "", numero: "", colonia: "", cp: "",
    clave_ine: "", fecha_ingreso: fechaActual, // <-- FECHA PRECARGADA
    nivel_academico: ""
  });

  const [archivos, setArchivos] = useState({
    titulo: null, cedula: null, sat: null, ine: null, domicilio: null, cv: null
  });

  // RegEx Oficiales para México
  const regexRFC = /^([A-ZÑ&]{4})\d{6}([A-Z0-9]{3})$/;
  const regexCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;

  // Cargar usuarios disponibles
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get("/docentes/disponibles");
        setUsuariosDisponibles(response.data);
      } catch (error) {
        toast.error("Error al cargar la lista de usuarios.");
      }
    };
    fetchUsuarios();
  }, []);

  // Efecto para buscar Estado y Colonias con el CP
  useEffect(() => {
    if (formData.cp.length === 5) {
      const fetchCP = async () => {
        try {
          const res = await fetch(`https://api.zippopotam.us/mx/${formData.cp}`);
          if (res.ok) {
            const data = await res.json();
            setEstadoRepublica(data.places[0].state);
            const colonias = data.places.map(place => place["place name"]);
            setColoniasDisponibles(colonias);
            
            if (colonias.length === 1) {
              setFormData(prev => ({ ...prev, colonia: colonias[0] }));
            } else {
              setFormData(prev => ({ ...prev, colonia: "" })); 
            }
          } else {
            setColoniasDisponibles([]);
            setEstadoRepublica("");
          }
        } catch (error) {
          console.error("Error al buscar CP", error);
        }
      };
      fetchCP();
    } else {
      setColoniasDisponibles([]);
      setEstadoRepublica("");
    }
  }, [formData.cp]);

  const handleKeyDownStrict = (e) => { if (e.key === " ") e.preventDefault(); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    if (name === "rfc" || name === "curp" || name === "clave_ine") {
      sanitizedValue = sanitizedValue.toUpperCase().replace(/[^A-Z0-9Ñ]/g, "");
      
      if (name === "rfc") {
        setErrores(prev => ({ ...prev, rfc: regexRFC.test(sanitizedValue) || sanitizedValue === "" ? "" : "Formato inválido (Ej. ABCD801231XYZ)" }));
      }
      if (name === "curp") {
        setErrores(prev => ({ ...prev, curp: regexCURP.test(sanitizedValue) || sanitizedValue === "" ? "" : "Formato inválido (18 caracteres)" }));
      }
    } else if (name === "celular" || name === "cp") {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setArchivos((prev) => ({ ...prev, [name]: file }));
      } else {
        toast.error(`El archivo debe ser PDF.`);
        e.target.value = null; 
      }
    }
  };

  const handleOpenModal = (e) => {
    e.preventDefault();
    if (errores.rfc || errores.curp || formData.rfc.length < 13 || formData.curp.length < 18) {
      toast.error("Por favor, corrija los formatos de RFC o CURP antes de continuar.");
      return;
    }
    setShowModal(true);
  };

const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowModal(false);
    const toastId = toast.loading("Armando expediente digital...");

    try {
      const form = new FormData();
      
      // Armamos los datos aplicando el "truco" para la fecha
      Object.keys(formData).forEach((key) => {
        if (key === "fecha_ingreso") {
          // Cortamos la letra "T" y todo lo que sigue (la hora), enviando solo YYYY-MM-DD
          form.append(key, formData[key].split("T")[0]); 
        } else {
          form.append(key, formData[key]);
        }
      });

      if (user && user.id_usuario) form.append("creado_por", user.id_usuario);
      Object.keys(archivos).forEach((key) => { if (archivos[key]) form.append(key, archivos[key]); });

      const response = await api.post("/docentes/registrar", form);
      toast.success(<div><b>¡Expediente creado!</b><br/>Matrícula: {response.data.matricula_generada}</div>, { id: toastId, duration: 5000 });
      if(onSuccess) onSuccess(); 
    } catch (error) {
      toast.error(`Error: ${error.response?.data?.error || "Error de red"}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Expediente de Docente</h2>
        <button onClick={onBack} className="flex items-center text-sm font-bold text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Cancelar
        </button>
      </div>

      <form onSubmit={handleOpenModal} className="p-6 space-y-8">
        
{/* SECCIÓN 1: Selección de Usuario y Datos de Contacto */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">1. Vinculación y Contacto</h3>
          
          {/* NUEVO DISEÑO DIVIDIDO: 2/3 Select, 1/3 Matrícula */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">Seleccionar Usuario (Con rol de Docente) *</label>
              <select name="usuario_id" required value={formData.usuario_id} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 py-3 px-4 cursor-pointer">
                <option value="">-- Elija un usuario del sistema --</option>
                {usuariosDisponibles.map(u => (
                  <option key={u.id_usuario} value={u.id_usuario}>
                    {u.nombres} {u.apellido_paterno} {u.apellido_materno}
                  </option>
                ))}
              </select>
            </div>

            {/* NUEVO CAMPO: N# Matrícula */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">N# Matrícula (Auto)</label>
              <input 
                type="text" 
                value={siguienteMatricula} 
                readOnly 
                disabled 
                placeholder="Ej. 00000001"
                className="block w-full rounded-xl border border-slate-200 bg-slate-100 text-blue-700 py-3 px-4 cursor-not-allowed font-black shadow-sm text-center tracking-widest text-lg" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">RFC *</label>
              <input type="text" name="rfc" required maxLength="13" value={formData.rfc} onChange={handleChange} onKeyDown={handleKeyDownStrict} className={`block w-full rounded-xl border ${errores.rfc ? 'border-red-500 focus:border-red-600' : 'border-slate-300 focus:border-blue-600'} shadow-sm py-3 px-4`} />
              {errores.rfc && <p className="text-xs text-red-500 mt-1 font-semibold">{errores.rfc}</p>}
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Celular *</label>
              <input type="text" name="celular" required maxLength="10" value={formData.celular} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Domicilio e Identificación */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">2. Domicilio e Identificación</h3>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">C.P. *</label>
              <input type="text" name="cp" required maxLength="5" placeholder="Ej. 24000" value={formData.cp} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Estado</label>
              <input type="text" value={estadoRepublica} readOnly disabled placeholder="Se llena con el C.P." className="block w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-3 px-4 cursor-not-allowed font-medium" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Colonia *</label>
              {coloniasDisponibles.length > 0 ? (
                <select name="colonia" required value={formData.colonia} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4 bg-white">
                  <option value="">Seleccione colonia</option>
                  {coloniasDisponibles.map((col, index) => (
                    <option key={index} value={col}>{col}</option>
                  ))}
                </select>
              ) : (
                <input type="text" name="colonia" required placeholder="Ingrese su colonia" value={formData.colonia} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Calle y Número *</label>
              <div className="flex gap-2">
                <input type="text" name="calle" placeholder="Calle" required value={formData.calle} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
                <input type="text" name="numero" placeholder="Num" required value={formData.numero} onChange={handleChange} className="block w-24 rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Clave de Elector / ID Oficial *</label>
              <input type="text" name="clave_ine" placeholder="Ingrese número de identificación" required maxLength="20" value={formData.clave_ine} onChange={handleChange} onKeyDown={handleKeyDownStrict} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4 uppercase" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: Laboral */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">3. Laboral y Académica</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Grado Máximo *</label>
              <select name="nivel_academico" required value={formData.nivel_academico} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4">
                <option value="">Seleccione grado</option>
                <option value="Licenciatura">Licenciatura</option>
                <option value="Maestria">Maestría</option>
                <option value="Doctorado">Doctorado</option>
              </select>
            </div>
            
            {/* AQUÍ ESTÁ EL CAMBIO DE LA FECHA ESTATICA */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Fecha de Ingreso*</label>
              <input type="date" name="fecha_ingreso" value={formData.fecha_ingreso} readOnly disabled className="block w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-3 px-4 cursor-not-allowed font-medium shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Antigüedad*</label>
              <input type="text" value={antiguedad} readOnly disabled placeholder="Automática" className="block w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-3 px-4 cursor-not-allowed font-medium shadow-sm" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: Documentos */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">4. Expediente Digital</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[ { id: "titulo", label: "Título" }, { id: "cedula", label: "Cédula" }, { id: "sat", label: "Constancia SAT" }, { id: "ine", label: "INE" }, { id: "domicilio", label: "Comprobante" }, { id: "cv", label: "CV" } ].map((doc) => (
              <div key={doc.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center"><FileText className="w-4 h-4 mr-2 text-blue-600" /> {doc.label} *</label>
                <input type="file" name={doc.id} accept="application/pdf" required onChange={handleFileChange} className="block w-full text-slate-600 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer transition-colors" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button type="submit" className="flex items-center px-8 py-3 bg-blue-600 rounded-xl shadow-md text-base font-bold text-white hover:bg-blue-700 transition-all">
            <CheckCircle className="w-5 h-5 mr-2" /> Guardar Expediente
          </button>
        </div>
      </form>

      {/* MODAL DE CONFIRMACIÓN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
            <div className="flex justify-between px-6 py-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Confirmar Expediente</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">Se creará el expediente y generará la matrícula. Verifique los datos:</p>
              <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-2">
                <div className="flex"><span className="font-bold w-1/3">RFC:</span> <span>{formData.rfc}</span></div>
                <div className="flex"><span className="font-bold w-1/3">ID Oficial:</span> <span>{formData.clave_ine}</span></div>
                <div className="flex"><span className="font-bold w-1/3">Estado:</span> <span>{estadoRepublica}</span></div>
                <div className="flex"><span className="font-bold w-1/3">Colonia:</span> <span>{formData.colonia}</span></div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-5 py-2 bg-white border rounded-xl text-sm font-bold text-slate-700">Cancelar</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-5 py-2 bg-blue-600 rounded-xl text-sm font-bold text-white disabled:bg-blue-400">
                {isSubmitting ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};