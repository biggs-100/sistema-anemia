use async_trait::async_trait;
use sqlx::SqlitePool;

use crate::errors::AppError;
use crate::models::CentroPoblado;

/// Trait defining centro poblado data access operations.
#[async_trait]
pub trait CentroPobladoRepository: Send + Sync {
    async fn list_all(&self) -> Result<Vec<CentroPoblado>, AppError>;
}

/// SQLite-backed centro poblado repository using sqlx.
pub struct SqliteCentroPobladoRepository {
    pool: SqlitePool,
}

impl SqliteCentroPobladoRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl CentroPobladoRepository for SqliteCentroPobladoRepository {
    async fn list_all(&self) -> Result<Vec<CentroPoblado>, AppError> {
        sqlx::query_as::<_, CentroPobladoRow>(
            "SELECT id, nombre, distrito, provincia, departamento, activo \
             FROM centros_poblados WHERE activo = 1 ORDER BY nombre",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("list centros poblados", e))
        .map(|rows| rows.into_iter().map(CentroPobladoRow::into_model).collect())
    }
}

// ---------------------------------------------------------------------------
// Internal row mapper
// ---------------------------------------------------------------------------

#[derive(sqlx::FromRow)]
struct CentroPobladoRow {
    id: i64,
    nombre: String,
    distrito: Option<String>,
    provincia: Option<String>,
    departamento: Option<String>,
    activo: bool,
}

impl CentroPobladoRow {
    fn into_model(self) -> CentroPoblado {
        CentroPoblado {
            id: self.id,
            nombre: self.nombre,
            distrito: self.distrito,
            provincia: self.provincia,
            departamento: self.departamento,
            activo: self.activo,
        }
    }
}

fn db_error(context: &str, err: sqlx::Error) -> AppError {
    AppError::Database(format!("{context}: {err}"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::SqlitePool;

    async fn setup_test_pool() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:").await.unwrap();
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS centros_poblados (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                distrito TEXT,
                provincia TEXT,
                departamento TEXT,
                activo INTEGER NOT NULL DEFAULT 1
            )",
        )
        .execute(&pool)
        .await
        .unwrap();

        // Insert test data
        sqlx::query("INSERT INTO centros_poblados (nombre, distrito, provincia, departamento, activo) VALUES (?1, ?2, ?3, ?4, ?5)")
            .bind("San Miguel")
            .bind("San Miguel")
            .bind("Lima")
            .bind("Lima")
            .bind(1)
            .execute(&pool).await.unwrap();

        sqlx::query("INSERT INTO centros_poblados (nombre, distrito, provincia, departamento, activo) VALUES (?1, ?2, ?3, ?4, ?5)")
            .bind("Villa Maria")
            .bind("Villa Maria del Triunfo")
            .bind("Lima")
            .bind("Lima")
            .bind(1)
            .execute(&pool).await.unwrap();

        // Inactive record — should NOT appear in list_all()
        sqlx::query("INSERT INTO centros_poblados (nombre, distrito, provincia, departamento, activo) VALUES (?1, ?2, ?3, ?4, ?5)")
            .bind("Inactivo")
            .bind("Centro")
            .bind("Lima")
            .bind("Lima")
            .bind(0)
            .execute(&pool).await.unwrap();

        pool
    }

    #[tokio::test]
    async fn test_centro_poblado_list() {
        let pool = setup_test_pool().await;
        let repo = SqliteCentroPobladoRepository::new(pool);

        let results = repo.list_all().await.unwrap();

        // Should only return active records
        assert_eq!(results.len(), 2);
        assert!(results.iter().all(|c| c.activo));
        assert!(results.iter().any(|c| c.nombre == "San Miguel"));
        assert!(results.iter().any(|c| c.nombre == "Villa Maria"));

        // Should be ordered by nombre
        assert_eq!(results[0].nombre, "San Miguel");
        assert_eq!(results[1].nombre, "Villa Maria");
    }
}
