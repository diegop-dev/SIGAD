const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();
require('./config/database'); // Inicializa el pool de MariaDB
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const docentesRoutes = require('./routes/docentesRoutes');
const academiaRoutes = require('./routes/academiaRoutes'); 
const materiaRoutes = require('./routes/materiaRoutes');
const carreraRoutes = require("./routes/carreraRoutes");
const cuatrimestresRoutes = require("./routes/cuatrimestresRoutes");
const periodoRoutes = require("./routes/periodoRoutes");
const grupoRoutes = require('./routes/grupoRoutes');

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
app.use('/api/grupos', grupoRoutes);

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
