import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { AltaDocente } from "./AltaDocente";
import { UserForm } from "../users/UserForm"; 
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth"; 

export const MiPerfil = () => {
  const { user } = useAuth(); 
  const [miExpediente, setMiExpediente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarMiPerfil = async () => {
      try {
        if (user?.rol_id === 3) {
          const response = await api.get(`/docentes/${user.id_usuario}`);
          setMiExpediente(response.data.data || response.data);
        } else {
          const response = await api.get(`/users/${user.id_usuario}`);
          setMiExpediente(response.data.data || response.data);
        }
      } catch (error) {
        console.error("Error al cargar mi perfil desde la BD:", error);
        setMiExpediente(user);
      } finally {
        setCargando(false);
      }
    };

    if (user) {
      cargarMiPerfil();
    }
  }, [user]);

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Cargando tu perfil...</p>
      </div>
    );
  }

  if (!miExpediente) {
    return (
      <div className="bg-red-50 text-red-800 p-6 rounded-xl border border-red-100 text-center">
        <h3 className="text-lg font-bold mb-2">Perfil no encontrado</h3>
        <p>Hubo un problema al cargar tus datos. Contacta a soporte o a un administrador.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
      </div>

      {user?.rol_id === 3 ? (
        <AltaDocente 
          docenteToEdit={miExpediente} 
          onBack={() => navigate('/dashboard')} 
          onSuccess={() => navigate('/dashboard')}
        />
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <UserForm 
            userToEdit={miExpediente} 
            onBack={() => navigate('/dashboard')} 
            onSuccess={() => navigate('/dashboard')}
          />
        </div>
      )}
    </div>
  );
};