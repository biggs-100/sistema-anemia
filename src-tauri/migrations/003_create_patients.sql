CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    historia_clinica TEXT NOT NULL UNIQUE,
    dni TEXT NOT NULL UNIQUE,
    nombres TEXT NOT NULL,
    apellido_paterno TEXT NOT NULL,
    apellido_materno TEXT NOT NULL,
    fecha_nacimiento TEXT NOT NULL,
    sexo TEXT NOT NULL,
    direccion TEXT,
    centro_poblado_id INTEGER,
    nombre_apoderado TEXT,
    celular_apoderado TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo INTEGER NOT NULL DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centro_poblado_id) REFERENCES centros_poblados(id)
);

CREATE INDEX IF NOT EXISTS idx_patients_dni ON patients(dni);
CREATE INDEX IF NOT EXISTS idx_patients_historia ON patients(historia_clinica);
CREATE INDEX IF NOT EXISTS idx_patients_activo ON patients(activo);
CREATE INDEX IF NOT EXISTS idx_patients_apellidos ON patients(apellido_paterno, apellido_materno);
