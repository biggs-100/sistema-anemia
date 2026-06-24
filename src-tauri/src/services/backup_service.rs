use crate::backup::BackupManager;
use crate::dto::ApiResponse;
use crate::errors::AppError;
use crate::models::BackupHistory;

/// Backup service for database backup and restore coordination.
pub struct BackupService {
    manager: BackupManager,
}

impl BackupService {
    pub fn new(manager: BackupManager) -> Self {
        Self { manager }
    }

    /// Creates a database backup with integrity check and retention policy.
    pub async fn create_backup(&self) -> Result<ApiResponse<BackupHistory>, AppError> {
        let backup = self.manager.create_backup().await?;
        Ok(ApiResponse::success(backup))
    }

    /// Restores the database from a backup file.
    pub async fn restore_backup(&self, path: &str) -> Result<ApiResponse<()>, AppError> {
        self.manager.restore_backup(path).await?;
        Ok(ApiResponse::success(()))
    }

    /// Restores a backup by its database ID (resolves file path internally).
    pub async fn restore_backup_by_id(&self, id: i64) -> Result<ApiResponse<()>, AppError> {
        self.manager.restore_backup_by_id(id).await?;
        Ok(ApiResponse::success(()))
    }

    /// Lists all available backups.
    pub async fn list_backups(&self) -> Result<ApiResponse<Vec<BackupHistory>>, AppError> {
        let backups = self.manager.list_backups().await?;
        Ok(ApiResponse::success(backups))
    }
}
