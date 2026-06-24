use crate::dto::{ApiResponse, CreateControlDTO};
use crate::errors::AppError;
use crate::models::Control;

/// Stub — Control service for follow-up appointment business logic.
pub struct ControlService;

impl ControlService {
    pub async fn create(_dto: CreateControlDTO) -> Result<ApiResponse<Control>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn update(_id: i64, _dto: CreateControlDTO) -> Result<ApiResponse<Control>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn get_by_paciente(_paciente_id: i64) -> Result<ApiResponse<Vec<Control>>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
