CREATE TABLE IF NOT EXISTS controles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    fecha_control TEXT NOT NULL,
    edad_meses INTEGER,
    peso REAL,
    talla REAL,
    hemoglobina REAL,
    temperatura REAL,
    observaciones TEXT,
    usuario_id INTEGER,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES patients(id),
    FOREIGN KEY (usuario_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_controles_paciente ON controles(paciente_id);
CREATE INDEX IF NOT EXISTS idx_controles_fecha ON controles(fecha_control);
CREATE INDEX IF NOT EXISTS idx_controles_paciente_fecha ON controles(paciente_id, fecha_control);
