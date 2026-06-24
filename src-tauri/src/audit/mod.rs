use crate::errors::AppError;

/// Stub — Audit service for recording all data mutations.
pub struct AuditService;

impl AuditService {
    /// Records an auditable event (CREATE, UPDATE, DELETE_LOGICAL, LOGIN, LOGOUT, RESTORE_BACKUP).
    pub async fn record(
        _usuario: &str,
        _accion: &str,
        _tabla: &str,
        _registro_id: i64,
    ) -> Result<(), AppError> {
        // TODO: Implement in Phase 4
        tracing::debug!("Audit record not yet implemented");
        Ok(())
    }
}
