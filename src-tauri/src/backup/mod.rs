use crate::errors::AppError;
use crate::models::BackupHistory;

/// Stub — Backup service for creating and restoring database backups.
pub struct BackupManager;

impl BackupManager {
    /// Creates a backup of the current database.
    pub async fn create_backup(_db_path: &str) -> Result<BackupHistory, AppError> {
        Err(AppError::Backup("Not implemented".to_string()))
    }

    /// Restores the database from a backup file.
    pub async fn restore_backup(_backup_path: &str) -> Result<(), AppError> {
        Err(AppError::Backup("Not implemented".to_string()))
    }

    /// Lists all available backups.
    pub async fn list_backups() -> Result<Vec<BackupHistory>, AppError> {
        Err(AppError::Backup("Not implemented".to_string()))
    }
}
