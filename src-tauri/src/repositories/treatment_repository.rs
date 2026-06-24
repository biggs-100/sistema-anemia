use crate::dto::CreateTreatmentDTO;
use crate::errors::AppError;
use crate::models::Treatment;

/// Trait defining treatment data access operations.
#[allow(async_fn_in_trait)]
pub trait TreatmentRepository {
    async fn create(&self, dto: &CreateTreatmentDTO) -> Result<Treatment, AppError>;
    async fn finish(&self, id: i64) -> Result<Treatment, AppError>;
    async fn find_by_paciente(&self, paciente_id: i64) -> Result<Vec<Treatment>, AppError>;
}

/// Stub — SQLite-backed treatment repository.
pub struct SqliteTreatmentRepository;

impl TreatmentRepository for SqliteTreatmentRepository {
    async fn create(&self, _dto: &CreateTreatmentDTO) -> Result<Treatment, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn finish(&self, _id: i64) -> Result<Treatment, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn find_by_paciente(&self, _paciente_id: i64) -> Result<Vec<Treatment>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
