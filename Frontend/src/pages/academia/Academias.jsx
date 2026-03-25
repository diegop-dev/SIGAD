import { useEffect, useState } from "react";
import { Search, Pencil, Trash2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import "./Academias.css";

export const Academias = ({ onNueva }) => {
  const [academias, setAcademias] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [academiaSeleccionada, setAcademiaSeleccionada] = useState(null);

  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [academiaAEliminar, setAcademiaAEliminar] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    usuario_id: "",
  });

  useEffect(() => {
    cargarAcademias();
    cargarCoordinadores();
  }, []);

  const cargarAcademias = async () => {
    try {
      const res = await api.get("/academias");
      setAcademias(res.data);
    } catch {
      toast.error("Error al cargar academias");
    }
  };

  const cargarCoordinadores = async () => {
    try {
      const res = await api.get("/academias/coordinadores-disponibles");
      setCoordinadores(res.data);
    } catch {
      toast.error("Error al cargar coordinadores");
    }
  };

  const prepararEdicion = (academia) => {
    setAcademiaSeleccionada(academia);
    setFormData({
      nombre: academia.nombre,
      descripcion: academia.descripcion || "",
      usuario_id: academia.usuario_id || "",
    });
    setModalAbierto(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/academias/${academiaSeleccionada.id_academia}`, formData);
      toast.success("Academia actualizada correctamente");
      setModalAbierto(false);
      cargarAcademias();
    } catch {
      toast.error("Error al actualizar la academia");
    }
  };

  const confirmarCambioEstatus = async () => {
    if (!academiaAEliminar) return;
    const nuevoEstatus = academiaAEliminar.estatus === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      await api.patch(`/academias/${academiaAEliminar.id_academia}/estatus`, { estatus: nuevoEstatus });
      toast.success(`Estatus cambiado a ${nuevoEstatus}`);
      setModalConfirmacion(false);
      setAcademiaAEliminar(null);
      cargarAcademias();
    } catch {
      toast.error("No se pudo cambiar el estatus");
    }
  };

  const academiasFiltradas = academias.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (filtroEstatus === "" || a.estatus === filtroEstatus)
  );

  return (
    <div className="academias-container">
      <div className="academias-header">
        <h2>Academias Registradas</h2>
        <button className="btn-primary" onClick={onNueva}>
          <Plus size={18} /> Nueva Academia
        </button>
      </div>

      <div className="academias-filtros">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select
          value={filtroEstatus}
          onChange={(e) => setFiltroEstatus(e.target.value)}
          className="select-filtro"
        >
          <option value="">Todos los estatus</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>

      <div className="tabla-container">
        <table className="tabla-academias">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Coordinador</th>
              <th>Fecha Registro</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {academiasFiltradas.map(a => (
              <tr key={a.id_academia}>
                <td>{a.nombre}</td>
                <td>{a.coordinador_nombre}</td>
                <td>{a.fecha_creacion}</td>
                <td>
                  <span className={`estatus ${a.estatus === "ACTIVO" ? "activo" : "inactivo"}`}>
                    {a.estatus}
                  </span>
                </td>
                <td className="acciones">
                  <Pencil size={18} className="icono editar" onClick={() => prepararEdicion(a)} />
                  <Trash2
                    size={18}
                    className={`icono eliminar ${a.estatus === "INACTIVO" ? "es-inactivo" : ""}`}
                    onClick={() => {
                      setAcademiaAEliminar(a);
                      setModalConfirmacion(true);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalConfirmacion && (
        <div className="modal-overlay">
          <div className="modal-content confirmacion">
            <div className="modal-header">
              <h3>Confirmar cambio</h3>
              <X className="cerrar" onClick={() => setModalConfirmacion(false)} />
            </div>

            <p className="confirm-text">
              {academiaAEliminar?.estatus === "ACTIVO"
                ? "Estás a punto de desactivar esta academia. Esta acción impedirá que siga disponible dentro del sistema."
                : "Estás a punto de activar esta academia nuevamente para su uso en el sistema."}
            </p>

            <div className="alerta-confirmacion">
              {academiaAEliminar?.estatus === "ACTIVO"
                ? "Advertencia: Al desactivar la academia, algunos procesos o usuarios relacionados podrían verse afectados. Asegúrate de que realmente deseas continuar."
                : "Al activar la academia, volverá a estar disponible para su uso normal dentro del sistema."}
            </div>

            <div className="card-confirmacion">
              <strong>{academiaAEliminar?.nombre}</strong>
              <span>{academiaAEliminar?.estatus}</span>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setModalConfirmacion(false)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={confirmarCambioEstatus}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content moderno">
            <div className="modal-header moderno-header">
              <h3>Editar Academia</h3>
              <X className="cerrar" onClick={() => setModalAbierto(false)} />
            </div>

            <form onSubmit={handleUpdate} className="form-moderno">
              <div className="input-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label>Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Coordinador</label>
                <select
                  value={formData.usuario_id}
                  onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
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

              <div className="modal-actions moderno-actions">
                <button type="button" className="btn-cancelar" onClick={() => setModalAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};