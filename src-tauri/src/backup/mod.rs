use chrono::NaiveDateTime;
use sha2::{Digest, Sha256};
use sqlx::SqlitePool;
use std::path::{Path, PathBuf};

use crate::errors::AppError;
use crate::models::BackupHistory;

/// Backup manager for creating and restoring database backups with retention policy.
#[derive(Clone)]
pub struct BackupManager {
    pool: SqlitePool,
    backups_dir: PathBuf,
    db_path: PathBuf,
}

impl BackupManager {
    pub fn new(pool: SqlitePool, backups_dir: PathBuf, db_path: PathBuf) -> Self {
        Self {
            pool,
            backups_dir,
            db_path,
        }
    }

    /// Creates a backup of the current database with integrity check.
    pub async fn create_backup(&self) -> Result<BackupHistory, AppError> {
        // Ensure backups directory exists
        std::fs::create_dir_all(&self.backups_dir)
            .map_err(|e| AppError::Backup(format!("Failed to create backups dir: {e}")))?;

        // Verify source DB exists
        if !self.db_path.exists() {
            return Err(AppError::Backup("Database file not found".to_string()));
        }

        // Generate backup filename with timestamp
        let now = chrono::Local::now();
        let timestamp = now.format("%Y%m%d_%H%M%S");
        let backup_filename = format!("anemia_backup_{}.db", timestamp);
        let backup_path = self.backups_dir.join(&backup_filename);

        // Copy file
        tokio::fs::copy(&self.db_path, &backup_path)
            .await
            .map_err(|e| AppError::Backup(format!("Failed to copy database: {e}")))?;

        // Compute SHA-256 checksum
        let checksum = compute_file_checksum(&backup_path)?;

        // Get file size
        let metadata = std::fs::metadata(&backup_path)
            .map_err(|e| AppError::Backup(format!("Failed to read backup metadata: {e}")))?;
        let tamaño_mb = metadata.len() as f64 / (1024.0 * 1024.0);

        // Record in backup_history table
        let id = sqlx::query_scalar::<_, i64>(
            "INSERT INTO backup_history (nombre_archivo, tamaño_mb, resultado, checksum) \
             VALUES (?1, ?2, 'exitoso', ?3) RETURNING id",
        )
        .bind(&backup_filename)
        .bind(tamaño_mb)
        .bind(&checksum)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to record backup: {e}")))?;

        // Apply retention policy
        self.apply_retention_policy().await?;

        tracing::info!(
            "Backup created: {} ({:.2} MB)",
            backup_filename,
            tamaño_mb
        );

        Ok(BackupHistory {
            id,
            nombre_archivo: backup_filename,
            tamaño_mb,
            fecha_generacion: Some(now.naive_local()),
            resultado: "exitoso".to_string(),
            checksum: Some(checksum),
        })
    }

    /// Restores the database from a backup file.
    pub async fn restore_backup(&self, backup_path: &str) -> Result<(), AppError> {
        let path = Path::new(backup_path);

        if !path.exists() {
            return Err(AppError::Backup(format!(
                "Backup file not found: {backup_path}"
            )));
        }

        // Verify checksum if available
        let filename = path
            .file_name()
            .map(|f| f.to_string_lossy().to_string())
            .unwrap_or_default();

        if let Ok(Some(record)) = self.find_backup_by_filename(&filename).await {
            if let Some(ref stored_checksum) = record.checksum {
                let actual_checksum = compute_file_checksum(path)?;
                if stored_checksum != &actual_checksum {
                    return Err(AppError::Backup(
                        "Checksum mismatch — backup file may be corrupted".to_string(),
                    ));
                }
            }
        }

        // Create a snapshot of current DB before restoring
        let snapshot_path = self.db_path.with_extension("db.snapshot");
        if self.db_path.exists() {
            tokio::fs::copy(&self.db_path, &snapshot_path)
                .await
                .map_err(|e| AppError::Backup(format!("Failed to create snapshot: {e}")))?;
        }

        // Close pool connections by draining, then copy backup over DB
        // For SQLite, we just copy over the file
        tokio::fs::copy(path, &self.db_path)
            .await
            .map_err(|e| AppError::Backup(format!("Failed to restore backup: {e}")))?;

        tracing::info!("Database restored from: {backup_path}");
        Ok(())
    }

