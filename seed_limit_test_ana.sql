-- ============================================================
-- SIGAD – LIMIT TESTING: SATURACIÓN DE HORARIO
-- Docente: Ana Patricia Ramírez Flores (docente_id=2)
-- Periodo: 2026-ENERO-ABRIL (periodo_id=3)
-- ============================================================
--
-- ASIGNACIÓN PREEXISTENTE (del seed inicial):
--   ✓  Lun 10:00-12:00  Matemáticas Discretas  ISC-1A  AULA-102
--
-- ESTE SCRIPT AGREGA:
--   6 asignaciones válidas (sin conflicto) para saturar la semana
--   5 asignaciones con conflicto intencional para probar el módulo
--
-- MAPA DE IDs (del seed base):
--   Grupos  : 1=ISC-1A  2=ISC-1B  3=ISC-2A  4=ADE-1A
--   Materias: 1-8 (ver seed base)
--   Docente : 2=Ana Ramírez
--   Aulas   : 1=AULA-101  2=AULA-102  3=AULA-201
--             4=LAB-COMP-1  5=LAB-COMP-2
-- ============================================================

USE sigad_db;

-- ============================================================
-- PASO 1: MATERIAS ADICIONALES
--   Necesarias para poder crear nuevas asignaciones.
--   Se insertan en el periodo activo (periodo_id=3, ISC).
-- ============================================================
INSERT INTO Materias
  (codigo_unico, periodo_id, cuatrimestre_id, nombre,
   creditos, cupo_maximo, tipo_asignatura, carrera_id, estatus, creado_por)
VALUES
  ('AL-ISC-01', 3, 1, 'Álgebra Lineal',               6, 35, 'TRONCO_COMUN', 1, 'ACTIVO', 1),  -- id=9
  ('CI-ISC-01', 3, 1, 'Cálculo Integral',              6, 35, 'TRONCO_COMUN', 1, 'ACTIVO', 1),  -- id=10
  ('PE-ISC-02', 3, 2, 'Probabilidad y Estadística',    6, 30, 'OBLIGATORIA',  1, 'ACTIVO', 1);  -- id=11


-- ============================================================
-- PASO 2: GRUPO ADICIONAL (para tener contenedor distinto)
-- ============================================================
INSERT INTO Grupos (identificador, carrera_id, cuatrimestre_id, estatus, creado_por)
VALUES ('1C', 1, 1, 'ACTIVO', 1);  -- id=6  → ISC-1C


-- ============================================================
-- PASO 3: ASIGNACIONES VÁLIDAS (sin ningún empalme)
--
-- Ocupación preexistente de aulas a considerar:
--   AULA-101 : Lun 08-10 | Mar 08-10
--   AULA-102 : Lun 10-12 | Mar 10-12
--   AULA-201 : Lun 08-10 | Mar 08-10
--   LAB-COMP-1 : Mié 08-10 | Jue 10-12
--   LAB-COMP-2 : Mié 08-10
--
-- Ocupación preexistente de Ana (doc=2):
--   Lun 10-12
-- ============================================================
INSERT INTO Asignaciones
  (grupo_id, materia_id, docente_id, periodo_id, aula_id,
   dia_semana, hora_inicio, hora_fin,
   estatus_confirmacion, estatus_acta, creado_por)
VALUES
  -- V1: Lun 07:00-09:00 ─ antes de su bloque 10-12 ya existente
  --     ISC-1C | Álgebra Lineal | AULA-102
  --     ✓ Ana libre Lun 07-09 | ✓ AULA-102 libre Lun 07-09 | ✓ ISC-1C sin clases Lun
  (6, 9,  2, 3, 2,   1, '07:00:00','09:00:00', 'ACEPTADA','ABIERTA', 1),

  -- V2: Mar 12:00-14:00
  --     ISC-1A | Cálculo Integral | AULA-101
  --     ✓ Ana libre Mar | ✓ AULA-101 libre Mar 12-14 | ✓ ISC-1A libre Mar 12-14
  (1, 10, 2, 3, 1,   2, '12:00:00','14:00:00', 'ACEPTADA','ABIERTA', 1),

  -- V3: Mié 10:00-12:00
  --     ISC-1C | Probabilidad y Estadística | AULA-101
  --     ✓ Ana libre Mié | ✓ AULA-101 libre Mié 10-12 | ✓ ISC-1C libre Mié
  (6, 11, 2, 3, 1,   3, '10:00:00','12:00:00', 'ACEPTADA','ABIERTA', 1),

  -- V4: Jue 08:00-10:00
  --     ISC-1A | Álgebra Lineal | AULA-201
  --     ✓ Ana libre Jue | ✓ AULA-201 libre Jue | ✓ ISC-1A libre Jue
  (1, 9,  2, 3, 3,   4, '08:00:00','10:00:00', 'ACEPTADA','ABIERTA', 1),

  -- V5: Vie 07:00-09:00
  --     ISC-1B | Cálculo Integral | AULA-101
  --     ✓ Ana libre Vie 07-09 | ✓ AULA-101 libre Vie | ✓ ISC-1B libre Vie
  (2, 10, 2, 3, 1,   5, '07:00:00','09:00:00', 'ACEPTADA','ABIERTA', 1),

  -- V6: Vie 10:00-12:00
  --     ISC-2A | Probabilidad y Estadística | AULA-102
  --     ✓ Ana libre Vie 10-12 (V5 termina a las 09) | ✓ AULA-102 libre Vie | ✓ ISC-2A libre Vie
  (3, 11, 2, 3, 2,   5, '10:00:00','12:00:00', 'ACEPTADA','ABIERTA', 1);


