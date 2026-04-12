import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Award, BookOpen, Clock, Users, X, AlertCircle } from 'lucide-react'; 

const HistorialDocente = ({ docenteId, alCerrar }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        setCargando(true); 
        const response = await api.get(`/docentes/historial/${docenteId}`); 
        setDatos(response.data);
      } catch (error) {
        toast.error("Error al cargar el historial del docente");
        setDatos(null); 
      } finally {
        setCargando(false);
      }
    };

    if (docenteId) cargarHistorial();
  }, [docenteId]);


  const handleOverlayClick = (e) => {
    if (e.target.id === 'modal-overlay') {
      alCerrar();
    }
  };

  const perfil = datos?.perfil;
  const historial = datos?.historial || [];

  return (
    <div 
      id="modal-overlay"
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 transition-all cursor-pointer"
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto cursor-default">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Expediente Docente</h2>
          <button onClick={alCerrar} className="text-gray-500 hover:text-red-500 transition-colors bg-gray-50 p-1.5 rounded-lg hover:bg-red-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargando ? (
         
          <div className="text-center p-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Consultando archivos...</p>
          </div>
        ) : !datos ? (
    
          <div className="text-center p-10 bg-red-50 border border-red-100 rounded-xl flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
            <p className="text-red-600 font-medium">No se pudo cargar la información del docente.</p>
          </div>
        ) : (
          <>
       
            <div className="flex items-start gap-4 mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="p-3 bg-blue-600 text-white rounded-full shrink-0">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {perfil?.nombres} {perfil?.apellido_paterno} {perfil?.apellido_materno}
                </h2>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600 font-medium">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4 text-blue-500"/> {perfil?.nivel_academico || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-blue-500"/> Antigüedad: {perfil?.anos_antiguedad || 0} años
                  </span>
                </div>
              </div>
            </div>

            {/* Tabla de Historial */}
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" /> Materias Impartidas
            </h3>
            
            <div className="overflow-hidden border border-gray-200 rounded-xl">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Periodo</th>
                    <th className="px-4 py-3 font-semibold">Materia</th>
                    <th className="px-4 py-3 font-semibold">Grupo</th>
                    <th className="px-4 py-3 font-semibold text-center">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-400 font-medium">
                        Sin registro de clases anteriores.
                      </td>
                    </tr>
                  ) : (
                    historial.map((clase, index) => (
                      <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-800">{clase.periodo}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">{clase.materia}</td>
                        <td className="px-4 py-3 text-gray-600">{clase.grupo}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-md font-bold text-xs tracking-wide ${
                            clase.promedio_consolidado >= 8 ? 'bg-emerald-100 text-emerald-700' : 
                            clase.promedio_consolidado ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {clase.promedio_consolidado ? clase.promedio_consolidado : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistorialDocente;