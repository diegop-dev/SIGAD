import { useState } from "react";
import api from "../../services/api";

export default function PeriodoForm({ onSuccess }) {
  const [form, setForm] = useState({
    periodo: "",
    fecha_inicio: "",
    fecha_fin: "",
    fecha_limite_calif: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/periodos", form);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Periodo"
        onChange={(e) => setForm({ ...form, periodo: e.target.value })}
      />
      <input
        type="date"
        onChange={(e) =>
          setForm({ ...form, fecha_inicio: e.target.value })
        }
      />
      <input
        type="date"
        onChange={(e) =>
          setForm({ ...form, fecha_fin: e.target.value })
        }
      />
      <input
        type="date"
        onChange={(e) =>
          setForm({ ...form, fecha_limite_calif: e.target.value })
        }
      />
      <button type="submit">Guardar</button>
    </form>
  );
}