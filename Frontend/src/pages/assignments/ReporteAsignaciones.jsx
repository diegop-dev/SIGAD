import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Printer, Search, FileText, Calendar, X } from 'lucide-react';

const DIAS_SEMANA = {
  1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
};

const ReporteAsignaciones = ({ alCerrar }) => {
  const [listaAsignaciones, setListaAsignaciones] = useState([]);
  const [estaCargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const respuesta = await api.get('/reportes/asignaciones');
        setListaAsignaciones(respuesta.data);
      } catch (error) {
        toast.error('Error al cargar el reporte de asignaciones');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const manejarImpresion = () => {
    window.print();
  };
 const busquedaLimpia = terminoBusqueda.trim().toLowerCase();
  const datosFiltrados = listaAsignaciones.filter(item => 
    item.docente.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.materia.toLowerCase().includes(busqueda.toLowerCase())
  );
const sinDatos = datosFiltrados.length === 0;
  const formatearHora = (hora) => hora ? hora.substring(0, 5) : '';

  return (
    // Fondo oscuro que desaparece al imprimir
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 print:p-0 print:bg-white print:backdrop-blur-none transition-all">
      
      {/* Contenedor principal que se vuelve pantalla completa al imprimir */}
      <div className="bg-gray-50 rounded-xl shadow-lg w-full max-w-6xl p-6 max-h-[95vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible print:w-full print:absolute print:inset-0 print:bg-white">
        
        <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white p-4 rounded-xl border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Informe de Asignaciones
            </h1>
            <p className="text-gray-500 text-sm">Consulta y exportación de cargas horarias</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto items-center">
            {/* BUSCADOR */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" placeholder="Buscar docente o materia..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {/* BOTÓN DE IMPRIMIR BLINDADO */}
        <button 
              onClick={manejarImpresion}
              disabled={sinDatos || estaCargando}
              title={sinDatos ? "No hay registros disponibles para imprimir" : "Imprimir o exportar a PDF"}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                sinDatos || estaCargando
                  ? 'bg-gray-300 text-gray-600' 
                  : 'bg-slate-800 text-white hover:bg-slate-700' 
              }`}
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            
            <button onClick={alCerrar} className="ml-2 p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Cerrar reporte">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ENCABEZADO EXCLUSIVO PARA IMPRESIÓN */}
        <div className="hidden print:block mb-8 text-center mt-8">
          <h1 className="text-3xl font-black text-gray-900 uppercase">Sistema SIGAD</h1>
          <h2 className="text-xl font-bold text-gray-700 mt-2">Reporte Oficial de Asignaciones Docentes</h2>
          <p className="text-gray-500 mt-1">Fecha de emisión: {new Date().toLocaleDateString()}</p>
          <hr className="my-4 border-2 border-gray-800" />
        </div>

        {/* TABLA DE DATOS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-blue-50 text-blue-900 border-b border-blue-100 print:bg-gray-100 print:text-black">
                <tr>
                  <th className="px-4 py-3 font-bold">Docente</th>
                  <th className="px-4 py-3 font-bold">Materia</th>
                  <th className="px-4 py-3 font-bold">Grupo / Carrera</th>
                  <th className="px-4 py-3 font-bold">Horario y Aula</th>
                  <th className="px-4 py-3 font-bold text-center print:hidden">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {estaCargando ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400 animate-pulse">Generando informe...</td></tr>
                ) : datosFiltrados.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-10 text-gray-400">No se encontraron asignaciones.</td></tr>
                ) : (
                  datosFiltrados.map((item) => (
                    <tr key={item.id_asignacion} className="hover:bg-gray-50 print:break-inside-avoid">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800">{item.docente}</p>
                        <p className="text-xs text-gray-500">Matrícula: {item.matricula_empleado}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{item.materia}</p>
                        <p className="text-xs text-blue-600 font-semibold">{item.periodo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-700">{item.grupo}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{item.carrera}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="font-medium">{DIAS_SEMANA[item.dia_semana]}</span>
                          <span className="text-gray-500">({formatearHora(item.hora_inicio)} - {formatearHora(item.hora_fin)})</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">📍 {item.aula}</p>
                      </td>
                      <td className="px-4 py-3 text-center print:hidden">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-wider ${
                          item.estatus_confirmacion === 'ACEPTADA' ? 'bg-emerald-100 text-emerald-700' :
                          item.estatus_confirmacion === 'RECHAZADA' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.estatus_confirmacion}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReporteAsignaciones;