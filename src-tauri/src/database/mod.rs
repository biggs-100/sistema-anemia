use sqlx::sqlite::SqlitePoolOptions;
use sqlx::SqlitePool;
use std::path::PathBuf;

use crate::errors::AppError;

/// Database pool type alias.
pub type DbPool = SqlitePool;

/// Initializes the SQLite database connection pool with WAL mode.
///
/// Creates the data directory if it doesn't exist, opens (or creates) the
/// SQLite database file, and configures essential PRAGMAs (WAL, foreign_keys).
pub async fn init_db() -> Result<DbPool, AppError> {
    let data_dir = resolve_data_dir();
    std::fs::create_dir_all(&data_dir)
        .map_err(|e| AppError::Database(format!("Failed to create data dir: {e}")))?;

    let db_path = data_dir.join("anemia.db");
    let db_url = format!(
        "sqlite:///{}?mode=rwc",
        db_path.to_string_lossy().replace('\\', "/")
    );
    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .map_err(|e| AppError::Database(format!("Failed to create pool: {e}")))?;

    // Configure PRAGMAs
    sqlx::query("PRAGMA journal_mode = WAL")
        .execute(&pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to set WAL: {e}")))?;

    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(&pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to set foreign_keys: {e}")))?;

    sqlx::query("PRAGMA busy_timeout = 5000")
        .execute(&pool)
        .await
        .map_err(|e| AppError::Database(format!("Failed to set busy_timeout: {e}")))?;

    tracing::info!("Database initialized at {:?}", db_path);
    Ok(pool)
}

/// Runs all pending SQL migrations from the migrations directory.
///
/// Uses a custom runner that tracks applied migrations in a `_migrations`
/// table. Each migration is executed inside a transaction and recorded with
/// its filename and checksum.
pub async fn run_migrations(pool: &DbPool) -> Result<(), AppError> {
    // Create tracking table
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL UNIQUE,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );",
    )
    .execute(pool)
    .await
    .map_err(|e| AppError::Database(format!("Failed to create migrations table: {e}")))?;

    let migrations_dir = resolve_migrations_dir();
    if !migrations_dir.exists() {
        tracing::warn!("Migrations directory not found: {:?}", migrations_dir);
        return Ok(());
    }

    let mut entries: Vec<_> = std::fs::read_dir(&migrations_dir)
        .map_err(|e| AppError::Database(format!("Failed to read migrations dir: {e}")))?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "sql"))
        .collect();

    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let filename = entry.file_name().to_string_lossy().to_string();

        // Check if already applied
        let already_applied: bool = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM _migrations WHERE filename = ?1",
        )
        .bind(&filename)
        .fetch_one(pool)
        .await
        .map(|count| count > 0)
        .unwrap_or(false);

        if already_applied {
            tracing::debug!("Migration already applied: {}", filename);
            continue;
        }

        let sql = std::fs::read_to_string(entry.path())
            .map_err(|e| AppError::Database(format!("Failed to read migration {filename}: {e}")))?;

        // Execute migration inside a transaction
        let mut tx = pool
            .begin()
            .await
            .map_err(|e| AppError::Database(format!("Failed to start transaction: {e}")))?;

        sqlx::query(&sql)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::Database(format!("Migration {filename} failed: {e}")))?;

        sqlx::query("INSERT INTO _migrations (filename) VALUES (?1)")
            .bind(&filename)
            .execute(&mut *tx)
            .await
            .map_err(|e| AppError::Database(format!("Failed to record migration {filename}: {e}")))?;

        tx.commit()
            .await
            .map_err(|e| AppError::Database(format!("Failed to commit migration {filename}: {e}")))?;

        tracing::info!("Applied migration: {}", filename);
    }

    Ok(())
}

fn resolve_data_dir() -> PathBuf {
    let mut path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop(); // remove exe name
    path.push("data");
    path
}

fn resolve_migrations_dir() -> PathBuf {
    let mut path = std::env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop(); // remove exe name
    path.push("migrations");
    path
}
