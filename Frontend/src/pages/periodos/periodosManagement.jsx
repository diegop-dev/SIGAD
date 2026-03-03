import { useEffect, useState } from "react";
import api from "../../services/api";
import PeriodoForm from "./periodosForm";

export const periodosManagement = () => {
  const [periodos, setPeriodos] = useState([]);
  const [estatus, setEstatus] = useState("");

  const fetchPeriodos = async () => {
    const res = await api.get("/periodos", {
      params: { estatus },
    });
    setPeriodos(res.data);
  };

  useEffect(() => {
    fetchPeriodos();
  }, [estatus]);

  return (
    <div>
      <h1>Gestión de Periodos</h1>

      <select onChange={(e) => setEstatus(e.target.value)}>
        <option value="">Todos</option>
        <option value="ACTIVO">Activo</option>
        <option value="INACTIVO">Inactivo</option>
      </select>

      <PeriodoForm onSuccess={fetchPeriodos} />

      <table>
        <thead>
          <tr>
            <th>Periodo</th>
            <th>Inicio</th>
            <th>Fin</th>
            <th>Limite</th>
            <th>Estatus</th>
          </tr>
        </thead>
        <tbody>
          {periodos.map((p) => (
            <tr key={p.id_periodo}>
              <td>{p.periodo}</td>
              <td>{p.fecha_inicio?.substring(0, 10)}</td>
              <td>{p.fecha_fin?.substring(0, 10)}</td>
              <td>{p.fecha_limite_calif?.substring(0, 10)}</td>
              <td>{p.estatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}