CREATE TABLE IF NOT EXISTS centros_poblados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    distrito TEXT,
    provincia TEXT,
    departamento TEXT,
    activo INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_centros_poblados_nombre ON centros_poblados(nombre);
