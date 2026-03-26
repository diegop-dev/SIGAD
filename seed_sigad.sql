-- ============================================================
-- SIGAD – SCRIPT DE DATOS DE PRUEBA (SEED)
-- Motor: MariaDB | Codificación: utf8mb4
-- ============================================================
-- Contraseña para todos los usuarios: Sigad@2024
--
-- ⚠  PASO PREVIO – genera el hash ejecutando desde Backend/:
--    node -e "const b=require('bcrypt'); b.hash('Sigad@2024',10).then(h=>console.log(h));"
--    Copia el resultado y reemplaza el valor de @pwd abajo.
-- ============================================================

USE sigad_db;

-- ► REEMPLAZA este valor con el hash que generó el comando anterior:
SET @pwd = '$2b$10$SG50NMA8Zj7M6ipAEv7kr.HjG5B61OxuFijpQEbKLb743MxE3yLWu';

-- ============================================================
-- 1. USUARIOS
--    id 1 = Superadmin | 2-3 = Administrador | 4-8 = Docente
-- ============================================================
INSERT INTO Usuarios
  (nombres, apellido_paterno, apellido_materno,
   personal_email, institutional_email,
   password_hash, es_password_temporal, rol_id, estatus, creado_por)
VALUES
  -- Superadmin (no requiere cambio de contraseña)
  ('Luis Fernando', 'González', 'Reyes',
   'luisfernando.gonzalez@gmail.com', 'lgonzalez@sigad.edu.mx',
   @pwd, 0, 1, 'ACTIVO', NULL),

  -- Administradores
  ('Diana Sofía', 'Martínez', 'Ruiz',
   'diana.martinez@yahoo.com', 'dmartinez@sigad.edu.mx',
   @pwd, 0, 2, 'ACTIVO', 1),

  ('Adrián', 'Torres', 'Peña',
   'adrian.torres@gmail.com', 'atorres@sigad.edu.mx',
   @pwd, 0, 2, 'ACTIVO', 1),

  -- Docentes (es_password_temporal=1 → deben cambiar contraseña al iniciar sesión)
  ('Carlos Alberto', 'García', 'López',
   'carlos.garcia.lopez@hotmail.com', 'cgarcia@sigad.edu.mx',
   @pwd, 1, 3, 'ACTIVO', 2),

  ('Ana Patricia', 'Ramírez', 'Flores',
   'ana.ramirez.flores@gmail.com', 'aramirez@sigad.edu.mx',
   @pwd, 1, 3, 'ACTIVO', 2),

  ('Luis Miguel', 'Pérez', 'Sánchez',
   'luismiguel.perez@outlook.com', 'lperez@sigad.edu.mx',
   @pwd, 1, 3, 'ACTIVO', 2),

  ('María Guadalupe', 'Rodríguez', 'García',
   'mariag.rodriguez@gmail.com', 'mrodriguez@sigad.edu.mx',
   @pwd, 1, 3, 'ACTIVO', 2),

  ('Roberto', 'Torres', 'Morales',
   'roberto.torres.morales@yahoo.com', 'rtorres@sigad.edu.mx',
   @pwd, 1, 3, 'ACTIVO', 2);


-- ============================================================
-- 2. ACADEMIAS
--    Coordinadas por los admins (usuarios 2 y 3)
-- ============================================================
INSERT INTO Academias (nombre, descripcion, usuario_id, estatus, creado_por)
VALUES
  ('Tecnologías de la Información',
   'Agrupa las carreras de ingeniería en sistemas, redes y afines.',
   2, 'ACTIVO', 1),

  ('Ciencias Económico-Administrativas',
   'Agrupa administración, contaduría y negocios.',
   3, 'ACTIVO', 1);


-- ============================================================
-- 3. CARRERAS
--    academia 1 = TI | academia 2 = CEA
-- ============================================================
INSERT INTO Carreras
  (codigo_unico, nombre_carrera, modalidad, academia_id, estatus, creado_por)
VALUES
  ('ISC-ESC',  'Ingeniería en Sistemas Computacionales', 'Escolarizada', 1, 'ACTIVO', 1),
  ('IIND-ESC', 'Ingeniería Industrial',                  'Escolarizada', 1, 'ACTIVO', 1),
  ('ADE-ESC',  'Administración de Empresas',             'Escolarizada', 2, 'ACTIVO', 1),
  ('CTD-ESC',  'Contaduría',                             'Escolarizada', 2, 'ACTIVO', 1);


