import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Save, ArrowLeft, FileText, X, CheckCircle, UserPlus } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth"; 

export const AltaDocente = ({ onBack, onSuccess }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [antiguedad, setAntiguedad] = useState("");
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);

  // Se actualizó identificacion_oficial por clave_ine para cumplir con el diagrama
  const [formData, setFormData] = useState({
    usuario_id: "", 
    rfc: "", 
    curp: "", 
    celular: "", 
    calle: "", 
    numero: "", 
    colonia: "", 
    cp: "",
    clave_ine: "", 
    fecha_ingreso: "", 
    nivel_academico: ""
  });

  const [archivos, setArchivos] = useState({
    titulo: null, cedula: null, sat: null, ine: null, domicilio: null, cv: null
  });

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await api.get("/docentes/disponibles");
        setUsuariosDisponibles(response.data);
      } catch (error) {
        toast.error("Error al cargar la lista de usuarios disponibles.");
      }
    };
    fetchUsuarios();
  }, []);

  const calcularAntiguedad = (fecha) => {
    if (!fecha) return "";
    const hoy = new Date();
    const ingreso = new Date(fecha);
    let anios = hoy.getFullYear() - ingreso.getFullYear();
    let meses = hoy.getMonth() - ingreso.getMonth();
    if (meses < 0 || (meses === 0 && hoy.getDate() < ingreso.getDate())) { anios--; meses += 12; }
    return `${anios} años y ${meses} meses`;
  };

  const handleKeyDownStrict = (e) => { if (e.key === " ") e.preventDefault(); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;

    // Validación estricta para campos clave
    if (name === "rfc" || name === "curp" || name === "clave_ine") {
      sanitizedValue = sanitizedValue.toUpperCase().replace(/[^A-Z0-9]/g, "");
    } else if (name === "celular" || name === "cp") {
      sanitizedValue = sanitizedValue.replace(/[^0-9]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    if (name === "fecha_ingreso") setAntiguedad(calcularAntiguedad(sanitizedValue));
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
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowModal(false);
    const toastId = toast.loading("Armando expediente digital...");

    try {
      const form = new FormData();
      Object.keys(formData).forEach((key) => form.append(key, formData[key]));
      
      if (user && user.id_usuario) form.append("creado_por", user.id_usuario);
      
      Object.keys(archivos).forEach((key) => { 
        if (archivos[key]) form.append(key, archivos[key]); 
      });

      const response = await api.post("/docentes/registrar", form);
      toast.success(
        <div><b>¡Expediente creado!</b><br/>Matrícula: {response.data.matricula_generada}</div>, 
        { id: toastId, duration: 5000 }
      );
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
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Armar Expediente de Docente</h2>
        <button onClick={onBack} className="flex items-center text-sm font-bold text-slate-600 hover:bg-slate-200 px-3 py-1.5 rounded-lg">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Cancelar
        </button>
      </div>

      <form onSubmit={handleOpenModal} className="p-6 space-y-8">
        
        {/* SECCIÓN 1: Selección de Usuario y Datos de Contacto */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">1. Vinculación y Contacto</h3>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-800 mb-2">Seleccionar Usuario (Con rol de Docente) *</label>
            <select name="usuario_id" required value={formData.usuario_id} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-slate-900 py-3 px-4 cursor-pointer">
              <option value="">-- Elija un usuario del sistema --</option>
              {usuariosDisponibles.map(u => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombres} {u.apellido_paterno} {u.apellido_materno} ({u.personal_email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">RFC *</label>
              <input type="text" name="rfc" required maxLength="13" value={formData.rfc} onChange={handleChange} onKeyDown={handleKeyDownStrict} className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 py-3 px-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">CURP *</label>
              <input type="text" name="curp" required maxLength="18" value={formData.curp} onChange={handleChange} onKeyDown={handleKeyDownStrict} className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 py-3 px-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Celular *</label>
              <input type="text" name="celular" required maxLength="10" value={formData.celular} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 bg-white shadow-sm focus:border-blue-600 focus:ring-2 py-3 px-4" />
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Domicilio e Identificación */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">2. Domicilio e Identificación</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4 mb-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold text-slate-800 mb-2">Calle y Número *</label>
              <div className="flex gap-2">
                <input type="text" name="calle" placeholder="Calle" required value={formData.calle} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
                <input type="text" name="numero" placeholder="Num" required value={formData.numero} onChange={handleChange} className="block w-24 rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Colonia *</label>
              <input type="text" name="colonia" required value={formData.colonia} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">C.P. *</label>
              <input type="text" name="cp" required maxLength="5" value={formData.cp} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
             <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Clave de Elector / ID Oficial *</label>
              <input 
                type="text" 
                name="clave_ine" 
                placeholder="Ingrese número de identificación" 
                required 
                maxLength="20" 
                value={formData.clave_ine} 
                onChange={handleChange} 
                onKeyDown={handleKeyDownStrict}
                className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4 uppercase" 
              />
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
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Fecha de Ingreso *</label>
              <input type="date" name="fecha_ingreso" required value={formData.fecha_ingreso} onChange={handleChange} className="block w-full rounded-xl border border-slate-300 shadow-sm focus:border-blue-600 py-3 px-4" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">Antigüedad (Auto)</label>
              <input type="text" value={antiguedad} readOnly disabled placeholder="Automática" className="block w-full rounded-xl border border-slate-200 bg-slate-100 text-slate-600 py-3 px-4 cursor-not-allowed font-medium" />
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
                <div className="flex"><span className="font-bold w-1/3">Antigüedad:</span> <span className="text-blue-600 font-semibold">{antiguedad}</span></div>
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