use crate::dto::{CreatePatientDTO, UpdatePatientDTO};
use crate::errors::AppError;
use crate::models::Patient;

/// Trait defining patient data access operations.
#[allow(async_fn_in_trait)]
pub trait PatientRepository {
    async fn create(&self, dto: &CreatePatientDTO) -> Result<Patient, AppError>;
    async fn update(&self, id: i64, dto: &UpdatePatientDTO) -> Result<Patient, AppError>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Patient>, AppError>;
    async fn find_by_dni(&self, dni: &str) -> Result<Option<Patient>, AppError>;
    async fn search(&self, query: &str) -> Result<Vec<Patient>, AppError>;
    async fn deactivate(&self, id: i64) -> Result<(), AppError>;
}

/// Stub — SQLite-backed patient repository.
pub struct SqlitePatientRepository;

impl PatientRepository for SqlitePatientRepository {
    async fn create(&self, _dto: &CreatePatientDTO) -> Result<Patient, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn update(&self, _id: i64, _dto: &UpdatePatientDTO) -> Result<Patient, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn find_by_id(&self, _id: i64) -> Result<Option<Patient>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn find_by_dni(&self, _dni: &str) -> Result<Option<Patient>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn search(&self, _query: &str) -> Result<Vec<Patient>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    async fn deactivate(&self, _id: i64) -> Result<(), AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
