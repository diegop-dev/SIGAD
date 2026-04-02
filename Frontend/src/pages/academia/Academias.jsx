import { useEffect, useState } from 'react';
import { Search, Pencil, Trash2, Plus, X, Filter, Loader2, BookOpen, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export const Academias = ({ onNueva }) => {
  const [academias, setAcademias] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstatus, setFiltroEstatus] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [academiaSeleccionada, setAcademiaSeleccionada] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    usuario_id: '',
  });

  useEffect(() => {
    cargarAcademias();
    cargarCoordinadores();
    cargarCoordinadores();
  }, []);

  const cargarAcademias = async () => {
    try {
      setCargando(true);
      const res = await api.get('/academias');
      setAcademias(res.data);
    } catch {
      toast.error('Error al cargar academias');
    } finally {
      setCargando(false);
    }
  };

  const cargarCoordinadores = async () => {
    try {
      const res = await api.get('/academias/coordinadores-disponibles');
      setCoordinadores(res.data);
    } catch {
      toast.error('Error al cargar coordinadores');
    }
  };

  const prepararEdicion = (academia) => {
    setAcademiaSeleccionada(academia);
    setFormData({
      nombre: academia.nombre,
      descripcion: academia.descripcion || '',
      usuario_id: academia.usuario_id || '',
    });
    setModalAbierto(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const check = await api.get(
        `/academias/validar-nombre/${formData.nombre}?id=${academiaSeleccionada.id_academia}`
      );
      if (check.data.existe) return toast.error('Ese nombre ya está en uso');

      await api.put(`/academias/${academiaSeleccionada.id_academia}`, formData);
      toast.success('Academia actualizada correctamente');
      setModalAbierto(false);
      cargarAcademias();
    } catch {
      toast.error('Error al actualizar la academia');
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
      toast.error('No se pudo cambiar el estatus');
    }
  };

  const academiasFiltradas = academias.filter(a =>
    a.nombre.toLowerCase().includes(busqueda.toLowerCase()) &&
    (filtroEstatus === '' || a.estatus === filtroEstatus)
  );

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <BookOpen className="w-8 h-8 mr-3 text-blue-600" />
            Gestión de academias
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Administra las academias y sus coordinadores institucionales.
          </p>
        </div>
        <button
          onClick={onNueva}
          className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md font-bold"
        >
          <Plus className="w-5 h-5 mr-2" /> Nueva academia
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre de academia..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200"
          />
        </div>
        <div className="relative flex items-center min-w-[200px]">
          <Filter className="h-4 w-4 text-slate-400 absolute left-4 z-10" />
          <select
            value={filtroEstatus}
            onChange={(e) => setFiltroEstatus(e.target.value)}
            className="pl-11 block w-full rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 sm:text-sm py-3 transition-all duration-200 appearance-none cursor-pointer"
          >
            <option value="">Todos los estatus</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Academia</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Coordinador</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de registro</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estatus</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                      <p className="text-sm text-slate-500 font-medium">Cargando academias...</p>
                    </div>
                  </td>
                </tr>
              ) : academiasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <BookOpen className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">Sin resultados</h3>
                      <p className="text-sm text-slate-500">
                        No se encontraron academias que coincidan con la búsqueda.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                academiasFiltradas.map(a => (
                  <tr key={a.id_academia} className="hover:bg-blue-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{a.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <span className="text-sm text-slate-600 font-medium">{a.coordinador_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-medium">
                      {new Date(a.fecha_creacion).toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${
                        a.estatus === 'ACTIVO'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {a.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          title="Editar academia"
                          onClick={() => prepararEdicion(a)}
                          className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                        >
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button
                          title={a.estatus === 'ACTIVO' ? 'Desactivar academia' : 'Activar academia'}
                          onClick={() => handleToggleEstatus(a.id_academia, a.estatus)}
                          className={`p-2 rounded-lg transition-all ${
                            a.estatus === 'ACTIVO'
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edición */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">Editar academia</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Nombre de la academia</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Coordinador</label>
                <select
                  value={formData.usuario_id}
                  onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm transition-all cursor-pointer"
                >
                  <option value="">Seleccione</option>
                  {coordinadores.map(c => (
                    <option key={c.id_usuario} value={c.id_usuario}>
                      {c.nombres} {c.apellido_paterno}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
