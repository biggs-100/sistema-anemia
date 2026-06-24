CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
);

-- Seed data: default system roles
INSERT INTO roles (nombre) VALUES ('Admin');
INSERT INTO roles (nombre) VALUES ('Supervisor');
INSERT INTO roles (nombre) VALUES ('Operador');
INSERT INTO roles (nombre) VALUES ('Consulta');
