const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
require('dotenv').config();
require('./config/database'); // Inicializa el pool de MariaDB
const userRoutes = require('./routes/userRoutes'); // Rutas relacionadas con usuarios (registro, autenticación, etc.)
const authRoutes = require('./routes/authRoutes'); // Nueva importación para rutas de autenticación
const docentesRoutes = require('./routes/docentesRoutes'); // <--- 1. Importar las rutas de docentes
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y optimización de peticiones
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configuración estricta de CORS (Ajustaremos el puerto del Frontend según Vite o React)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', "PATCH", 'DELETE'],
  credentials: true
}));

// Parseo de payloads JSON con límite de tamaño para evitar ataques de denegación de servicio (DDoS)
app.use(express.json({ limit: '1mb' }));
app.use('/api/docentes', docentesRoutes); // <--- 2. Registrar el prefijo para las rutas de docentes
// Permite acceso público a las imágenes leyendo la ruta absoluta
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Registro de rutas del sistema
app.use('/api/users', userRoutes); // Rutas para usuarios (registro, gestión, etc.)
app.use('/api/auth', authRoutes); // Rutas para autenticación (login, logout, etc.)

// Ruta de comprobación de salud (Health check)
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
