use crate::dto::CreateControlDTO;
use crate::errors::AppError;
use crate::models::Control;

/// Trait defining control (follow-up) data access operations.
#[allow(async_fn_in_trait)]
pub trait ControlRepository {
    async fn create(&self, dto: &CreateControlDTO) -> Result<Control, AppError>;
    async fn update(&self, id: i64, dto: &CreateControlDTO) -> Result<Control, AppError>;
    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<Control>, AppError>;
}

/// Stub — SQLite-backed control repository.
pub struct SqliteControlRepository;

impl ControlRepository for SqliteControlRepository {
    async fn create(&self, _dto: &CreateControlDTO) -> Result<Control, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn update(&self, _id: i64, _dto: &CreateControlDTO) -> Result<Control, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn find_by_paciente(&self, _paciente_id: i64) -> Result<Vec<Control>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
