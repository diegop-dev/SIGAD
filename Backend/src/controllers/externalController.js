const pool = require('../config/database');

const getSincronizacionCatalogos = async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_KEY_EXTERNAL) {
        return res.status(401).json({ 
            success: false, 
            message: 'Acceso no autorizado: API Key faltante o inválida' 
        });
    }

    let conn;
    try {
    
        conn = await pool.getConnection();
        
        const [materias] = await conn.query('SELECT * FROM materias');
        const [grupos] = await conn.query('SELECT * FROM grupos');
        const [docentes] = await conn.query('SELECT * FROM docentes');

        res.json({
            success: true,
            timestamp: new Date(),
            data: {
                catalogos: {
                    materias: materias || [],
                    grupos: grupos || [],
                    docentes: docentes || []
                }
            }
        });
    } catch (error) {
        console.error("ERROR EN SQL:", error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Error en la base de datos', 
            detalle: error.message 
        });
    } finally {
        if (conn) conn.release();
    }
};

module.exports = { getSincronizacionCatalogos };