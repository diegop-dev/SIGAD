const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();
require('./config/database'); // Inicializa el pool de MariaDB

// Importación de rutas existentes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const docentesRoutes = require('./routes/docentesRoutes');
const academiaRoutes = require('./routes/academiaRoutes');
const academiaRoutes = require('./routes/academiaRoutes');
const materiaRoutes = require('./routes/materiaRoutes');
const carreraRoutes = require("./routes/carreraRoutes");
const cuatrimestresRoutes = require("./routes/cuatrimestresRoutes");
const periodoRoutes = require("./routes/periodoRoutes");
const aulasRoutes = require('./routes/aulasRoutes');
const grupoRoutes = require('./routes/grupoRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const metricasRoutes = require('./routes/metricasRoutes');
const horarioRoutes  = require('./routes/horarioRoutes');
const auditRoutes = require('./routes/auditRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
// --- NUEVA RUTA PARA HU-37 ---
const externalRoutes = require('./routes/externalRoutes');

// Inicialización de tablas auto-gestionadas
const { initAuditTable } = require('./models/auditModel');
const { initConfigTable } = require('./models/configuracionModel');
initAuditTable();
initConfigTable();
const externalRoutes = require('./routes/externalRoutes');

// Inicialización de tablas auto-gestionadas
const { initAuditTable } = require('./models/auditModel');
const { initConfigTable } = require('./models/configuracionModel');
initAuditTable();
initConfigTable();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y optimización de peticiones
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuración estricta de CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', "PATCH", 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Registro de rutas con sus prefijos
app.use('/api/docentes', docentesRoutes); 
app.use('/api/academias', academiaRoutes);
app.use('/api/materias', materiaRoutes);
app.use("/api/carreras", carreraRoutes);
app.use("/api/periodos", periodoRoutes);
app.use("/api/cuatrimestres", cuatrimestresRoutes);
app.use('/api/aulas', aulasRoutes);
app.use('/api/grupos', grupoRoutes);
app.use('/api/asignaciones', assignmentRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/metricas', metricasRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/reportes', reporteRoutes);
// Permite acceso público a las imágenes
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Registro de rutas del sistema
app.use('/api/users', userRoutes); 
app.use('/api/auth', authRoutes); 

// Ruta de comprobación de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Servidor SIGAD en línea y protegido' 
  });
});

// Inicialización del servidor
app.listen(PORT, () => {
  console.log(`[Servidor] Ejecutándose de forma segura en el puerto ${PORT}`);
});