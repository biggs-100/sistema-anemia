use sqlx::SqlitePool;

use crate::errors::AppError;
use crate::models::AuditLog;

/// Audit service for recording all data mutations.
pub struct AuditService {
    pool: SqlitePool,
}

impl AuditService {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    /// Records an auditable event (CREATE, UPDATE, DELETE_LOGICAL, LOGIN, LOGOUT, etc.).
    pub async fn log_event(
        &self,
        usuario_id: Option<i64>,
        accion: &str,
        tabla_afectada: &str,
        registro_id: Option<i64>,
        datos_anteriores: Option<&str>,
        datos_nuevos: Option<&str>,
        ip_local: Option<&str>,
    ) -> Result<(), AppError> {
        sqlx::query(
            "INSERT INTO audit_log (usuario_id, accion, tabla_afectada, registro_id, \
             datos_anteriores, datos_nuevos, ip_local) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        )
        .bind(usuario_id)
        .bind(accion)
        .bind(tabla_afectada)
        .bind(registro_id)
        .bind(datos_anteriores)
        .bind(datos_nuevos)
        .bind(ip_local)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Audit log failed: {e}")))?;

        tracing::debug!(
            "Audit: usuario_id={:?} accion={} tabla={} registro_id={:?}",
            usuario_id,
            accion,
            tabla_afectada,
            registro_id,
        );
        Ok(())
    }

    /// Retrieves all audit events, optionally filtered by simple criteria.
    ///
    /// For large datasets, post-filter in Rust rather than using dynamic SQL.
    pub async fn get_events(
        &self,
        usuario_id: Option<i64>,
        accion: Option<&str>,
        tabla_afectada: Option<&str>,
        limit: Option<i64>,
    ) -> Result<Vec<AuditLog>, AppError> {
        let mut rows: Vec<AuditLogRow> = sqlx::query_as::<_, AuditLogRow>(
            "SELECT id, usuario_id, accion, tabla_afectada, registro_id, \
             datos_anteriores, datos_nuevos, fecha, ip_local \
             FROM audit_log ORDER BY fecha DESC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Audit query failed: {e}")))?;

        // Apply filters in Rust
        if let Some(uid) = usuario_id {
            rows.retain(|r| r.usuario_id == Some(uid));
        }
        if let Some(a) = accion {
            rows.retain(|r| r.accion == a);
        }
        if let Some(t) = tabla_afectada {
            rows.retain(|r| r.tabla_afectada == t);
        }

        // Apply limit
        if let Some(l) = limit {
            rows.truncate(l as usize);
        }

        Ok(rows.into_iter().map(AuditLogRow::into_model).collect())
    }
}

#[derive(sqlx::FromRow)]
struct AuditLogRow {
    id: i64,
    usuario_id: Option<i64>,
    accion: String,
    tabla_afectada: String,
    registro_id: Option<i64>,
    datos_anteriores: Option<String>,
    datos_nuevos: Option<String>,
    fecha: Option<chrono::NaiveDateTime>,
    ip_local: Option<String>,
}

impl AuditLogRow {
    fn into_model(self) -> AuditLog {
        AuditLog {
            id: self.id,
            usuario_id: self.usuario_id,
            accion: self.accion,
            tabla_afectada: self.tabla_afectada,
            registro_id: self.registro_id,
            datos_anteriores: self.datos_anteriores,
            datos_nuevos: self.datos_nuevos,
            fecha: self.fecha,
            ip_local: self.ip_local,
        }
    }
}
