use crate::dto::{ApiResponse, CreatePatientDTO, UpdatePatientDTO};
use crate::errors::AppError;
use crate::models::Patient;

/// Stub — Patient service for business logic and validation.
pub struct PatientService;

impl PatientService {
    pub async fn create(_dto: CreatePatientDTO) -> Result<ApiResponse<Patient>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn update(_id: i64, _dto: UpdatePatientDTO) -> Result<ApiResponse<Patient>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn get_by_id(_id: i64) -> Result<ApiResponse<Patient>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn search(_query: &str) -> Result<ApiResponse<Vec<Patient>>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
