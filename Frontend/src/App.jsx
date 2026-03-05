import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Toaster } from "react-hot-toast";
import { MainLayout } from "./components/MainLayout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { UserManagement } from "./pages/users/UserManagement";
import { DocenteManagement } from "./pages/docentes/DocenteManagement";
import { AcademiaManagement } from "./pages/academia/AcademiaManagement";
<<<<<<< HEAD
=======
import { MateriasManagement } from "./pages/materias/materiasManagement";
import { periodosManagement } from "./pages/periodos/periodosManagement";
>>>>>>> 6f12e3107348b110f0d0d01cfa99ca65a1dadf49
import { MateriasManagement } from "./pages/materias/MateriasManagement";
import { CarreraManagement } from "./pages/carreras/CarreraManagement";

function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* 1. Capa de seguridad global: Protege todo el layout para evitar el parpadeo */}
        <Route element={<ProtectedRoute />}>
          
          <Route element={<MainLayout />}>
            {/* Rutas accesibles para cualquier usuario autenticado */}
            <Route path="/dashboard" element={<Dashboard />} />

            {/* 2. Capa de seguridad granular: Protege módulos específicos por rol (RBAC) */}
            <Route element={<ProtectedRoute allowedRoles={[1, 2]} />}>
              <Route path="/usuarios" element={<UserManagement />} />
              <Route path="/docentes" element={<DocenteManagement />} />
              <Route path="/academias" element={<AcademiaManagement />} />
              <Route path="/materias" element={<MateriasManagement />} />
<<<<<<< HEAD
              <Route path="/carreras" element={<CarreraManagement />} />
              <Route path="/periodos" element={<periodosManagement />} />
=======
              <Route path="/periodos" element={<periodosManagement />} />
              <Route path="/carreras" element={<CarreraManagement />} />
>>>>>>> 6f12e3107348b110f0d0d01cfa99ca65a1dadf49
              {/* Aquí irán /carreras, /materias, etc. */}
            </Route>

            {/* 3. Rutas específicas para docentes (rol_id = 3) */}
            <Route element={<ProtectedRoute allowedRoles={[3]} />}>
              {/* <Route path="/mi-horario" element={<TeacherSchedule />} /> */}
            </Route>
          </Route>
          
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App;
