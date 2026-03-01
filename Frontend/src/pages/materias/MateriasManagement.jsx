import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Loader2, BookOpen } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { MateriasForm } from './materiasForm';

export const MateriasManagement = () => {
  const [Materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedMaterias, setSelectedMaterias] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchMaterias = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/materias");
      setMaterias(res.data);
    } catch {
      toast.error("Error al cargar materias");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterias();
  }, []);

  const filteredMaterias = useMemo(() => {
    return Materias.filter((m) =>
      `${m.codigo_unico} ${m.nombre}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  }, [Materias, searchTerm]);

  if (isCreating) {
    return (
      <MateriasForm
        onBack={() => setIsCreating(false)}
        onSuccess={() => {
          setIsCreating(false);
          fetchMaterias();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between bg-white p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black">Gestión de materias</h1>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva materia
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <input
          placeholder="Buscar materia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border rounded-xl p-3"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : filteredMaterias.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No hay materias registradas
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left">Código</th>
                <th className="px-6 py-4 text-left">Nombre</th>
                <th className="px-6 py-4 text-left">Créditos</th>
                <th className="px-6 py-4 text-left">Cuatrimestre</th>
                <th className="px-6 py-4 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterias.map((m) => (
                <tr key={m.id_materia} className="border-t">
                  <td className="px-6 py-4">{m.codigo_unico}</td>
                  <td className="px-6 py-4">{m.nombre}</td>
                  <td className="px-6 py-4">{m.creditos}</td>
                  <td className="px-6 py-4">{m.cuatrimestre}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedMaterias(m)}
                      className="text-blue-600 font-bold"
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedMaterias && (
        <MateriasModal
          Materias={selectedMaterias}
          onClose={() => setSelectedMaterias(null)}
        />
      )}
    </div>
  );
};