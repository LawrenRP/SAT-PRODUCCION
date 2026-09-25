-- ==============================================================================
-- SISTEMA DE ALERTA TEMPRANA EN DOCENCIA UNIVERSITARIA (EWS) - UTP
-- Esquema Oficial de Base de Datos Relacional (PostgreSQL DDL)
-- Compatible con: Neon.tech, Supabase, Render PostgreSQL, Railway, PostgreSQL 14+
-- ==============================================================================

CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    institucion VARCHAR(100) NOT NULL DEFAULT 'Universidad Tecnológica del Perú',
    especialidad VARCHAR(100) NOT NULL DEFAULT 'Ingeniería de Software',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_docentes_id ON docentes (id);
CREATE INDEX IF NOT EXISTS ix_docentes_email ON docentes (email);

CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
    codigo_seccion VARCHAR(50) NOT NULL,
    nombre_curso VARCHAR(150) NOT NULL,
    periodo VARCHAR(50) NOT NULL DEFAULT '2026-2',
    sesiones_semana INTEGER NOT NULL DEFAULT 2,
    tiene_participacion BOOLEAN NOT NULL DEFAULT TRUE,
    tiene_tareas BOOLEAN NOT NULL DEFAULT TRUE,
    semana_corte INTEGER NOT NULL DEFAULT 4,
    datos_alumnos TEXT NOT NULL DEFAULT '[]',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_cursos_id ON cursos (id);
CREATE INDEX IF NOT EXISTS ix_cursos_docente_id ON cursos (docente_id);

-- ------------------------------------------------------------------------------
-- ALTERNATIVA SQLITE (Solo para pruebas y desarrollo local offline)
-- ------------------------------------------------------------------------------
-- CREATE TABLE IF NOT EXISTS docentes (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     email VARCHAR(255) NOT NULL UNIQUE,
--     hashed_password VARCHAR(255) NOT NULL,
--     nombre_completo VARCHAR(150) NOT NULL,
--     institucion VARCHAR(100) NOT NULL DEFAULT 'Universidad Tecnológica del Perú',
--     especialidad VARCHAR(100) NOT NULL DEFAULT 'Ingeniería de Software',
--     creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
-- 
-- CREATE TABLE IF NOT EXISTS cursos (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     docente_id INTEGER NOT NULL REFERENCES docentes(id) ON DELETE CASCADE,
--     codigo_seccion VARCHAR(50) NOT NULL,
--     nombre_curso VARCHAR(150) NOT NULL,
--     periodo VARCHAR(50) NOT NULL DEFAULT '2026-2',
--     sesiones_semana INTEGER NOT NULL DEFAULT 2,
--     tiene_participacion BOOLEAN NOT NULL DEFAULT 1,
--     tiene_tareas BOOLEAN NOT NULL DEFAULT 1,
--     semana_corte INTEGER NOT NULL DEFAULT 4,
--     datos_alumnos TEXT NOT NULL DEFAULT '[]',
--     creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
--     actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
