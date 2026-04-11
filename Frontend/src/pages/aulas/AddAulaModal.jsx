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

const ModalRegistroAula = ({ alCerrar, alExito, idAdministrador }) => {
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    tipo: 'AULA', 
    capacidad: '',
    ubicacion: ''
  });
  
  const [estaCargando, setEstaCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState(null);
//optimizacion
  const { nombre, tipo, capacidad, ubicacion } = datosFormulario;

  const manejarCambio = (evento) => {
    const { name, value } = evento.target;
    setDatosFormulario({ ...datosFormulario, [name]:value });
    setMensajeError(null); 
  };

  const manejarEnvio = async (evento) => {
    evento.preventDefault();
    
    // ==========================================
    // VALIDACIONES DE SEGURIDAD (FRONTEND)
    // ==========================================
    
    // 1. Limpiar espacios al inicio y al final
    const nombreLimpio = nombre.trim();

    // 2. Validar que no esté vacío (anti-espacios)
    if (!nombreLimpio) {
     return setMensajeError("El nombre no puede estar vacío ni contener solo espacios.");
    }

    // 3. Validar caracteres (Solo letras, números, espacios, guiones y puntos)
    // Se incluyen acentos y la Ñ para soportar nombres como "Cómputo y Ñoño"
    const regexNombreSeguro = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-.]+$/;
    if (!regexNombreSeguro.test(nombreLimpio)) {
      return setMensajeError("El nombre solo permite letras, números, espacios, guiones (-) y puntos.");  
    }

    // 4. Validar Capacidad realista (1 a 200)
    const capacidadNumerica = parseInt(capacidad, 10);
    if (isNaN(capacidadNumerica) || capacidadNumerica < 1 || capacidadNumerica > 200) {
     return setMensajeError("La capacidad debe ser un número válido entre 1 y 200.");
      
    }

    // Si pasamos todas las validaciones, procedemos a guardar (envio al servidor)
    setEstaCargando(true);
    setMensajeError(null);

    try {
      const datosAEnviar = {
        ...datosFormulario,
        nombre: nombreLimpio, // VALIDACIONES Enviamos el nombre ya limpio (sin espacios extra)
        capacidad: capacidadNumerica, 
        creado_por: idAdministrador 
      };
      
      const respuesta = await api.post('/aulas/registrar', datosAEnviar);

      if (respuesta.status === 201) {
        toast.success('¡Espacio registrado con éxito!');
        alExito(); 
        alCerrar();
      }
    } catch (errorServidor) {
      const mensaje = errorServidor.response?.data?.message || "Error al conectar con el servidor";
      toast.error(mensaje);
    } finally {
      setEstaCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 font-['Figtree'] transition-all">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        {/* ENCABEZADO */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Espacio</h2>
          <button onClick={alCerrar} className="text-gray-500 hover:text-red-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
{/* ALERTA DE ERRORES */}
        {mensajeError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{mensajeError}</p>
          </div>
        )}
{/* FORMULARIO */}
        <form onSubmit={manejarEnvio} className="space-y-4">
          {/* CAMPO: NOMBRE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre / Código</label>
            <input 
              type="text" name="nombre" value={nombre} onChange={manejarCambio} 
              required placeholder="Ej. A-101 o Lab. Cómputo 1"
              maxLength={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* CAMPO: TIPO */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                name="tipo" value={tipo} onChange={manejarCambio}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="AULA">Aula</option>
                <option value="LABORATORIO">Laboratorio</option>
              </select>
            </div>
            {/* CAMPO: CAPACIDAD */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad</label>
              <input 
                type="number" name="capacidad" value={capacidad} onChange={manejarCambio} 
                min="1" max="200" required placeholder="Ej. 40"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
{/* CAMPO: UBICACIÓN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edificio / Ubicación</label>
            <select 
              name="ubicacion" 
              value={ubicacion} 
              onChange={manejarCambio} 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="" disabled>Selecciona un edificio...</option>
              {EDIFICIOS_DISPONIBLES.map((edificioLista) => (
                <option key={edificioLista} value={edificioLista}>
                  {edificioLista}
                </option>
              ))}
            </select>
          </div>
{/* BOTONES DE ACCIÓN */}
          <div className="flex justify-end gap-3 mt-6">
            <button 
              type="button" onClick={alCerrar} disabled={estaCargando}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button 
              type="submit" disabled={estaCargando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              {estaCargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {estaCargando ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalRegistroAula;