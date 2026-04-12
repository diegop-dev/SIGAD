import React, { useState } from 'react';
import { Save, X, Loader2, AlertCircle } from 'lucide-react';
import api from '../../services/api'; 
import toast from 'react-hot-toast';

const EDIFICIOS_DISPONIBLES = [
  "Edificio A",
  "Edificio B",
  "Edificio C",
  "Edificio D",
  "Planta Baja",
  "Planta Alta"
];

const ModalEditarAula = ({ aula, alCerrar, alExito, adminId }) => {
  const ubicacionesFinales = EDIFICIOS_DISPONIBLES.includes(aula.ubicacion)
    ? EDIFICIOS_DISPONIBLES
    : [...EDIFICIOS_DISPONIBLES, aula.ubicacion].filter(Boolean);
    
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: aula.nombre_codigo || '',
    tipo: aula.tipo || 'AULA',
    capacidad: aula.capacidad || '',
    ubicacion: aula.ubicacion || '',
    estatus: aula.estatus || 'ACTIVO'
  });
  
  const [estaCargando, setEstaCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState(null);
  const [accionServidor, setAccionServidor] = useState(null);
  //optimizacion
 const { nombre, tipo, capacidad, ubicacion, estatus } = datosFormulario;
  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setDatosFormulario({ ...datosFormulario, [name]: value });
    setMensajeError(null);
  };

  const mmanejarEnvio = async (evento) => {
    evento.preventDefault();
    // ==========================================
    //  VALIDACIONES CLONADAS DE LA HU-29
    // ==========================================
    const nombreLimpio = nombre.trim();

    if (!nombreLimpio) {
      return setMensajeError("El nombre no puede estar vacío ni contener solo espacios.");
    }

    const regexNombreSeguro = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-.]+$/;
    if (!regexNombreSeguro.test(nombreLimpio)) {
      return setMensajeError("El nombre solo permite letras, números, espacios, guiones (-) y puntos.");
    }

    const capacidadNumerica = parseInt(capacidad, 10);
    if (isNaN(capacidadNumerica) || capacidadNumerica < 1 || capacidadNumerica > 200) {
      return setMensajeError("La capacidad debe ser un número válido entre 1 y 200.");
    }
    setEstaCargando(true);
    setMensajeError(null);
    const toastId = toast.loading("Actualizando espacio...");
try {
      const cargaUtil = {
        ...datosFormulario,
        nombre: nombreLimpio, 
        capacidad: capacidadNumerica, 
        modificado_por: idAdministrador
      };
    const respuesta = await api.patch(`/aulas/actualizar/${aula.id_aula}`, cargaUtil);

      if (response.status === 200) {
        toast.success("¡Espacio actualizado con éxito!", { id: toastId });
        alExito(); 
        alCerrar(); 
      }
    } catch (error) {
      const codigoEstado = error.response?.status;
      const datosError = error.response?.data || {};

      // Intercepción del bloqueo de integridad relacional
      if (codigoEstado === 409 && datosError.action === "BLOCK") {
        setAccionServidor("BLOCK");
        setMensajeError(detalles || "Conflicto de integridad referencial.");
        toast.error("Operación denegada por reglas de integridad", { id: toastId, duration: 8000 });
      } else {
        const mensajeStr = datosError.message || datosError.error || "Error al conectar con el servidor.";
        setMensajeError(mensajeStr);
        toast.error("No se pudo actualizar el espacio", { id: toastId });
      }
    } finally {
      setEstaCargando(false);
    }
  };
return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-['Figtree'] transition-all">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
        
        {/* ENCABEZADO*/}
        <div className={`flex justify-between items-center p-4 border-b ${accionServidor === 'BLOCK' ? 'bg-amber-50 border-amber-100' : 'bg-white'}`}>
          <div className="flex items-center gap-2">
            {accionServidor === 'BLOCK' && <Ban className="w-5 h-5 text-amber-600" />}
            <h2 className={`text-xl font-bold ${accionServidor === 'BLOCK' ? 'text-amber-800' : 'text-gray-800'}`}>
              {accionServidor === 'BLOCK' ? 'Actualización Bloqueada' : 'Actualizar espacio'}
            </h2>
          </div>
          <button onClick={alCerrar} disabled={estaCargando} className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {mensajeError && (
            <div className={`mb-5 p-3 rounded-lg flex items-start gap-2 text-sm border ${accionServidor === 'BLOCK' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-600 border-red-100'}`}>
              {accionServidor === 'BLOCK' ? <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />}
              <p className="font-medium leading-snug">{mensajeError}</p>
            </div>
          )}

          <form onSubmit={manejarEnvio} className="space-y-4">
            {/* NOMBRE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input 
                type="text" name="nombre" value={nombre} onChange={manejarCambio} required
                maxLength={50} disabled={accionServidor === 'BLOCK'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* TIPO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  name="tipo" value={tipo} onChange={manejarCambio} disabled={accionServidor === 'BLOCK'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="AULA">Aula</option>
                  <option value="LABORATORIO">Laboratorio</option>
                </select>
              </div>
              {/* CAPACIDAD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
                <input 
                  type="number" name="capacidad" value={capacidad} onChange={manejarCambio} min="1" max="200" required
                  disabled={accionServidor === 'BLOCK'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* UBICACIÓN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edificio / Ubicación</label>
              <select 
                name="ubicacion" value={ubicacion} onChange={manejarCambio} required disabled={accionServidor === 'BLOCK'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="" disabled>Selecciona un edificio...</option>
                {ubicacionesFinales.map((edificioLista) => (
                  <option key={edificioLista} value={edificioLista}>
                    {edificioLista}
                  </option>
                ))}
              </select>
            </div>

            {/* ESTATUS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estatus</label>
              <select 
                name="estatus" value={estatus} onChange={manejarCambio} disabled={accionServidor === 'BLOCK'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="ACTIVO">Activo</option>
                <option value="MANTENIMIENTO">En Mantenimiento</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button 
                type="button" onClick={alCerrar} disabled={estaCargando}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                {accionServidor === 'BLOCK' ? 'Entendido, cerrar' : 'Cancelar'}
              </button>
              
              
              {accionServidor !== 'BLOCK' && (
                <button 
                  type="submit" disabled={estaCargando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium disabled:opacity-50 shadow-sm"
                >
                  {estaCargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {estaCargando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
  
};

export default ModalEditarAula;