CREATE TABLE IF NOT EXISTS medicamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    activo INTEGER NOT NULL DEFAULT 1
);

-- Seed data: default anemia medications
INSERT INTO medicamentos (nombre) VALUES ('Sulfato Ferroso');
INSERT INTO medicamentos (nombre) VALUES ('Multimicronutrientes');
INSERT INTO medicamentos (nombre) VALUES ('Hierro Polimaltosado');
