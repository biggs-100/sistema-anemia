CREATE TABLE IF NOT EXISTS alertas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descripcion TEXT,
    fecha_generada DATETIME DEFAULT CURRENT_TIMESTAMP,
    resuelta INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (paciente_id) REFERENCES patients(id)
);

CREATE INDEX IF NOT EXISTS idx_alertas_paciente ON alertas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_resuelta ON alertas(resuelta);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON alertas(tipo);
