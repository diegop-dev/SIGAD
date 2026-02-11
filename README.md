<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0066cc,100:00d9ff&height=280&section=header&text=SIGAD&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Sistema%20de%20Gesti%C3%B3n%20Acad%C3%A9mica%20y%20Docente%20&descSize=20&descAlignY=60" alt="SIGAD Header" width="100%" />

  <br>

  <img src="https://img.shields.io/badge/Status-En%20Desarrollo-yellow?style=for-the-badge&logo=fire" alt="Status" />
  <img src="https://img.shields.io/badge/Team-NexaByte-blue?style=for-the-badge&logo=microsoftteams" alt="Team" />
  <img src="https://img.shields.io/badge/Version-1.0.0-green?style=for-the-badge&logo=semver" alt="Version" />
</div>

---

## 📖 Descripción del Proyecto

**SIGAD** es una solución web que permite la asignación de materias y horarios en universidades, eliminando errores como cruces de horarios y sobrecarga de horas docentes. A diferencia de la gestión manual actual, nuestro sistema valida reglas académicas en tiempo real y se sincroniza con sistemas de seguimiento de calificaciones, centralizando la toma de decisiones basada en estadísticas de rendimiento y deserción.

El objetivo principal es optimizar la administración académica y garantizar la integridad de los datos mediante una arquitectura escalable y segura.

---

## 👥 Equipo: NexaByte

Este proyecto es desarrollado por estudiantes de la Licenciatura en Ingeniería de Software y Sistemas Computacionales de la UNID Campus Campeche.

* **Jorge Andrés Faisal Sulub (Líder)**
* **Diego Manuel Pérez Estrella (Arquitecto de Software)**
* **Andrés Oswaldo Heredia Torres (Desarrollador)**
* **José Alberto Castillo Vieyra (Desarrollador)**
* **Luis Felipe Quintero Cervera (Desarrollador)**
* **Melvin Yuriel Gutiérrez Martinez (Tester)**
* **Abraham Kantun Cauich (Tester)**

---

## 🛠️ Stack Tecnológico Preliminar

La arquitectura del proyecto está basada en un enfoque **Full-Stack JavaScript** para unificar el desarrollo, utilizando una arquitectura desacoplada (Frontend y Backend separados) comunicada vía API RESTful.

### Frontend (Interfaz de Usuario)
| Tecnología | Propósito | Justificación Breve |
| :--- | :--- | :--- |
| ![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB) | **React.js** | Construcción de SPA (Single Page Application) responsiva y basada en componentes. |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | **Vite** | Bundler de última generación para recarga en caliente y optimización de build. |

### Backend (API & Lógica de Negocio)
| Tecnología | Propósito | Justificación Breve |
| :--- | :--- | :--- |
| ![NodeJS](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white) | **Node.js** | Entorno de ejecución asíncrono y orientado a eventos. |
| ![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white) | **Express.js** | Framework minimalista para la creación de la API RESTful. |
| ![JSON](https://img.shields.io/badge/JSON-000000?style=flat&logo=json&logoColor=white) | **JSON** | Formato estándar de intercambio de datos ligero. |

### Base de Datos
| Tecnología | Propósito | Justificación Breve |
| :--- | :--- | :--- |
| ![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=flat&logo=mariadb&logoColor=white) | **MariaDB** | RDBMS Open Source que garantiza integridad ACID y alto rendimiento. |
| ![MySQL Workbench](https://img.shields.io/badge/MySQL_Workbench-4479A1?style=flat&logo=mysql&logoColor=white) | **MySQL Workbench** | Herramienta GUI para modelado y administración de la BD. |

### Infraestructura y Herramientas
| Categoría | Herramientas |
| :--- | :--- |
| **Control de Versiones** | **Git** y **GitHub** para CI/CD y gestión de código. |
| **Despliegue (PaaS)** | **Railway** para infraestructura cloud bajo demanda. |
| **Diseño y Prototipado** | **Miro** (Wireframes) y **Draw.io** (Diagramas UML/Arquitectura). |
| **IDE** | **Visual Studio Code**. |

---

## 🏗️ Arquitectura del Sistema

El sistema utiliza una arquitectura cliente-servidor donde:
1.  **Frontend:** Consume datos mediante peticiones HTTP (Axios/Fetch).
2.  **Backend:** Procesa la lógica de negocio y protege la base de datos en una red privada.
3.  **Producción:** Desplegado en Railway con servicios desacoplados para escalabilidad vertical.

---

<div align="center">
  © 2026 NexaByte - Universidad Interamericana para el Desarrollo
</div>
