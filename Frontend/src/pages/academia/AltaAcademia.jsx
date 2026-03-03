import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, CheckCircle, X } from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import "./AltaAcademia.css";


export const AltaAcademia = ({ onBack, onSuccess }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    coordinador_id: "",
    codigo_postal: "",
    estado: "",
    municipio: "",
    direccion: "",
    estatus: "ACTIVO"
  });

  const [coordinadores, setCoordinadores] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isLoadingCoordinadores, setIsLoadingCoordinadores] = useState(true);
  useEffect(() => {
    const fetchCoordinadores = async () => {
      try {
        setIsLoadingCoordinadores(true);
        const response = await api.get("/academias/coordinadores-disponibles");
        setCoordinadores(response.data);
      } catch {
        toast.error("Error al cargar coordinadores.");
          } finally {
      setIsLoadingCoordinadores(false); 
      }
    };
    fetchCoordinadores();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    let sanitizedValue = value;
    if (name === "nombre") {
      sanitizedValue = sanitizedValue.replace(/\s+/g, " ");
    }
if (name === "codigo_postal") {
      sanitizedValue = value.replace(/\D/g, ""); // solo números
    }
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };
  const handleCPBlur = async () => {
    if (formData.codigo_postal.length !== 5) return;

    try {
      const res = await api.get(`/ubicacion/cp/${formData.codigo_postal}`);
      setFormData(prev => ({
        ...prev,
        estado: res.data.estado,
        municipio: res.data.municipio
      }));
    } catch {
      toast.error("Código postal inválido.");
      setFormData(prev => ({
        ...prev,
        estado: "",
        municipio: ""
      }));
    }
  };
// encodeURIComponent previene errores de rutas con caracteres especiales
  const validarNombreUnico = async () => {
    try {
      const response = await api.get(`/academias/validar-nombre/${encodeURIComponent(formData.nombre)}`);
      return response.data.existe;
    } catch {
      return null; // estoy con NULL, true bloquearía el registro aunque el servidor solo esté caído. (porque true significa que sí existe
    }
  };

  const handleOpenModal = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.coordinador_id ||!formData.codigo_postal || !formData.estado ||!formData.municipio ||!formData.direccion) 
      {
      toast.error("Complete los campos obligatorios.");
      return;
    }
       const idToast = toast.loading("Verificando disponibilidad...");
    const existe = await validarNombreUnico();
 toast.dismiss(idToast);
    if (existe === null) {
      toast.error("Error al validar con el servidor.");
      return;
    
    }
 if (existe) {
    toast.error("El nombre ya existe.");
    return;
  }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setShowModal(false);

    const toastId = toast.loading("Registrando...");

    try {
      await api.post("/academias/registrar", {
        ...formData,
        creado_por: user.id_usuario
      });

      toast.success("Academia registrada correctamente", { id: toastId });
      if (onSuccess) onSuccess();

    } catch (error) {
      toast.error(error.response?.data?.error || "Error de servidor", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="alta-container">
      <div className="alta-header">
        <h2>Registrar Nueva Academia</h2>
        <button onClick={onBack} className="btn-cancel">
          <ArrowLeft size={16} />
          Cancelar
        </button>
      </div>

      <form onSubmit={handleOpenModal} className="alta-form">

        <div className="form-group">
          <label>Nombre *</label>
          <input
            type="text"
            name="nombre"
            maxLength="100"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            maxLength="500"
            rows="3"
            value={formData.descripcion}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Coordinador *</label>
          <select
            name="coordinador_id"
            value={formData.coordinador_id}
            onChange={handleChange}
            required
             disabled={isLoadingCoordinadores}
             >
            {isLoadingCoordinadores ? (
              <option value="">Cargando coordinadores...</option>
            ) : coordinadores.length === 0 ? (
              <option value="">No hay coordinadores disponibles</option>
            ) : (
           <>
            <option value=""> Seleccione</option>
              {coordinadores.map(c => (
  <option key={c.id_usuario} value={c.id_usuario}>
    {c.nombres} {c.apellido_paterno}
  </option>
))}
  </>
  )}
          </select>
        </div>
     
        <div className="form-group">
          <label>Código Postal *</label>
          <input
            type="text"
            name="codigo_postal"
            maxLength="5"
            value={formData.codigo_postal}
            onChange={handleChange}
            onBlur={handleCPBlur}
            required
          />
        </div>

      
        <div className="form-group">
          <label>Estado *</label>
          <input
            type="text"
            name="estado"
            value={formData.estado}
            readOnly
            required
          />
        </div>

      
        <div className="form-group">
          <label>Municipio *</label>
          <input
            type="text"
            name="municipio"
            value={formData.municipio}
            readOnly
            required
          />
        </div>

        <div className="form-group">
          <label>Dirección *</label>
          <input
            type="text"
            name="direccion"
            maxLength="255"
            value={formData.direccion}
            onChange={handleChange}
            required
          />
        </div>

        {user?.rol === "Superadministrador" && (
          <div className="form-group">
            <label>Estatus *</label>
            <select
              name="estatus"
              value={formData.estatus}
              onChange={handleChange}
            >
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </div>
        )}
        <div className="form-actions">
          <button disabled={isSubmitting || isLoadingCoordinadores} type="submit" className="btn-primary">
            <CheckCircle size={18} />
            Guardar
          </button>
        </div>
      </form>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Confirmar Registro</h3>
              <button onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p><b>Nombre:</b> {formData.nombre}</p>
              <p><b>Coordinador ID:</b> {formData.coordinador_id}</p>
              <p><b>Ubicación:</b> {formData.municipio}, {formData.estado}</p>
              <p><b>Estatus:</b> {formData.estatus}</p>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSubmit} className="btn-primary">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};