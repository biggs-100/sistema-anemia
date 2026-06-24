use crate::dto::{ApiResponse, CreateTreatmentDTO};
use crate::errors::AppError;
use crate::models::Treatment;

/// Stub — Treatment service for treatment plan business logic.
pub struct TreatmentService;

impl TreatmentService {
    pub async fn create(_dto: CreateTreatmentDTO) -> Result<ApiResponse<Treatment>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn finish(_id: i64) -> Result<ApiResponse<Treatment>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn get_by_paciente(_paciente_id: i64) -> Result<ApiResponse<Vec<Treatment>>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
