const pool = require("../config/database");

const carreraModel = {
  // ==========================================
  // CONSULTAS DE LECTURA
  // ==========================================

  getAcademiasActivas: async () => {
    let conn;
    try {
      conn = await pool.getConnection();
      // Consultamos directamente la tabla academias
      const rows = await conn.query(
        `SELECT id_academia, nombre 
         FROM academias 
         WHERE estatus = 'ACTIVO'`
      );
      return rows;
    } finally {
      if (conn) conn.release();
    }
  },

  // Validar si ya existe una carrera con el mismo nombre exacto
  findExistingCarrera: async (nombre_carrera) => {
    let conn;
    try {
      conn = await pool.getConnection();
      const rows = await conn.query(
        `SELECT id_carrera, nombre_carrera 
         FROM Carreras 
         WHERE nombre_carrera = ? LIMIT 1`,
        [nombre_carrera]
      );
      return rows[0]; // Retorna el registro si existe, o undefined si no
    } finally {
      if (conn) conn.release();
    }
  },

  // ==========================================
  // CONSULTAS DE ESCRITURA (CREACIÓN)
  // ==========================================

  crearCarrera: async (datosCarrera) => {
    // Extraemos solo los datos necesarios para la creación
    const { nombre_carrera, academia_id, creado_por } = datosCarrera;
    let conn;
    
    try {
      conn = await pool.getConnection();
      
      // Insertamos los datos y usamos NOW() para que la base de datos 
      // registre automáticamente la fecha y hora exactas.
      const result = await conn.query(
        `INSERT INTO Carreras (nombre_carrera, academia_id, creado_por, fecha_creacion)
         VALUES (?, ?, ?, NOW())`,
        [nombre_carrera, academia_id, creado_por]
      );
      
      return result; 
    } finally {
      if (conn) conn.release();
    }
  }
};

module.exports = carreraModel;