-- ============================================================
-- 4. PERIODOS
--    Las fechas siguen la regla: fin = inicio + 84 días,
--    limite_calif = fin − 15 días
-- ============================================================
INSERT INTO Periodos
  (codigo, anio, fecha_inicio, fecha_fin, fecha_limite_calif, estatus, creado_por)
VALUES
  ('2024-ENERO-ABRIL', 2024, '2024-01-15', '2024-04-08', '2024-03-24', 'ACTIVO', 1),
  ('2024-MAYO-AGOSTO', 2024, '2024-05-06', '2024-07-29', '2024-07-14', 'ACTIVO', 1),
  -- Periodo activo (aquí estarán las asignaciones)
  ('2026-ENERO-ABRIL', 2026, '2026-01-12', '2026-04-06', '2026-03-22', 'ACTIVO', 1);


-- ============================================================
-- 5. MATERIAS  (periodo_id=3 → 2026-ENERO-ABRIL)
--    tipo_asignatura: TRONCO_COMUN | OBLIGATORIA | OPTATIVA
--    cupo_maximo: 1-200  |  creditos: 1-30
-- ============================================================
INSERT INTO Materias
  (codigo_unico, periodo_id, cuatrimestre_id, nombre,
   creditos, cupo_maximo, tipo_asignatura, carrera_id, estatus, creado_por)
VALUES
  -- ISC – Primer cuatrimestre
  ('FP-ISC-01',  3, 1, 'Fundamentos de Programación',      8, 35, 'OBLIGATORIA',  1, 'ACTIVO', 1),
  ('MD-ISC-01',  3, 1, 'Matemáticas Discretas',            6, 35, 'TRONCO_COMUN', 1, 'ACTIVO', 1),
  ('CD-ISC-01',  3, 1, 'Cálculo Diferencial',              6, 35, 'TRONCO_COMUN', 1, 'ACTIVO', 1),

  -- ISC – Segundo cuatrimestre
  ('POO-ISC-02', 3, 2, 'Programación Orientada a Objetos', 8, 30, 'OBLIGATORIA',  1, 'ACTIVO', 1),
  ('ED-ISC-02',  3, 2, 'Estructura de Datos',              8, 30, 'OBLIGATORIA',  1, 'ACTIVO', 1),

  -- ADE – Primer cuatrimestre
  ('FAD-ADE-01', 3, 1, 'Fundamentos de Administración',    6, 40, 'OBLIGATORIA',  3, 'ACTIVO', 1),
  ('EG-ADE-01',  3, 1, 'Economía General',                 6, 40, 'TRONCO_COMUN', 3, 'ACTIVO', 1),
  ('CB-ADE-01',  3, 1, 'Contabilidad Básica',              8, 40, 'OBLIGATORIA',  3, 'ACTIVO', 1);


-- ============================================================
-- 6. GRUPOS
-- ============================================================
INSERT INTO Grupos (identificador, carrera_id, cuatrimestre_id, estatus, creado_por)
VALUES
  ('1A', 1, 1, 'ACTIVO', 1),   -- ISC 1er cuatri, grupo A  → id 1
  ('1B', 1, 1, 'ACTIVO', 1),   -- ISC 1er cuatri, grupo B  → id 2
  ('2A', 1, 2, 'ACTIVO', 1),   -- ISC 2do cuatri, grupo A  → id 3
  ('1A', 3, 1, 'ACTIVO', 1),   -- ADE 1er cuatri, grupo A  → id 4
  ('1B', 3, 1, 'ACTIVO', 1);   -- ADE 1er cuatri, grupo B  → id 5


-- ============================================================
-- 7. AULAS
--    tipo: AULA | LABORATORIO  |  capacidad: 1-200
-- ============================================================
INSERT INTO Aulas (nombre_codigo, capacidad, tipo, ubicacion, recursos, estatus)
VALUES
  ('AULA-101',   40, 'AULA',        'Edificio A – Planta Baja', 'Proyector, pizarrón blanco',           'ACTIVO'),
  ('AULA-102',   35, 'AULA',        'Edificio A – Planta Baja', 'Proyector, pizarrón blanco',           'ACTIVO'),
  ('AULA-201',   40, 'AULA',        'Edificio A – Primer Piso', 'Proyector, pizarrón, aire acondicionado', 'ACTIVO'),
  ('LAB-COMP-1', 25, 'LABORATORIO', 'Edificio B – Planta Baja', 'PCs i7, proyector, switch 24p',        'ACTIVO'),
  ('LAB-COMP-2', 25, 'LABORATORIO', 'Edificio B – Planta Baja', 'PCs i5, proyector, servidor Linux',    'ACTIVO');


