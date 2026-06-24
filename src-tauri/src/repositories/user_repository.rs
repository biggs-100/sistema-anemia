use crate::errors::AppError;
use crate::models::User;

/// Trait defining user data access operations.
#[allow(async_fn_in_trait)]
pub trait UserRepository {
    async fn find_by_username(&self, username: &str) -> Result<Option<User>, AppError>;
    async fn find_all(&self) -> Result<Vec<User>, AppError>;
    async fn create(&self, user: &User) -> Result<User, AppError>;
    async fn update(&self, id: i64, user: &User) -> Result<User, AppError>;
}

/// Stub — SQLite-backed user repository.
pub struct SqliteUserRepository;

impl UserRepository for SqliteUserRepository {
    async fn find_by_username(&self, _username: &str) -> Result<Option<User>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn find_all(&self) -> Result<Vec<User>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn create(&self, _user: &User) -> Result<User, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn update(&self, _id: i64, _user: &User) -> Result<User, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
