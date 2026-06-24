CREATE TABLE IF NOT EXISTS tratamientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paciente_id INTEGER NOT NULL,
    medicamento_id INTEGER NOT NULL,
    dosis TEXT,
    frecuencia TEXT,
    fecha_inicio TEXT NOT NULL,
    fecha_fin TEXT,
    estado TEXT NOT NULL DEFAULT 'activo',
    observaciones TEXT,
    FOREIGN KEY (paciente_id) REFERENCES patients(id),
    FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id)
);

CREATE INDEX IF NOT EXISTS idx_tratamientos_paciente ON tratamientos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_tratamientos_estado ON tratamientos(estado);
CREATE INDEX IF NOT EXISTS idx_tratamientos_paciente_activo ON tratamientos(paciente_id, estado);
