const mariadb = require('mariadb');
require('dotenv').config();

// Instanciación del pool de conexiones optimizado
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10),
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10),
  idleTimeout: 60, // Cierra conexiones inactivas después de 60 segundos
  acquireTimeout: 10000, // Tiempo máximo de espera para obtener una conexión
  insertIdAsNumber: true // <--- Esta línea resuelve el error de serialización JSON
});

// Función para probar la conectividad inicial
const testConnection = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    console.log(`[Base de datos] Conexión establecida con MariaDB en el puerto ${process.env.DB_PORT}`);
  } catch (error) {
    console.error('[Base de datos] Error crítico en la conexión:', error.message);
    process.exit(1); // Detiene el servidor si la base de datos no está disponible
  } finally {
    if (conn) conn.release(); // Obligatorio: devolver la conexión al pool
  }
};

// Ejecutar la prueba al iniciar el módulo
testConnection();

module.exports = pool;
