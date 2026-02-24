import React, { useState } from 'react';
import { UserX, Loader2 } from 'lucide-react'; 

const BotonDesactivarUsuario = ({ usuarioId, adminId, alExito }) => {
  const [cargando, setCargando] = useState(false);

  const manejarDesactivacion = async () => {
    if (!window.confirm("¿Confirmas que deseas desactivar este usuario?")) return;

    setCargando(true);

    try {
      // Use rutas simularas, por estan sugetas a la lista de usurios
      const response = await fetch(`/api/users/desactivar/${usuarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eliminado_por: adminId })
      });

      if (response.ok) {
        alExito(); 
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      onClick={manejarDesactivacion}
      disabled={cargando}
      className={`
        font-['Figtree'] flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
        ${cargando 
          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
          : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200'}
      `}
    >
      {cargando ? (
        <>
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Procesando...</span>
        </>
      ) : (
        <>
          <UserX className="h-4 w-4" />
          <span>Desactivar Usuario</span>
        </>
      )}
    </button>
  );
};
export default BotonDesactivarUsuario;