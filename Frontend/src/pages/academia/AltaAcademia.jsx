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
    coordinador_id: ""
  });

  const [coordinadores, setCoordinadores] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchCoordinadores = async () => {
      try {
        const response = await api.get("/academias/coordinadores-disponibles");
        setCoordinadores(response.data);
      } catch {
        toast.error("Error al cargar coordinadores.");
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

    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };

  const validarNombreUnico = async () => {
    try {
      const response = await api.get(`/academias/validar-nombre/${formData.nombre}`);
      return response.data.existe;
    } catch {
      return false;
    }
  };

  const handleOpenModal = async (e) => {
    e.preventDefault();

    if (!formData.nombre || !formData.coordinador_id) {
      toast.error("Complete los campos obligatorios.");
      return;
    }

    const existe = await validarNombreUnico();

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
            maxLength="150"
            value={formData.nombre}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
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
          >
            <option value="">Seleccione</option>
              {coordinadores.map(c => (
  <option key={c.id_usuario} value={c.id_usuario}>
    {c.nombres} {c.apellido_paterno}
  </option>
))}
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
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