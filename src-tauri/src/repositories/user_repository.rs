use async_trait::async_trait;
use sqlx::SqlitePool;

use crate::errors::AppError;
use crate::models::User;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(
        &self,
        usuario: &str,
        password_hash: &str,
        nombres: &str,
        apellidos: &str,
        rol_id: i64,
    ) -> Result<User, AppError>;
    async fn find_by_username(&self, username: &str) -> Result<Option<User>, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<User>, AppError>;
    async fn update(
        &self,
        id: i64,
        nombres: Option<&str>,
        apellidos: Option<&str>,
        rol_id: Option<i64>,
        activo: Option<bool>,
    ) -> Result<User, AppError>;
    async fn deactivate(&self, id: i64) -> Result<(), AppError>;
    async fn list_all(&self) -> Result<Vec<User>, AppError>;
}

pub struct SqliteUserRepository {
    pool: SqlitePool,
}

impl SqliteUserRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UserRepository for SqliteUserRepository {
    async fn create(
        &self,
        usuario: &str,
        password_hash: &str,
        nombres: &str,
        apellidos: &str,
        rol_id: i64,
    ) -> Result<User, AppError> {
        let id = sqlx::query_scalar::<_, i64>(
            "INSERT INTO users (usuario, password_hash, nombres, apellidos, rol_id) \
             VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id",
        )
        .bind(usuario)
        .bind(password_hash)
        .bind(nombres)
        .bind(apellidos)
        .bind(rol_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| db_error("create user", e))?;

        self.find_by_id(id)
            .await
            .map(|u| u.expect("just created"))
    }

    async fn find_by_username(&self, username: &str) -> Result<Option<User>, AppError> {
        sqlx::query_as::<_, UserRow>(
            "SELECT id, usuario, password_hash, nombres, apellidos, rol_id, activo, creado_en \
             FROM users WHERE usuario = ?1",
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find user by username", e))
        .map(|opt| opt.map(UserRow::into_model))
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<User>, AppError> {
        sqlx::query_as::<_, UserRow>(
            "SELECT id, usuario, password_hash, nombres, apellidos, rol_id, activo, creado_en \
             FROM users WHERE id = ?1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| db_error("find user by id", e))
        .map(|opt| opt.map(UserRow::into_model))
    }

    async fn update(
        &self,
        id: i64,
        nombres: Option<&str>,
        apellidos: Option<&str>,
        rol_id: Option<i64>,
        activo: Option<bool>,
    ) -> Result<User, AppError> {
        let existing = self
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("User {id} not found")))?;

        let new_nombres = nombres.unwrap_or(&existing.nombres);
        let new_apellidos = apellidos.unwrap_or(&existing.apellidos);
        let new_rol_id = rol_id.unwrap_or(existing.rol_id);
        let new_activo = activo.unwrap_or(existing.activo);

        sqlx::query(
            "UPDATE users SET nombres = ?1, apellidos = ?2, rol_id = ?3, activo = ?4 WHERE id = ?5",
        )
        .bind(new_nombres)
        .bind(new_apellidos)
        .bind(new_rol_id)
        .bind(new_activo)
        .bind(id)
        .execute(&self.pool)
        .await
        .map_err(|e| db_error("update user", e))?;

        self.find_by_id(id)
            .await
            .map(|u| u.expect("just updated"))
    }

    async fn deactivate(&self, id: i64) -> Result<(), AppError> {
        let affected = sqlx::query("UPDATE users SET activo = 0 WHERE id = ?1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| db_error("deactivate user", e))?
            .rows_affected();

        if affected == 0 {
            return Err(AppError::NotFound(format!("User {id} not found")));
        }
        Ok(())
    }

    async fn list_all(&self) -> Result<Vec<User>, AppError> {
        let rows = sqlx::query_as::<_, UserRow>(
            "SELECT id, usuario, password_hash, nombres, apellidos, rol_id, activo, creado_en \
             FROM users ORDER BY nombres, apellidos",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| db_error("list users", e))?;

        Ok(rows.into_iter().map(UserRow::into_model).collect())
    }
}

#[derive(sqlx::FromRow)]
struct UserRow {
    id: i64,
    usuario: String,
    password_hash: String,
    nombres: String,
    apellidos: String,
    rol_id: i64,
    activo: bool,
    creado_en: Option<chrono::NaiveDateTime>,
}

impl UserRow {
    fn into_model(self) -> User {
        User {
            id: self.id,
            usuario: self.usuario,
            password_hash: self.password_hash,
            nombres: self.nombres,
            apellidos: self.apellidos,
            rol_id: self.rol_id,
            activo: self.activo,
            creado_en: self.creado_en,
        }
    }
}

fn db_error(context: &str, err: sqlx::Error) -> AppError {
    AppError::Database(format!("{context}: {err}"))
}
