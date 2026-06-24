use crate::dto::ApiResponse;
use crate::errors::AppError;
use crate::models::User;

/// Stub — Auth service for user authentication and session management.
pub struct AuthService;

impl AuthService {
    pub async fn login(_usuario: &str, _password: &str) -> Result<ApiResponse<User>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn logout(_token: &str) -> Result<(), AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn current_user(_token: &str) -> Result<ApiResponse<User>, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