-- ============================================================
-- 8. DOCENTES
--
-- RFC  → regex /^([A-ZÑ&]{4})\d{6}([A-Z0-9]{3})$/  (13 chars)
--   Estructura: [raíz 4c][AAMMDD][homoclave 3c]
--   Raíz = 1ªLetra(apPat) + 1ªVocalInterna(apPat)
--          + 1ªLetra(apMat) + 1ªLetra(nombre)
--          [si nombre es JOSE/MARIA/MA/J → usar 2do nombre]
--
-- CURP → regex /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/  (18 chars)
--   Estructura: [raíz 4c][AAMMDD][H/M][estado 2c]
--               [1ªConsInterna(apPat)][1ªConsInterna(apMat)]
--               [1ªConsInterna(nombre)][homoclave 1c][verificador 1d]
--
-- Verificación raíz vs nombres:
--   Carlos Alberto García López  → GALC (G+A+L+C)
--   Ana Patricia Ramírez Flores  → RAFA (R+A+F+A)
--   Luis Miguel Pérez Sánchez   → PESL (P+E+S+L)
--   María Guadalupe Rodríguez García → ROGG (R+O+G+G; MARIA omitida)
--   Roberto Torres Morales      → TOMR (T+O+M+R)
-- ============================================================
INSERT INTO Docentes
  (usuario_id, matricula_empleado, rfc, curp, clave_ine,
   domicilio, celular, nivel_academico, antiguedad_fecha,
   academia_id, estatus, creado_por)
VALUES
  -- 1. Carlos Alberto García López  ♂ 15-Mar-1975  Estado de México
  (4, '00000001',
   'GALC750315MA1',
   -- G(gaRcia) A(gArcía 1ªVocal) L(López) C(Carlos) | H | MC | R(gaRcia) P(loPez) R(caRlos)
   'GALC750315HMCRPRL4',
   'MCGAL75031506H700',
   'Calle Reforma 45, Col. Centro, Toluca, Estado de México, C.P. 50000',
   '7221234567', 'Maestría', '2015-08-01', 1, 'ACTIVO', 2),

  -- 2. Ana Patricia Ramírez Flores  ♀ 05-Nov-1982  Guanajuato
  (5, '00000002',
   'RAFA821105MJ0',
   -- R(Ramírez) A(rAmirez 1ªVocal) F(Flores) A(Ana) | M | GT | M(raMirez) L(fLores) N(aNa)
   'RAFA821105MGTMLNA0',
   'GTRAA82110509M600',
   'Av. Juárez 120, Col. Guadalupe, León, Guanajuato, C.P. 37000',
   '4771234567', 'Doctorado', '2010-02-01', 1, 'ACTIVO', 2),

  -- 3. Luis Miguel Pérez Sánchez  ♂ 18-Abr-1988  CDMX
  (6, '00000003',
   'PESL880418SV9',
   -- P(Pérez) E(pErez 1ªVocal) S(Sánchez) L(Luis) | H | DF | R(pErez) N(saNchez) S(luiS)
   'PESL880418HDFRNSC7',
   'DFPES88041816H500',
   'Insurgentes Sur 890, Col. Del Valle, Ciudad de México, C.P. 03100',
   '5551234567', 'Maestría', '2018-09-01', 1, 'ACTIVO', 2),

  -- 4. María Guadalupe Rodríguez García  ♀ 22-Ago-1979  Veracruz
  (7, '00000004',
   'ROGG790822PX4',
   -- R(Rodríguez) O(rOdriguez 1ªVocal) G(García) G(Guadalupe; MARIA omitida)
   -- | M | VZ | D(roDriguez) R(gaRcia) D(guaDalupe)
   'ROGG790822MVZDRDA8',
   'VZROG79082221M400',
   'Calle 5 de Mayo 33, Col. Centro, Xalapa, Veracruz, C.P. 91000',
   '2281234567', 'Maestría', '2012-01-15', 2, 'ACTIVO', 2),

  -- 5. Roberto Torres Morales  ♂ 03-Dic-1991  Nuevo León
  (8, '00000005',
   'TOMR911203GN8',
   -- T(Torres) O(tOrres 1ªVocal) M(Morales) R(Roberto) | H | NL | R(toRres) R(moRales) B(roBerto)
   'TOMR911203HNLRRBA5',
   'NLTOR91120306H100',
   'Av. Constitución 780, Col. Centro, Monterrey, Nuevo León, C.P. 64000',
   '8121234567', 'Licenciatura', '2020-08-15', 2, 'ACTIVO', 2);


