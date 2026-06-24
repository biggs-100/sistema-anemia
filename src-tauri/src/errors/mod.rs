use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("{0}")]
    Unauthorized(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("Backup error: {0}")]
    Backup(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

// Serialize so Tauri can send errors to the frontend as JSON.
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

// Allow converting AppError into a Tauri-compatible error string.
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
