CREATE TABLE IF NOT EXISTS visitas_domiciliarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    fecha_visita TEXT NOT NULL,
    responsable TEXT,
    resultado TEXT,
    observaciones TEXT,
    FOREIGN KEY (paciente_id) REFERENCES patients(id)
);

CREATE INDEX IF NOT EXISTS idx_visitas_paciente ON visitas_domiciliarias(paciente_id);