-- ============================================================
-- PASO 4: ASIGNACIONES CON CONFLICTO INTENCIONAL
--
-- Cada una genera un empalme del docente Ana en un día/hora
-- que ya tiene ocupado. La aula y el grupo se eligen libres
-- para que el ÚNICO empalme sea el del docente, excepto C5.
--
-- Resumen visual:
--
--  Lun │ 07━━━━━09 V1 (válida)          07━━━━━━━━━10 ◄── C2 se monta encima (08-10)
--      │            10━━━━━━━━━12 existente
--      │            10━━━━━━━━━12 ◄─────────────────────── C1 (exacto)
--  Mar │                        12━━━━━━━━━14 V2 (válida)
--      │                        12━━━━━━━━━14 ◄──────────── C3 (exacto)
--  Jue │ 08━━━━━━━━10 V4 (válida)
--      │              09━━━━━━━━━11 ◄──────────────────────── C4 (parcial, 1h)
--  Vie │ 07━━━09 V5       10━━━━━━━━━12 V6 (válida)
--      │                  10━━━━━━━━━12 ◄──────────────────── C5 (exacto: docente + aula)
-- ============================================================

INSERT INTO Asignaciones
  (grupo_id, materia_id, docente_id, periodo_id, aula_id,
   dia_semana, hora_inicio, hora_fin,
   estatus_confirmacion, estatus_acta, creado_por)
VALUES

  -- ─────────────────────────────────────────────────────────
  -- C1  CONFLICTO EXACTO — Lun 10:00-12:00
  --     Colisiona con: V1_existente (Lun 10-12, AULA-102)
  --     Tipo: DOCENTE (solo)
  --     Aula LAB-COMP-2 y grupo ISC-1C están libres ese slot.
  -- ─────────────────────────────────────────────────────────
  (6, 10, 2, 3, 5,   1, '10:00:00','12:00:00', 'ENVIADA','ABIERTA', 1),

  -- ─────────────────────────────────────────────────────────
  -- C2  CONFLICTO PARCIAL — Lun 08:00-10:00
  --     Colisiona con: V1 (Lun 07-09) → traslape 08:00-09:00
  --     Tipo: DOCENTE (solo)
  --     LAB-COMP-1 libre Lun | ISC-1B libre Lun.
  -- ─────────────────────────────────────────────────────────
  (2, 9,  2, 3, 4,   1, '08:00:00','10:00:00', 'ENVIADA','ABIERTA', 1),

  -- ─────────────────────────────────────────────────────────
  -- C3  CONFLICTO EXACTO — Mar 12:00-14:00
  --     Colisiona con: V2 (Mar 12-14, AULA-101)
  --     Tipo: DOCENTE (solo)
  --     AULA-201 libre Mar 12-14 | ISC-2A libre Mar.
  -- ─────────────────────────────────────────────────────────
  (3, 11, 2, 3, 3,   2, '12:00:00','14:00:00', 'ENVIADA','ABIERTA', 1),

  -- ─────────────────────────────────────────────────────────
  -- C4  CONFLICTO PARCIAL — Jue 09:00-11:00
  --     Colisiona con: V4 (Jue 08-10) → traslape 09:00-10:00
  --     Tipo: DOCENTE (solo)
  --     LAB-COMP-2 libre Jue | ISC-1C libre Jue.
  -- ─────────────────────────────────────────────────────────
  (6, 10, 2, 3, 5,   4, '09:00:00','11:00:00', 'ENVIADA','ABIERTA', 1),

  -- ─────────────────────────────────────────────────────────
  -- C5  CONFLICTO DOBLE (DOCENTE + AULA) — Vie 10:00-12:00
  --     Colisiona con: V6 (Vie 10-12, AULA-102, ISC-2A)
  --     Tipo: DOCENTE + AULA simultáneamente
  --     ISC-1C libre Vie (grupo no conflicta).
  -- ─────────────────────────────────────────────────────────
  (6, 9,  2, 3, 2,   5, '10:00:00','12:00:00', 'ENVIADA','ABIERTA', 1);


-- ============================================================
-- RESUMEN FINAL – Horario completo de Ana tras este script
--
--  DÍA   HORA        MATERIA                     ESTADO
--  Lun   07:00-09:00 Álgebra Lineal     ISC-1C    VÁLIDA
--  Lun   10:00-12:00 Matemáticas Disc.  ISC-1A    VÁLIDA (preexistente)
--  Lun   10:00-12:00 Cálculo Integral   ISC-1C    ⚠ C1: CONFLICTO EXACTO (docente)
--  Lun   08:00-10:00 Álgebra Lineal     ISC-1B    ⚠ C2: CONFLICTO PARCIAL (docente, 08-09)
--  Mar   12:00-14:00 Cálculo Integral   ISC-1A    VÁLIDA
--  Mar   12:00-14:00 Prob. y Estadíst.  ISC-2A    ⚠ C3: CONFLICTO EXACTO (docente)
--  Mié   10:00-12:00 Prob. y Estadíst.  ISC-1C    VÁLIDA
--  Jue   08:00-10:00 Álgebra Lineal     ISC-1A    VÁLIDA
--  Jue   09:00-11:00 Cálculo Integral   ISC-1C    ⚠ C4: CONFLICTO PARCIAL (docente, 09-10)
--  Vie   07:00-09:00 Cálculo Integral   ISC-1B    VÁLIDA
--  Vie   10:00-12:00 Prob. y Estadíst.  ISC-2A    VÁLIDA
--  Vie   10:00-12:00 Álgebra Lineal     ISC-1C    ⚠ C5: CONFLICTO DOBLE (docente + aula)
-- ============================================================
