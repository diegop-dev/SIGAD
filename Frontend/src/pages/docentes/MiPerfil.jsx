import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { DocenteProfile } from "./DocenteProfile";   // ← reemplaza AltaDocente
import { UserProfile }    from "../users/UserProfile";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export const MiPerfil = () => {
  const { user, updateUserData } = useAuth();
  const [miExpediente, setMiExpediente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cargarMiPerfil = async () => {
      try {
        if (user?.rol_id === 3) {
          // ← Corrección: el endpoint correcto es /docentes/mi-perfil (protegido por token).
          //   La ruta anterior /docentes/:id_usuario no existe como GET → causaba 404
          //   y el componente caía silenciosamente al fallback del catch.
          //
          // Se hace también una segunda llamada para obtener personal_email, que no
          // está incluido en el SELECT de getAllDocentes() del modelo.
          const [expRes, userRes] = await Promise.all([
            api.get("/docentes/mi-perfil"),
            api.get(`/users/${user.id_usuario}`),
          ]);
          const expediente = expRes.data.data  || expRes.data;
          const userData   = userRes.data.data || userRes.data;
          setMiExpediente({ ...expediente, personal_email: userData?.personal_email });
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

    if (user) cargarMiPerfil();
  }, [user]);

  const handlePhotoUpdate = (newRelativeUrl) => {
    updateUserData({ foto_perfil_url: newRelativeUrl });
  };

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
        <p>Hubo un problema al cargar tus datos. Contacta a soporte o a un Administrador.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {user?.rol_id === 3 ? (
        <DocenteProfile
          expediente={miExpediente}
          onBack={() => navigate("/dashboard")}
          onPhotoUpdate={handlePhotoUpdate}
        />
      ) : (
        <UserProfile
          userToView={miExpediente}
          onBack={() => navigate("/dashboard")}
          onPhotoUpdate={handlePhotoUpdate}
        />
      )}
    </div>
  );
};