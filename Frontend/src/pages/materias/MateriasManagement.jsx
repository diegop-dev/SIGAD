import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Loader2,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

import { MateriasForm } from "./MateriasForm";
import { MateriasModal } from "./MateriasModal";
import { MateriasDelete } from "./MateriasDelete.jsx";

export const MateriasManagement = () => {
  const [materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterCuatrimestre, setFilterCuatrimestre] = useState("");
  const [sortBy, setSortBy] = useState("nombre");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [selectedMateria, setSelectedMateria] = useState(null);
  const [editingMateria, setEditingMateria] = useState(null);
  const [deletingMateria, setDeletingMateria] = useState(null);

  const [isCreating, setIsCreating] = useState(false);

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
    let data = [...materias];

    if (searchTerm) {
      data = data.filter((m) =>
        `${m.codigo_unico} ${m.nombre}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    if (filterTipo) {
      data = data.filter((m) => m.tipo_asignatura === filterTipo);
    }

    if (filterCuatrimestre) {
      data = data.filter(
        (m) => m.cuatrimestre === Number(filterCuatrimestre)
      );
    }

    data.sort((a, b) => {
      if (sortBy === "nombre") {
        return a.nombre.localeCompare(b.nombre);
      }
      if (sortBy === "cuatrimestre") {
        return a.cuatrimestre - b.cuatrimestre;
      }
      return 0;
    });

    return data;
  }, [materias, searchTerm, filterTipo, filterCuatrimestre, sortBy]);

  const totalPages = Math.ceil(filteredMaterias.length / itemsPerPage);
  const tipoLabels = {
  TRONCO_COMUN: "Tronco común",
  OPTATIVA: "Optativa",
  OBLIGATORIA: "Obligatoria",
};
  const paginatedMaterias = filteredMaterias.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isCreating || editingMateria) {
    return (
      <MateriasForm
        materiaToEdit={editingMateria}
        onBack={() => {
          setIsCreating(false);
          setEditingMateria(null);
        }}
        onSuccess={() => {
          setIsCreating(false);
          setEditingMateria(null);
          fetchMaterias();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between bg-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-black">Gestión de materias</h1>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-xl font-bold"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva materia
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="flex items-center border rounded-xl px-3">
          <Search className="w-4 h-4 text-slate-500 mr-2" />
          <input
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-2 outline-none"
          />
        </div>

        <select
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="border rounded-xl px-3 py-2"
        >
          <option value="">Todos los tipos</option>
          <option value="TRONCO_COMUN">Tronco común</option>
          <option value="OPTATIVA">Optativa</option>
          <option value="OBLIGATORIA">Obligatoria</option>
        </select>

        <select
          value={filterCuatrimestre}
          onChange={(e) => setFilterCuatrimestre(e.target.value)}
          className="border rounded-xl px-3 py-2"
        >
          <option value="">Todos los cuatrimestres</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Cuatrimestre {i + 1}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded-xl px-3 py-2"
        >
          <option value="nombre">Ordenar por nombre</option>
          <option value="cuatrimestre">Ordenar por cuatrimestre</option>
        </select>

      </div>


      {/* TABLA */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="animate-spin mx-auto" />
          </div>
        ) : paginatedMaterias.length === 0 ? (
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
                <th className="px-6 py-4 text-left">Tipo</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMaterias.map((m) => (
                <tr key={m.id_materia} className="border-t">
                  <td className="px-6 py-4">{m.codigo_unico}</td>
                  <td className="px-6 py-4">{m.nombre}</td>
                  <td className="px-6 py-4">{m.creditos}</td>
                  <td className="px-6 py-4">{m.cuatrimestre}</td>
                  <td className="px-6 py-4">
                      {tipoLabels[m.tipo_asignatura] || "Sin definir"}
                 </td>
                  <td className="px-6 py-4 flex justify-center space-x-4">

                    <Eye
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                      onClick={() => setSelectedMateria(m)}
                    />

                    <Pencil
                      className="w-5 h-5 text-amber-500 cursor-pointer"
                      onClick={() => setEditingMateria(m)}
                    />

                    <Trash2
                      className="w-5 h-5 text-red-600 cursor-pointer"
                      onClick={() => setDeletingMateria(m)}
                    />

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* MODALES */}
      {selectedMateria && (
        <MateriasModal
          materia={selectedMateria}
          onClose={() => setSelectedMateria(null)}
          onEdit={(m) => setEditingMateria(m)}
          onDelete={(m) => setDeletingMateria(m)}
        />
      )}

      {deletingMateria && (
        <MateriasDelete
          materia={deletingMateria}
          onClose={() => setDeletingMateria(null)}
          onSuccess={() => {
            setDeletingMateria(null);
            fetchMaterias();
          }}
        />
      )}
    </div>
  );
};