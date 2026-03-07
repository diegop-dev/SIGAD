import { useEffect, useState } from "react";
import { Search, Eye, Pencil, Trash2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import "./Academias.css";

export const Academias = ({ onNueva }) => {
  const [academias, setAcademias] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]); // 🔹 Mantenemos la carga de coordinadores
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState(""); 
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [academiaSeleccionada, setAcademiaSeleccionada] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    usuario_id: "", // 🔹 Restaurado para permitir cambios de coordinador
  });

  useEffect(() => {
    cargarAcademias();
    cargarCoordinadores(); // 🔹 Cargamos los docentes (Rol 3) para el modal
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
      usuario_id: academia.usuario_id || "", // 🔹 Mapeamos el ID actual
    });
    setModalAbierto(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const check = await api.get(`/academias/validar-nombre/${formData.nombre}?id=${academiaSeleccionada.id_academia}`);
      if (check.data.existe) return toast.error("Ese nombre ya está en uso");

      await api.put(`/academias/${academiaSeleccionada.id_academia}`, formData);
      toast.success("Academia actualizada correctamente");
      setModalAbierto(false);
      cargarAcademias();
    } catch (error) {
      toast.error("Error al actualizar la academia");
    }
  };

  const handleToggleEstatus = async (id, estatusActual) => {
    const nuevoEstatus = estatusActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await api.patch(`/academias/${id}/estatus`, { estatus: nuevoEstatus });
      toast.success(`Estatus cambiado a ${nuevoEstatus}`);
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
                  <span className={`estatus ${a.estatus === 'ACTIVO' ? "activo" : "inactivo"}`}>
                    {a.estatus}
                  </span>
                </td>
                <td className="acciones">
                  <Pencil size={18} className="icono editar" onClick={() => prepararEdicion(a)} />
                  <Trash2 
                    size={18} 
                    className={`icono eliminar ${a.estatus === 'INACTIVO' ? 'es-inactivo' : ''}`} 
                    onClick={() => handleToggleEstatus(a.id_academia, a.estatus)} 
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Editar Academia</h3>
              <X className="cerrar" onClick={() => setModalAbierto(false)} />
            </div>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Nombre de la Academia</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  value={formData.descripcion} 
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})} 
                />
              </div>

              {/* 🔹 RESTAURADO: Selección de Coordinador */}
              <div className="form-group">
                <label>Coordinador</label>
                <select 
                  value={formData.usuario_id} 
                  onChange={(e) => setFormData({...formData, usuario_id: e.target.value})}
                  required
                >
                  <option value="">Seleccione un coordinador</option>
                  {coordinadores.map(c => (
                    <option key={c.id_usuario} value={c.id_usuario}>
                      {c.nombres} {c.apellido_paterno}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setModalAbierto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};