    /// Lists all available backups.
    pub async fn list_backups(&self) -> Result<Vec<BackupHistory>, AppError> {
        let rows = sqlx::query_as::<_, BackupRow>(
            "SELECT id, nombre_archivo, tamaño_mb, fecha_generacion, resultado, checksum \
             FROM backup_history ORDER BY fecha_generacion DESC",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to list backups: {e}")))?;

        Ok(rows.into_iter().map(BackupRow::into_model).collect())
    }

    /// Retention policy: keep daily for 30 days, weekly for 12 weeks, monthly for 24 months.
    async fn apply_retention_policy(&self) -> Result<(), AppError> {
        // Daily: keep last 30 days (anything older than 30 days and not a weekly/monthly)
        sqlx::query(
            "DELETE FROM backup_history WHERE fecha_generacion < datetime('now', '-30 days') \
             AND (strftime('%w', fecha_generacion) != '0' \
             AND strftime('%d', fecha_generacion) NOT IN ('01'))",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Retention cleanup failed: {e}")))?;

        // Weekly: keep one per week for 12 weeks
        sqlx::query(
            "DELETE FROM backup_history WHERE fecha_generacion < datetime('now', '-12 weeks') \
             AND strftime('%w', fecha_generacion) = '0' \
             AND strftime('%d', fecha_generacion) NOT IN ('01')",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Retention cleanup failed: {e}")))?;

        // Monthly: keep one per month for 24 months
        sqlx::query(
            "DELETE FROM backup_history WHERE fecha_generacion < datetime('now', '-24 months') \
             AND strftime('%d', fecha_generacion) = '01'",
        )
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Retention cleanup failed: {e}")))?;

        Ok(())
    }

    /// Finds a backup by its ID.
    pub async fn find_backup_by_id(&self, id: i64) -> Result<Option<BackupHistory>, AppError> {
        let row = sqlx::query_as::<_, BackupRow>(
            "SELECT id, nombre_archivo, tamaño_mb, fecha_generacion, resultado, checksum \
             FROM backup_history WHERE id = ?1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to find backup by id: {e}")))?;

        Ok(row.map(BackupRow::into_model))
    }

    /// Restores a backup by database ID (resolves the file path internally).
    pub async fn restore_backup_by_id(&self, id: i64) -> Result<(), AppError> {
        let backup = self
            .find_backup_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Backup {id} not found")))?;

        let backup_path = self.backups_dir.join(&backup.nombre_archivo);
        let path_str = backup_path
            .to_str()
            .ok_or_else(|| AppError::Backup("Invalid backup path".to_string()))?;

        self.restore_backup(path_str).await
    }

    async fn find_backup_by_filename(&self, filename: &str) -> Result<Option<BackupHistory>, AppError> {
        let row = sqlx::query_as::<_, BackupRow>(
            "SELECT id, nombre_archivo, tamaño_mb, fecha_generacion, resultado, checksum \
             FROM backup_history WHERE nombre_archivo = ?1",
        )
        .bind(filename)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to find backup: {e}")))?;

        Ok(row.map(BackupRow::into_model))
    }
}

fn compute_file_checksum(path: &Path) -> Result<String, AppError> {
    let data = std::fs::read(path)
        .map_err(|e| AppError::Backup(format!("Failed to read file for checksum: {e}")))?;

    let mut hasher = Sha256::new();
    hasher.update(&data);
    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}

// ---------------------------------------------------------------------------
// Internal row mapper
// ---------------------------------------------------------------------------

#[derive(sqlx::FromRow)]
struct BackupRow {
    id: i64,
    nombre_archivo: String,
    tamaño_mb: f64,
    fecha_generacion: Option<NaiveDateTime>,
    resultado: String,
    checksum: Option<String>,
}

impl BackupRow {
    fn into_model(self) -> BackupHistory {
        BackupHistory {
            id: self.id,
            nombre_archivo: self.nombre_archivo,
            tamaño_mb: self.tamaño_mb,
            fecha_generacion: self.fecha_generacion,
            resultado: self.resultado,
            checksum: self.checksum,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::sync::atomic::{AtomicU32, Ordering};

    static TEST_COUNTER: AtomicU32 = AtomicU32::new(0);

    async fn setup_test_env() -> (SqlitePool, PathBuf, PathBuf) {
        let id = TEST_COUNTER.fetch_add(1, Ordering::SeqCst);
        let tmp = std::env::temp_dir().join(format!("anemia_backup_test_{}_{}", std::process::id(), id));
        let _ = fs::remove_dir_all(&tmp);
        fs::create_dir_all(&tmp).unwrap();

        let db_path = tmp.join("test.db");
        let backups_dir = tmp.join("backups");

        // Create a real SQLite database file
        let pool = SqlitePool::connect(&format!("sqlite:///{}?mode=rwc", db_path.to_string_lossy().replace('\\', "/")))
            .await
            .unwrap();

        // Create required tables
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS backup_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_archivo TEXT NOT NULL,
                tamaño_mb REAL NOT NULL,
                fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                resultado TEXT NOT NULL,
                checksum TEXT
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        // Also create a minimal table to have real data
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS test_data (id INTEGER PRIMARY KEY, value TEXT)"
        )
        .execute(&pool)
        .await
        .unwrap();

        sqlx::query("INSERT INTO test_data (value) VALUES ('test')")
            .execute(&pool)
            .await
            .unwrap();

        // Close pool connections so the file can be copied
        pool.close().await;

        // Re-open with a new pool
        let pool2 = SqlitePool::connect(&format!("sqlite:///{}?mode=rwc", db_path.to_string_lossy().replace('\\', "/")))
            .await
            .unwrap();

        (pool2, db_path, backups_dir)
    }

    #[tokio::test]
    async fn test_create_backup_creates_file() {
        let (pool, db_path, backups_dir) = setup_test_env().await;
        let manager = BackupManager::new(pool.clone(), backups_dir.clone(), db_path.clone());

        let backup = manager.create_backup().await.unwrap();

        // Verify backup file exists
        let backup_file = backups_dir.join(&backup.nombre_archivo);
        assert!(backup_file.exists(), "Backup file should exist");
        assert!(backup.tamaño_mb > 0.0, "Backup size should be > 0");
        assert!(backup.checksum.is_some(), "Backup should have checksum");
        assert_eq!(backup.resultado, "exitoso");

        // Cleanup
        let _ = fs::remove_dir_all(backups_dir.parent().unwrap());
        pool.close().await;
    }

    #[tokio::test]
    async fn test_create_backup_records_in_db() {
        let (pool, db_path, backups_dir) = setup_test_env().await;
        let manager = BackupManager::new(pool.clone(), backups_dir.clone(), db_path.clone());

        let backup = manager.create_backup().await.unwrap();

        // Verify backup is recorded in backup_history
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM backup_history")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(count, 1, "Should have 1 backup record");

        // Verify ID matches
        let recorded: i64 = sqlx::query_scalar("SELECT id FROM backup_history LIMIT 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(recorded, backup.id);

        // Cleanup
        let _ = fs::remove_dir_all(backups_dir.parent().unwrap());
        pool.close().await;
    }
}
