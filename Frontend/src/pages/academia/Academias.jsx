import { useEffect, useState } from "react";
import { Search, Eye, Pencil, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import "./Academias.css";

export const Academias = ({ onNueva }) => {

  const [academias, setAcademias] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCoordinador, setFiltroCoordinador] = useState("");

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

  const academiasFiltradas = academias.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (filtroCoordinador === "" || a.coordinador_id == filtroCoordinador)
  );

  return (
    <div className="academias-container">

      {/* HEADER */}
      <div className="academias-header">
         <h2>Academias Registradas</h2>
        <button className="btn-primary" onClick={onNueva}>
          <Plus size={18} />
          Nueva Academia
        </button>

       
      </div>

      {/* FILTROS */}
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
          value={filtroCoordinador}
          onChange={(e) => setFiltroCoordinador(e.target.value)}
        >
          <option value="">Todos los coordinadores</option>
          {coordinadores.map(c => (
            <option key={c.id_usuario} value={c.id_usuario}>
              {c.nombres} {c.apellido_paterno}
            </option>
          ))}
        </select>
      </div>

      {/* TABLA */}
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
            {academiasFiltradas.length > 0 ? (
              academiasFiltradas.map(a => (
                <tr key={a.id_academia}>
                  <td>{a.nombre}</td>
                  <td>{a.coordinador_nombre}</td>
                  <td>
                    {new Date(a.fecha_creacion + "T00:00:00")
                      .toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                  </td>
                  <td>
                    <span className={`estatus ${a.estatus ? "activo" : "inactivo"}`}>
                      {a.estatus ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="acciones">
                    <Eye size={18} className="icono ver" />
                    <Pencil size={18} className="icono editar" />
                    <Trash2 size={18} className="icono eliminar" />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="sin-datos">
                  No hay academias registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};