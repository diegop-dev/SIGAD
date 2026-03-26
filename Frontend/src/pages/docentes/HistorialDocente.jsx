import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Award, BookOpen, Clock, Users, X } from 'lucide-react';

// Le agregamos la prop "alCerrar"
const HistorialDocente = ({ docenteId, alCerrar }) => {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const response = await api.get(`/docentes/historial/${docenteId}`);
        setDatos(response.data);
      } catch (error) {
        toast.error("Error al cargar el historial del docente");
      } finally {
        setCargando(false);
      }
    };

    if (docenteId) cargarHistorial();
  }, [docenteId]);

  return (
    // Agregamos el fondo oscuro y centrado del modal
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] p-4 transition-all">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        
        {/* Cabecera del Modal con el botón de cerrar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Expediente Docente</h2>
          <button onClick={alCerrar} className="text-gray-500 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {cargando ? (
          <div className="text-center p-10 text-gray-500 animate-pulse">Consultando archivos de SIGAD...</div>
        ) : !datos ? (
          <div className="text-center p-10 text-red-500">No se pudo cargar la información.</div>
        ) : (
          <>
            {/* Tarjeta de Perfil */}
            <div className="flex items-start gap-4 mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100">
              <div className="p-3 bg-blue-600 text-white rounded-full">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {datos.perfil.nombres} {datos.perfil.apellido_paterno} {datos.perfil.apellido_materno}
                </h2>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><BookOpen className="w-4 h-4"/> {datos.perfil.nivel_academico}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> Antigüedad: {datos.perfil.anos_antiguedad} años</span>
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
                  {datos.historial.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-400">Sin registro de clases anteriores.</td></tr>
                  ) : (
                    datos.historial.map((clase, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-800">{clase.periodo}</td>
                        <td className="px-4 py-3">{clase.materia}</td>
                        <td className="px-4 py-3">{clase.grupo}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-md font-bold ${
                            clase.promedio_consolidado >= 8 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
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