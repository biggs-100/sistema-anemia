CREATE TABLE IF NOT EXISTS backup_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_archivo TEXT NOT NULL,
    tamaño_mb REAL NOT NULL,
    fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    resultado TEXT NOT NULL,
    checksum TEXT
);

CREATE INDEX IF NOT EXISTS idx_backup_history_fecha ON backup_history(fecha_generacion);
