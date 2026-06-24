CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    accion TEXT NOT NULL,
    tabla_afectada TEXT NOT NULL,
    registro_id INTEGER,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_local TEXT,
    FOREIGN KEY (usuario_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_fecha ON audit_log(fecha);
CREATE INDEX IF NOT EXISTS idx_audit_log_tabla ON audit_log(tabla_afectada);
CREATE INDEX IF NOT EXISTS idx_audit_log_accion ON audit_log(accion);