-- ============================================================
-- 9. DOCUMENTOS DOCENTES  (6 por docente = 30 registros)
--    Tipos requeridos: TITULO, CEDULA, CONSTANCIA_FISCAL,
--                      INE, COMPROBANTE_DOMICILIO, CV
-- ============================================================
INSERT INTO Documentos_Docentes (docente_id, tipo_documento, url_archivo, creado_por)
VALUES
  (1,'TITULO',               '/uploads/docentes/1/titulo.pdf',                2),
  (1,'CEDULA',               '/uploads/docentes/1/cedula.pdf',                2),
  (1,'CONSTANCIA_FISCAL',    '/uploads/docentes/1/constancia_fiscal.pdf',     2),
  (1,'INE',                  '/uploads/docentes/1/ine.pdf',                   2),
  (1,'COMPROBANTE_DOMICILIO','/uploads/docentes/1/comprobante_domicilio.pdf', 2),
  (1,'CV',                   '/uploads/docentes/1/cv.pdf',                    2),

  (2,'TITULO',               '/uploads/docentes/2/titulo.pdf',                2),
  (2,'CEDULA',               '/uploads/docentes/2/cedula.pdf',                2),
  (2,'CONSTANCIA_FISCAL',    '/uploads/docentes/2/constancia_fiscal.pdf',     2),
  (2,'INE',                  '/uploads/docentes/2/ine.pdf',                   2),
  (2,'COMPROBANTE_DOMICILIO','/uploads/docentes/2/comprobante_domicilio.pdf', 2),
  (2,'CV',                   '/uploads/docentes/2/cv.pdf',                    2),

  (3,'TITULO',               '/uploads/docentes/3/titulo.pdf',                2),
  (3,'CEDULA',               '/uploads/docentes/3/cedula.pdf',                2),
  (3,'CONSTANCIA_FISCAL',    '/uploads/docentes/3/constancia_fiscal.pdf',     2),
  (3,'INE',                  '/uploads/docentes/3/ine.pdf',                   2),
  (3,'COMPROBANTE_DOMICILIO','/uploads/docentes/3/comprobante_domicilio.pdf', 2),
  (3,'CV',                   '/uploads/docentes/3/cv.pdf',                    2),

  (4,'TITULO',               '/uploads/docentes/4/titulo.pdf',                2),
  (4,'CEDULA',               '/uploads/docentes/4/cedula.pdf',                2),
  (4,'CONSTANCIA_FISCAL',    '/uploads/docentes/4/constancia_fiscal.pdf',     2),
  (4,'INE',                  '/uploads/docentes/4/ine.pdf',                   2),
  (4,'COMPROBANTE_DOMICILIO','/uploads/docentes/4/comprobante_domicilio.pdf', 2),
  (4,'CV',                   '/uploads/docentes/4/cv.pdf',                    2),

  (5,'TITULO',               '/uploads/docentes/5/titulo.pdf',                2),
  (5,'CEDULA',               '/uploads/docentes/5/cedula.pdf',                2),
  (5,'CONSTANCIA_FISCAL',    '/uploads/docentes/5/constancia_fiscal.pdf',     2),
  (5,'INE',                  '/uploads/docentes/5/ine.pdf',                   2),
  (5,'COMPROBANTE_DOMICILIO','/uploads/docentes/5/comprobante_domicilio.pdf', 2),
  (5,'CV',                   '/uploads/docentes/5/cv.pdf',                    2);


