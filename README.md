<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0066cc,100:00d9ff&height=280&section=header&text=SIGAD&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Sistema%20de%20Gesti%C3%B3n%20Acad%C3%A9mica%20y%20Docente&descSize=20&descAlignY=60" alt="SIGAD Header" width="100%" />

  <br/>

  <img src="https://img.shields.io/badge/Status-En%20Desarrollo-yellow?style=for-the-badge&logo=fire" alt="Status" />
  <img src="https://img.shields.io/badge/Team-NexaByte-blue?style=for-the-badge&logo=microsoftteams" alt="Team" />
  <img src="https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge&logo=semver" alt="Version" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white" alt="MariaDB" />
</div>

---

## 📖 Descripción del Proyecto

**SIGAD (Sistema de Gestión Académica y Docente)** es una solución web para la asignación de materias y horarios en universidades, diseñada para eliminar errores como cruces de horario y sobrecarga de horas docentes. A diferencia de la gestión manual tradicional, SIGAD valida reglas académicas en tiempo real y se sincroniza de forma bidireccional con el sistema externo **SESA** (Sistema de Evaluación y Seguimiento Académico), centralizando la toma de decisiones con base en estadísticas de rendimiento y deserción.

### Características Principales
- ✅ Validación en tiempo real de empalmes de horario y sobrecarga docente
- 🔄 Sincronización bidireccional con el sistema externo SESA vía red privada
- 📊 Métricas institucionales e indicadores históricos de rendimiento académico
- 🔐 Control de acceso basado en roles (RBAC): Superadministrador, Administrador y Docente
- 🧾 Registro de auditoría inmutable con trazabilidad completa de acciones críticas
- 📄 Generación de reportes y horarios en formato PDF

---

## 👥 Equipo: NexaByte

Desarrollado por estudiantes de la **Licenciatura en Ingeniería de Software y Sistemas Computacionales** — UNID Campus Campeche.

| Rol | Integrante |
| :--- | :--- |
| 👑 Líder | Jorge Andrés Faisal Sulub |
| 🏗️ Arquitecto de Software | Diego Manuel Pérez Estrella |
| 💻 Desarrollador | Andrés Oswaldo Heredia Torres |
| 💻 Desarrollador | José Alberto Castillo Vieyra |
| 💻 Desarrollador | Luis Felipe Quintero Cervera |
| 🧪 Tester | Melvin Yuriel Gutiérrez Martinez |
| 🧪 Tester | Abraham Kantun Cauich |

---

## 🏗️ Arquitectura del Sistema

SIGAD implementa una arquitectura **Cliente-Servidor desacoplada**, comunicada mediante una **API RESTful**, que garantiza la separación de responsabilidades entre la interfaz de usuario y la lógica de negocio.

### Capas del Sistema

**1.1 Frontend (SPA — React + Vite)**
Interfaz responsiva que renderiza vistas dinámicamente sin recargar la página. Emite peticiones HTTP asíncronas en formato JSON hacia el servidor en respuesta a las interacciones del usuario.

**1.2 Backend (API — Node.js + Express)**
Actúa como la API central del sistema. Su lógica se divide en cinco categorías basadas en el control de acceso por roles:

| Módulo | Descripción |
| :--- | :--- |
| **Principal** | Dashboard de inicio con resumen general del sistema |
| **Control de Personal** | Usuarios, Docentes y Asignaciones (puente de sincronización SESA) |
| **Gestión Académica** | Academias, Carreras, Materias, Aulas, Grupos y Periodos |
| **Métricas y Seguridad** | Exclusivo Superadmin — Métricas institucionales y Audit Logs |
| **Mi Espacio** | Entorno del docente — Mis Asignaciones y Mi Horario |

**1.3 Capa de Datos y Red**

- **Tailscale:** VPN basada en WireGuard que crea una Tailnet privada. Expone las APIs de SIGAD de forma segura y permite consumir las APIs de SESA sin abrir puertos públicos.
- **MariaDB (InnoDB):** Garantiza integridad transaccional ACID. Versión recomendada: `11.4.10`.
- **DBeaver:** Cliente gráfico para administración, diseño de esquemas y depuración SQL.

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) **React** | ^19.2.0 | SPA basada en componentes funcionales |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) **Vite** | ^7.3.1 | Bundler con recarga en caliente y build optimizado |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white) **Tailwind CSS** | ^4.1.18 | Diseño responsivo con utilidades CSS |

