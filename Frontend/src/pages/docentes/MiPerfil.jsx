import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AltaDocente } from "./AltaDocente";
import { Loader2 } from "lucide-react";

export const MiPerfil = () => {
  const [miExpediente, setMiExpediente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarMiPerfil = async () => {
      try {
        const response = await api.get("/docentes/mi-perfil");
        setMiExpediente(response.data);
      } catch (error) {
        console.error("Error al cargar mi perfil:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarMiPerfil();
  }, []);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando tu expediente...</p>
      </div>
    );
  }

  if (!miExpediente) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-100 text-center">
        <h3 className="text-lg font-bold mb-2">Expediente no encontrado</h3>
        <p>Hubo un problema al cargar tus datos. Contacta a un administrador.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-800">Mi Perfil Docente</h1>
        <p className="text-slate-500">Aquí puedes mantener actualizada tu información de contacto y documentos.</p>
      </div>

      {/* Le pasamos "docenteToEdit" para que AltaDocente sepa que estamos en modo edición */}
      <AltaDocente 
        docenteToEdit={miExpediente} 
        onBack={() => navigate('/dashboard')} 
        onSuccess={() => {
          // Refrescar la página o redirigir al dashboard después de guardar
          navigate('/dashboard'); 
        }}
      />
    </div>
  );
};