use crate::dto::ApiResponse;
use crate::errors::AppError;
use crate::models::BackupHistory;

/// Stub — Backup service for database backup and restore coordination.
pub struct BackupService;

impl BackupService {
    pub async fn create_backup() -> Result<ApiResponse<BackupHistory>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn restore_backup(_path: &str) -> Result<ApiResponse<()>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn list_backups() -> Result<ApiResponse<Vec<BackupHistory>>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
