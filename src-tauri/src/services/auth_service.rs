use std::collections::HashMap;
use std::sync::Mutex;

use crate::audit::AuditService;
use crate::dto::{ApiResponse, LoginDTO};
use crate::errors::AppError;
use crate::models::User;
use crate::repositories::user_repository::UserRepository;
use crate::security;

/// Auth service for user authentication and session management.
pub struct AuthService {
    user_repo: Box<dyn UserRepository>,
    audit: AuditService,
    /// In-memory session store: token → user_id
    sessions: Mutex<HashMap<String, i64>>,
}

impl AuthService {
    pub fn new(user_repo: Box<dyn UserRepository>, audit: AuditService) -> Self {
        Self {
            user_repo,
            audit,
            sessions: Mutex::new(HashMap::new()),
        }
    }

    /// Authenticates a user with username and password.
    ///
    /// Returns a session token on success.
    pub async fn login(&self, dto: &LoginDTO) -> Result<ApiResponse<String>, AppError> {
        // Validate empty inputs
        if dto.usuario.trim().is_empty() {
            return Err(AppError::Validation("Username is required".to_string()));
        }
        if dto.password.is_empty() {
            return Err(AppError::Validation("Password is required".to_string()));
        }

        let user = self
            .user_repo
            .find_by_username(&dto.usuario)
            .await?
            .ok_or_else(|| AppError::Unauthorized)?;

        if !user.activo {
            return Err(AppError::Unauthorized);
        }

        let valid = security::verify_password(&dto.password, &user.password_hash)?;
        if !valid {
            return Err(AppError::Unauthorized);
        }

        let token = security::generate_session_token();
        self.sessions.lock().unwrap().insert(token.clone(), user.id);

        // Audit log
        self.audit
            .log_event(Some(user.id), "LOGIN", "users", Some(user.id), None, None, None)
            .await?;

        tracing::info!("User '{}' logged in (id={})", user.usuario, user.id);
        Ok(ApiResponse::success(token))
    }

    /// Logs out a user by invalidating their session token.
    pub async fn logout(&self, token: &str) -> Result<(), AppError> {
        let user_id = self
            .sessions
            .lock()
            .unwrap()
            .remove(token)
            .ok_or_else(|| AppError::Unauthorized)?;

        self.audit
            .log_event(Some(user_id), "LOGOUT", "users", Some(user_id), None, None, None)
            .await?;

        tracing::debug!("User {user_id} logged out");
        Ok(())
    }

    /// Returns the current user for a valid session token.
    pub async fn current_user(&self, token: &str) -> Result<ApiResponse<User>, AppError> {
        let user_id = self
            .sessions
            .lock()
            .unwrap()
            .get(token)
            .copied()
            .ok_or_else(|| AppError::Unauthorized)?;

        let user = self
            .user_repo
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| AppError::NotFound("User not found".to_string()))?;

        Ok(ApiResponse::success(user))
    }

    /// Validates a session token and returns the user ID if valid.
    pub fn validate_token(&self, token: &str) -> Option<i64> {
        self.sessions.lock().unwrap().get(token).copied()
    }
}