### Backend
| Tecnología | Versión | Propósito |
| :--- | :--- | :--- |
| ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) **Node.js** | LTS | Entorno de ejecución asíncrono y no bloqueante |
| ![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white) **Express.js** | ^5.2.1 | Framework para la API RESTful y middlewares |

### Base de Datos e Infraestructura
| Tecnología | Propósito |
| :--- | :--- |
| ![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat&logo=mariadb&logoColor=white) **MariaDB** | RDBMS relacional con integridad ACID |
| ![DBeaver](https://img.shields.io/badge/DBeaver-372923?style=flat&logo=dbeaver&logoColor=white) **DBeaver** | Community | Cliente gráfico multiplataforma para administración, diseño de esquemas y depuración SQL sobre MariaDB |
| ![Tailscale](https://img.shields.io/badge/Tailscale-000000?style=flat&logo=tailscale&logoColor=white) **Tailscale** | VPN privada (Tailnet) para comunicación segura con SESA |
| ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white) **Git / GitHub** | Control de versiones y base para CI/CD |

---

## 📦 Dependencias

### Frontend (React / Vite)

| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `react` & `react-dom` | ^19.2.0 | Librería principal de UI basada en componentes |
| `react-router-dom` | ^7.13.0 | Enrutamiento interno de la SPA |
| `axios` | ^1.13.5 | Cliente HTTP para consumir la API de SIGAD y SESA |
| `tailwindcss` & `@tailwindcss/vite` | ^4.1.18 | Framework de estilos responsivos |
| `lucide-react` | ^0.575.0 | Iconografía SVG uniforme |
| `recharts` | ^3.8.0 | Gráficos interactivos en el módulo de Métricas |
| `react-hot-toast` | ^2.6.0 | Notificaciones emergentes de acciones y errores |

> **Dev:** `vite` (^7.3.1), `@vitejs/plugin-react`, `eslint` (v9)

### Backend (Node.js / Express)

| Paquete | Versión | Propósito |
| :--- | :--- | :--- |
| `express` | ^5.2.1 | Framework principal de la API RESTful |
| `cors` | ^2.8.6 | Habilita comunicación cross-origin con el frontend |
| `helmet` | ^8.1.0 | Cabeceras HTTP de seguridad |
| `bcrypt` | ^6.0.0 | Hashing de contraseñas (one-way) |
| `jsonwebtoken` | ^9.0.3 | Generación y validación de tokens JWT |
| `express-validator` | ^7.3.1 | Validación y saneamiento de datos de entrada |
| `mariadb` | ^3.5.1 | Driver oficial — pool de conexiones y consultas async |
| `multer` | ^2.0.2 | Carga y gestión de archivos (multipart/form-data) |
| `pdfkit` | ^0.18.0 | Generación de reportes y horarios en PDF |
| `nodemailer` | ^8.0.2 | Envío automatizado de notificaciones por correo |
| `dotenv` | ^17.3.1 | Inyección de variables de entorno desde `.env` |

> **Dev:** `nodemon` (^3.1.14), `cross-env` (^10.1.0)

---

## ⚙️ Configuración e Instalación

### Prerrequisitos

Antes de clonar el repositorio, asegúrate de tener instalado:

- **Node.js** (versión LTS) y **Git**
- **MariaDB Server** `v11.4.10` — Windows x86_64
- **DBeaver Community Edition** — cliente de administración de BD
- **Tailscale** — instalado, activo y autenticado en la Tailnet del equipo

### Variables de Entorno

Crea los siguientes archivos antes de iniciar el proyecto:

**`Backend/.env`**
```env
# Configuración del servidor
PORT=
HOST=

# URL del frontend para permitir solicitudes CORS
FRONTEND_URL=

# Configuración de la base de datos
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=
DB_CONNECTION_LIMIT=

# Configuración de JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# Configuración de nodemailer
EMAIL_USER=
EMAIL_PASS=

# API SESA
EXTERNAL_API_URL
```

**`Frontend/.env`**
```env
VITE_API_URL=
```

### Instalación y Arranque

```bash
# 1. Clonar y sincronizar el repositorio
git clone https://github.com/diegop-dev/SIGAD.git
cd SIGAD
git fetch origin && git pull origin main

# 2. Iniciar el Backend (Terminal 1)
cd Backend
npm install
npm run dev

# 3. Iniciar el Frontend (Terminal 2 — nueva ventana)
cd Frontend
npm install
npm run dev
```

> ⚠️ El Frontend y el Backend deben ejecutarse en **terminales independientes**, ya que ambos comandos `npm run dev` mantienen el proceso activo escuchando cambios.

---

## 📁 Estructura del Proyecto

El repositorio se divide en dos directorios raíz independientes siguiendo el principio de **Separation of Concerns**, permitiendo que cada capa evolucione, se pruebe y se despliegue por separado.

### Backend — `Node.js + Express`

```
Backend/
├── src/
│   ├── config/         # Conexión a MariaDB y variables de entorno
│   ├── controllers/    # Manejo de peticiones HTTP y respuestas JSON
│   ├── middlewares/    # Autenticación JWT y manejo de errores
│   ├── models/         # Estructuras de datos y consultas SQL nativas
│   ├── routes/         # Definición de endpoints RESTful
│   ├── services/       # Lógica de negocio e integración con SESA
│   ├── validators/     # Reglas de validación (express-validator)
│   ├── workers/        # Procesos en segundo plano y tareas programadas
│   └── index.js        # Punto de entrada del servidor Express
├── uploads/
│   ├── docentes/       # Documentos del personal docente
│   └── profiles/       # Fotografías de perfil
├── .env
├── .gitignore
├── package-lock.json
└── package.json
```

### Frontend — `React + Vite`

```
Frontend/
├── src/
│   ├── assets/         # Imágenes, fuentes e iconos locales
│   ├── components/     # Componentes reutilizables (Botones, Tablas, Modales)
│   ├── context/        # Estado global con React Context (sesión de usuario)
│   ├── hooks/          # Custom hooks para lógicas de UI reutilizables
│   ├── pages/          # Vistas o pantallas completas de la aplicación
│   ├── services/       # Funciones HTTP (Axios) hacia la API de SIGAD
│   ├── utils/          # Funciones de utilidad global
│   ├── App.jsx         # Componente raíz y enrutamiento general
│   ├── index.css       # Estilos globales y configuración de Tailwind
│   └── main.jsx        # Punto de entrada — renderizado en el DOM
├── constants/          # Variables y configuraciones estáticas del cliente
├── public/             # Archivos estáticos (favicon, etc.)
├── .env
├── .gitignore
└── eslint.config.js
└── index.html
├── package-lock.json
└── package.json
├── vite.config.js
```

---

## 🗄️ Base de Datos

SIGAD utiliza **MariaDB v11.4.10** con motor **InnoDB**, asegurando integridad referencial y transaccional (ACID).

### Patrón Global: Auditoría y Borrado Lógico (Soft Delete)

La mayoría de las tablas implementan los campos estándar de trazabilidad:

| Campo | Tipo | Propósito |
| :--- | :--- | :--- |
| `estatus` | TINYINT | Estado activo/inactivo del registro |
| `creado_por` | INT (FK) | Usuario que creó el registro |
| `fecha_creacion` | DATETIME | Timestamp de creación |
| `modificado_por` | INT (FK) | Usuario que realizó la última modificación |
| `fecha_modificacion` | DATETIME | Timestamp de última modificación |
| `eliminado_por` | INT (FK) | Usuario que realizó el borrado lógico |
| `fecha_eliminacion` | DATETIME | Timestamp de eliminación lógica |

### Módulos y Tablas Principales

| Módulo | Tablas |
| :--- | :--- |
| **Seguridad y Accesos** | `usuarios`, `roles`, `audit_logs` |
| **Control de Personal** | `docentes`, `documentos_docentes` |
| **Gestión Académica** | `academias`, `carreras`, `cuatrimestres`, `periodos`, `materias`, `aulas`, `grupos` |
| **Transaccional (Core)** | `asignaciones` |
| **Sistema y Métricas** | `metricas_historicas`, `notificaciones`, `configuracion` |

> La tabla `asignaciones` es el núcleo del sistema: relaciona quién imparte, qué materia, en qué aula, con qué grupo y en qué horario, gestionando además el ciclo de vida del acta y la sincronización con SESA.

---

## 🔌 API y Endpoints

Toda comunicación externa transita por la **red privada Tailscale**, evitando exposición al internet público.

### Endpoints Internos — Core de SIGAD

Los endpoints internos soportan la operación completa de la SPA. Cuentan con validación estricta de CORS, protección de cabeceras con Helmet y payloads JSON (límite 1MB).

| Categoría | Prefijo `/api` | Descripción |
| :--- | :--- | :--- |
| Autenticación | `/auth`, `/users` | Login, JWT, recuperación de contraseña, ABCC de usuarios |
| Control de Personal | `/docentes` | Expedientes y estatus del personal académico |
| Gestión Académica | `/academias`, `/carreras`, `/periodos`, `/cuatrimestres`, `/materias`, `/aulas`, `/grupos` | Mantenimiento de catálogos educativos |
| Operación Transaccional | `/asignaciones`, `/horarios` | Cruce de horarios, validación de empalmes |
| Sistema y Monitoreo | `/metricas`, `/reportes`, `/notificaciones`, `/audit-logs`, `/configuracion`, `/external` | PDFs, indicadores, registro de auditoría |
| Diagnóstico | `/health` | Verificación pública del estado del servidor |

### Endpoints Expuestos — SESA consume de SIGAD (HU-37)

SIGAD actúa como **proveedor** de catálogos base para SESA. Todos son de solo lectura (`GET`) y se acceden vía vpn.

| ID | Endpoint | Descripción |
| :--- | :--- | :--- |
| EP-01 | `GET /api/periodos/activo` | Periodo escolar en curso |
| EP-02 | `GET /api/carreras/programas_academicos` | Oferta de carreras y programas |
| EP-03 | `GET /api/cuatrimestres/catalogo` | Bloques cuatrimestrales disponibles |
| EP-04 | `GET /api/materias/catalogo?...` | Materias filtradas por programa, cuatrimestre y tipo |
| EP-05 | `GET /api/grupos/catalogo?...` | Grupos activos por programa y cuatrimestre |
| EP-06 | `GET /api/asignaciones/catalogo?...` | Asignación exacta por grupo, materia y docente |
| EP-07 | `GET /api/docentes/catalogo` | Lista activa del personal docente |
| EP-08 | `GET /api/users/catalogo/{id_usuario}` | Datos generales de un usuario específico |
| EP-09 | `GET /api/aulas/catalogo` | Espacios físicos registrados |

### Endpoints Consumidos — SIGAD consume de SESA (HU-38 / HU-39)

SIGAD actúa como **cliente**, solicitando información de evaluación a SESA vía vpn. Todas soportan paginación con `?page={n}&page_size={n}`.

| ID | Endpoint en SESA | Historia | Propósito |
| :--- | :--- | :--- | :--- |
| API-01 | `GET /api/materias/recepcion` | HU-38 | Sincronización de catálogo de materias |
| API-02 | `GET /api/grupos/recepcion` | HU-38 | Sincronización del estado de grupos evaluados |
| API-03 | `GET /api/asignaciones/recepcion?materia_id=&grupo_id=` | HU-38 | Promedio consolidado por asignación |
| API-01 | `GET /api/asignaciones/recepcion?grupo_id=&periodo_id=` | HU-39 | Registro de incumplimientos de docentes externos |

---

## 🔄 Flujo General del Sistema

El acceso y navegación están regidos por **RBAC (Control de Acceso Basado en Roles)**.

### Vía Operativa — Superadministradores y Administradores (Roles 1 y 2)

1. **Dashboard** → Resumen general del periodo activo
2. **Gestión Académica** → Registro/actualización de Carreras, Materias, Grupos, Aulas y Periodos
3. **Control de Personal** → Mantenimiento de expedientes y disponibilidad docente
4. **Asignaciones (Core)** → Cruce entre carrera, grupo, materia, docente y aula con validación de empalmes
5. **Sincronización SESA** → Puente bidireccional: consumo de datos de evaluación y exposición de catálogos

### Vía de Consulta — Docentes (Rol 3)

Acceso restringido y enfocado en lectura de información personal:
- **Mis Asignaciones** → Materias y grupos asignados en el periodo activo
- **Mi Horario** → Vista de calendario con carga frente a grupo

### Vía de Auditoría — Superadministradores (Rol 1)

- **Métricas Institucionales** → Tableros de rendimiento histórico e índices de aprobación
- **Audit Logs** → Registro inmutable de quién, cuándo y desde qué IP modificó cada registro crítico

---

## 📐 Convenciones del Equipo

- **Control de versiones:** Conventional Commits (`feat:`, `fix:`, etc.)
- **Nomenclatura:** Funciones nuevas orientadas a SESA en español; funciones legacy existentes se mantienen en inglés
- **Entrega de código:** Archivos completos (no fragmentos), en orden: `model → controller → routes → validator`
- **Testing de endpoints:** Thunder Client + Tailscale VPN

---

<div align="center">
  <sub>© 2026 NexaByte — Universidad Interamericana para el Desarrollo (UNID Campus Campeche)</sub>
</div>