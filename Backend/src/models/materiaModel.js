const pool = require("../config/database");

const materiaModel = {

getAllMaterias: async () => {

let conn;

try {

conn = await pool.getConnection();

const rows = await conn.query(`

SELECT

m.*,

c.nombre AS cuatrimestre,

p.codigo,

car.nombre_carrera

FROM Materias m

LEFT JOIN Cuatrimestres c ON m.cuatrimestre_id = c.id_cuatrimestre

LEFT JOIN Periodos p ON m.periodo_id = p.id_periodo

LEFT JOIN Carreras car ON m.carrera_id = car.id_carrera

WHERE m.estatus = 'ACTIVO'

ORDER BY m.id_materia DESC

`);

return rows;

} finally {

if (conn) conn.release();

}

},

createMateria: async (data) => {

let conn;

try {

conn = await pool.getConnection();

await conn.beginTransaction();


// obtener clave carrera
const carrera = await conn.query(
`SELECT codigo_unico FROM Carreras WHERE id_carrera = ? LIMIT 1`,
[data.carrera_id]
);

if (!carrera.length) {
throw new Error("Carrera inválida");
}

const clave = carrera[0].codigo_unico
.toString()
.substring(0,3)
.toUpperCase();


// contar materias de esa carrera
const count = await conn.query(
`SELECT COUNT(*) AS total FROM Materias WHERE carrera_id = ?`,
[data.carrera_id]
);


// SOLUCIÓN DEFINITIVA BIGINT
const total = Number(count[0].total);

const next = total + 1;

const codigo_unico = `MAT-${clave}-${String(next).padStart(3,"0")}`;


// insertar materia
const result = await conn.query(
`INSERT INTO Materias
(codigo_unico,periodo_id,cuatrimestre_id,nombre,creditos,cupo_maximo,tipo_asignatura,carrera_id,creado_por)
VALUES (?,?,?,?,?,?,?,?,?)`,
[
codigo_unico,
data.periodo_id,
data.cuatrimestre_id,
data.nombre,
data.creditos,
data.cupo_maximo,
data.tipo_asignatura,
data.carrera_id,
data.creado_por
]
);

await conn.commit();

return {
id: result.insertId,
codigo_unico
};

} catch (error) {

if (conn) await conn.rollback();
throw error;

} finally {

if (conn) conn.release();

}

},

updateMateria: async (id,data) => {

let conn;

try {

conn = await pool.getConnection();

await conn.query(`

UPDATE Materias

SET

nombre=?,

creditos=?,

cupo_maximo=?,

tipo_asignatura=?,

periodo_id=?,

cuatrimestre_id=?,

carrera_id=?,

modificado_por=?

WHERE id_materia=?

`,[

data.nombre,

data.creditos,

data.cupo_maximo,

data.tipo_asignatura,

data.periodo_id,

data.cuatrimestre_id,

data.carrera_id,

data.modificado_por,

id

]);

} finally {

if (conn) conn.release();

}

},

checkMateriaUsage: async (id) => {

let conn;

try{

conn = await pool.getConnection();

const rows = await conn.query(
`SELECT COUNT(*) AS total 
FROM Asignaciones 
WHERE materia_id = ?`,
[id]
);

return Number(rows[0].total);

} finally {

if(conn) conn.release();

}

},

deleteMateriaFisica: async (id) => {

let conn;

try{

conn = await pool.getConnection();

await conn.query(
`DELETE FROM Materias WHERE id_materia = ?`,
[id]
);

} finally {

if(conn) conn.release();

}

},

toggleMateriaStatus: async (id,usuario)=>{

let conn;

try{

conn = await pool.getConnection();

await conn.query(

`UPDATE Materias
SET
estatus = IF(estatus='ACTIVO','INACTIVO','ACTIVO'),
eliminado_por = ?,
fecha_eliminacion = NOW()
WHERE id_materia = ?`,

[usuario,id]

);

} finally {

if(conn) conn.release();

}

}


};

module.exports = materiaModel;