-- ============================================================
-- 10. ASIGNACIONES  (periodo_id=3 → 2026-ENERO-ABRIL)
--
--  Reglas verificadas:
--  ✓ Sin empalme de AULA   (mismo aula+dia+franja horaria)
--  ✓ Sin empalme de DOCENTE (mismo docente+dia+franja)
--  ✓ Sin empalme de GRUPO   (mismo grupo+dia+franja)
--  dia_semana: 1=Lun 2=Mar 3=Mié 4=Jue 5=Vie
--
--  Mapa de IDs usados:
--    Grupos  : 1=ISC-1A  2=ISC-1B  3=ISC-2A  4=ADE-1A
--    Materias: 1=FundProg 2=MatDisc 3=CalcDif 4=POO 5=EstrDatos
--              6=FundAdmin 7=EconGral 8=ContBas
--    Docentes: 1=Carlos  2=Ana  3=Luis  4=María  5=Roberto
--    Aulas   : 1=AULA-101  2=AULA-102  3=AULA-201
--              4=LAB-COMP-1  5=LAB-COMP-2
-- ============================================================
INSERT INTO Asignaciones
  (grupo_id, materia_id, docente_id, periodo_id, aula_id,
   dia_semana, hora_inicio, hora_fin,
   estatus_confirmacion, estatus_acta, creado_por)
VALUES
  -- Docente 1 – Carlos García
  (1, 1, 1, 3, 1,  1, '08:00:00','10:00:00', 'ACEPTADA','ABIERTA', 1),  -- ISC-1A FundProg Lun AULA-101
  (2, 1, 1, 3, 2,  2, '10:00:00','12:00:00', 'ACEPTADA','ABIERTA', 1),  -- ISC-1B FundProg Mar AULA-102

  -- Docente 2 – Ana Ramírez
  (1, 2, 2, 3, 2,  1, '10:00:00','12:00:00', 'ACEPTADA','ABIERTA', 1),  -- ISC-1A MatDisc  Lun AULA-102

  -- Docente 3 – Luis Pérez
  (1, 3, 3, 3, 1,  2, '08:00:00','10:00:00', 'ENVIADA', 'ABIERTA', 1),  -- ISC-1A CalcDif  Mar AULA-101
  (3, 4, 3, 3, 5,  3, '08:00:00','10:00:00', 'ENVIADA', 'ABIERTA', 1),  -- ISC-2A POO      Mié LAB-COMP-2

  -- Docente 4 – María Rodríguez
  (4, 6, 4, 3, 3,  1, '08:00:00','10:00:00', 'ACEPTADA','ABIERTA', 1),  -- ADE-1A FundAdm  Lun AULA-201
  (4, 8, 4, 3, 4,  3, '08:00:00','10:00:00', 'ACEPTADA','ABIERTA', 1),  -- ADE-1A ContBas  Mié LAB-COMP-1

  -- Docente 5 – Roberto Torres
  (4, 7, 5, 3, 3,  2, '08:00:00','10:00:00', 'ENVIADA', 'ABIERTA', 1),  -- ADE-1A EconGral Mar AULA-201
  (3, 5, 5, 3, 4,  4, '10:00:00','12:00:00', 'ENVIADA', 'ABIERTA', 1);  -- ISC-2A EstrDat  Jue LAB-COMP-1


-- ============================================================
-- 11. MÉTRICAS HISTÓRICAS  (periodos 1 y 2)
-- ============================================================
INSERT INTO Metricas_Historicas
  (periodo_id, carrera_id, total_inscritos, total_egresados, promedio_general, creado_por)
VALUES
  (1, 1,  45, 38, 8.20, 1),  -- 2024-ENE-ABR  ISC
  (1, 3,  50, 42, 8.50, 1),  -- 2024-ENE-ABR  ADE
  (2, 1,  42, 35, 8.00, 1),  -- 2024-MAY-AGO  ISC
  (2, 3,  48, 40, 8.30, 1);  -- 2024-MAY-AGO  ADE


-- ============================================================
-- 12. NOTIFICACIONES
-- ============================================================
INSERT INTO notificaciones (usuario_id, mensaje, severidad, leida)
VALUES
  (4, 'Tienes una nueva asignación pendiente de aceptar para el periodo 2026-ENERO-ABRIL.',      'ALTA',  0),
  (5, 'Tienes una nueva asignación pendiente de aceptar para el periodo 2026-ENERO-ABRIL.',      'ALTA',  0),
  (6, 'Se te han asignado 2 materias. Revisa tu horario y acepta el contrato.',                  'ALTA',  0),
  (8, 'Se te han asignado 2 materias para el periodo 2026-ENERO-ABRIL. Por favor confírmalas.', 'ALTA',  0),
  (2, 'El periodo 2026-ENERO-ABRIL fue creado exitosamente con 9 asignaciones.',                 'BAJA',  1),
  (1, 'Se registraron 5 docentes nuevos en el sistema.',                                         'MEDIA', 1);
