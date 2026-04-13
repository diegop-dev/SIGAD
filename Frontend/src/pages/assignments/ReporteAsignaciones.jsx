import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Printer, Search, FileText, Calendar, X, MapPin, Loader2 } from 'lucide-react';

const DIAS_SEMANA = {
  1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom'
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

  const getStatusBadge = (estatus) => {
    const statusMap = {
      'ENVIADA': 'bg-blue-100 text-blue-800 border-blue-200',
      'ACEPTADA': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'RECHAZADA': 'bg-red-100 text-red-800 border-red-200',
    };
    return (
      <span className={`px-3 py-1 inline-flex text-xs font-bold uppercase tracking-wider rounded-lg border ${statusMap[estatus] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
        {estatus || 'DESCONOCIDO'}
      </span>
    );
  };

  // ─── LÓGICA DE COLORES EXACTA DE AssignmentManagement.jsx ───
  const getTipoAsignaturaStyles = (tipo) => {
    if (tipo === 'TRONCO_COMUN') return 'bg-white text-slate-700 border-slate-300';
    if (tipo === 'OBLIGATORIA') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (tipo === 'OPTATIVA') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 print:p-0 print:bg-white print:backdrop-blur-none transition-all">
      
      <div className="bg-slate-50 rounded-2xl shadow-xl w-full max-w-7xl p-5 max-h-[95vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible print:w-full print:absolute print:inset-0 print:bg-white print:p-4">
        
        <div className="print:hidden flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              Informe de Asignaciones
            </h1>
            <p className="mt-1 text-sm text-slate-500 font-medium">Consulta y exportación de cargas horarias (Formato Carta).</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto items-center">
            {/* BUSCADOR */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar docente o materia..." 
                className="w-full pl-11 pr-4 py-2.5 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl text-sm transition-all outline-none border"
                value={busqueda} 
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
<<<<<<< HEAD
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
=======
            <button 
              onClick={handleImprimir}
              className="flex items-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-xl hover:bg-slate-700 transition-all text-sm font-bold shadow-md"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button 
              onClick={alCerrar} 
              className="ml-2 p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
>>>>>>> f077882590116f3213427c490c599d2888b309b2
            </button>
          </div>
        </div>

        {/* ENCABEZADO EXCLUSIVO PARA IMPRESIÓN */}
        <div className="hidden print:block mb-6 text-center mt-4">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Sistema SIGAD</h1>
          <h2 className="text-lg font-bold text-slate-700 mt-1">Reporte Oficial de Asignaciones Docentes</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Fecha de emisión: {new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <hr className="my-4 border border-slate-300" />
        </div>

        {/* TABLA DE DATOS */}
        <div className="bg-white shadow-sm rounded-2xl border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 table-fixed print:table-auto">
              <thead className="bg-slate-50/50 print:bg-transparent">
                <tr>
                  <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider print:text-slate-900">Docente titular</th>
                  <th scope="col" className="w-2/5 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider print:text-slate-900">Materia y Grupo</th>
                  <th scope="col" className="w-1/4 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider print:text-slate-900">Horario y Aula</th>
                  <th scope="col" className="w-auto px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider print:hidden">Estatus</th>
                </tr>
              </thead>
<<<<<<< HEAD
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
=======
              <tbody className="bg-white divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
                        <p className="text-sm text-slate-500 font-medium">Generando informe...</p>
                      </div>
                    </td>
                  </tr>
                ) : datosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="bg-slate-100 p-4 rounded-full mb-4">
                          <FileText className="h-8 w-8 text-slate-400" />
>>>>>>> f077882590116f3213427c490c599d2888b309b2
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Sin resultados</h3>
                        <p className="text-xs text-slate-500">No se encontraron asignaciones en este reporte.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  datosFiltrados.map((item) => {
                    const materiaType = item.tipo_materia || 'DESCONOCIDO';
                    const academicLevel = item.nivel_academico || 'LICENCIATURA';
                    const esGrupoGlobal = item.grupo === 'N/A' || item.grupo === 'TRONCO COMÚN / GLOBAL';

                    return (
                      <tr key={item.id_asignacion} className="hover:bg-blue-50/50 transition-colors duration-150 print:break-inside-avoid print:hover:bg-transparent">
                        
                        {/* DOCENTE */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900 print:text-black">
                            {item.docente}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 font-medium print:text-slate-700">
                            Matrícula: {item.matricula_empleado}
                          </div>
                        </td>

                        {/* MATERIA, GRUPO Y BADGES */}
                        <td className="px-4 py-4">
                          <div className="text-sm font-bold text-slate-800 break-words max-w-[250px] print:text-black">
                            {item.materia}
                          </div>
                          
                          {/* Badges y datos agrupados (Idéntico a AssignmentManagement) */}
                          <div className="text-xs text-slate-500 font-medium mt-2 flex flex-wrap items-center gap-2 print:text-slate-800">
                            <span>
                              {esGrupoGlobal ? item.periodo : `Grupo: ${item.grupo} • ${item.periodo}`}
                            </span>
                            
                            {/* Insignia Nivel Académico */}
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border print:border-slate-300 ${
                              academicLevel === 'MAESTRIA' 
                                ? 'bg-amber-100 text-amber-700 border-amber-200' 
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}>
                              {academicLevel}
                            </span>
                            
                            {/* Insignia Tipo de Materia */}
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border print:border-slate-300 ${getTipoAsignaturaStyles(materiaType)}`}>
                              {materiaType.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>

                        {/* HORARIO Y AULA */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center text-xs font-bold inline-flex px-2.5 py-1.5 rounded-lg border bg-slate-100/80 text-slate-700 border-slate-200 w-max print:bg-transparent print:border-slate-300 print:text-black">
                              <Calendar className="w-3.5 h-3.5 mr-1.5 text-amber-500 print:text-slate-700" />
                              {DIAS_SEMANA[item.dia_semana]}: {formatHora(item.hora_inicio)} - {formatHora(item.hora_fin)}
                            </div>
                            <div className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1 print:text-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 print:text-slate-700" />
                              Aula: {item.aula}
                            </div>
                          </div>
                        </td>

                        {/* ESTATUS (Oculto en impresión) */}
                        <td className="px-4 py-4 whitespace-nowrap print:hidden">
                          {getStatusBadge(item.estatus_confirmacion)}
                        </td>

                      </tr>
                    );
                  })
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