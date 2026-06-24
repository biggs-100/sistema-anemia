use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    /// Datos inválidos — verifique los campos
    #[error("Datos inválidos — verifique los campos")]
    Validation(String),

    /// Registro no encontrado
    #[error("Registro no encontrado")]
    NotFound(String),

    /// No autorizado
    #[error("No autorizado")]
    Unauthorized(String),

    /// Error en la base de datos
    #[error("Error en la base de datos")]
    Database(String),

    /// Error en el respaldo
    #[error("Error en el respaldo")]
    Backup(String),

    /// Error interno del sistema
    #[error("Error interno del sistema")]
    Internal(String),
}

impl AppError {
    /// Returns a user-safe message for frontend display (same as Display).
    pub fn user_message(&self) -> &str {
        match self {
            AppError::Validation(_) => "Datos inválidos — verifique los campos",
            AppError::NotFound(_) => "Registro no encontrado",
            AppError::Unauthorized(_) => "No autorizado",
            AppError::Database(_) => "Error en la base de datos",
            AppError::Backup(_) => "Error en el respaldo",
            AppError::Internal(_) => "Error interno del sistema",
        }
    }

    /// Returns the internal error detail for logging — do NOT expose to users.
    pub fn log_detail(&self) -> &str {
        match self {
            AppError::Validation(s)
            | AppError::NotFound(s)
            | AppError::Unauthorized(s)
            | AppError::Database(s)
            | AppError::Backup(s)
            | AppError::Internal(s) => s,
        }
    }
}

// Serialize so Tauri can send errors to the frontend as JSON.
// Uses user_message() to avoid leaking internal details.
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.user_message())
    }
}

// Allow converting AppError into a Tauri-compatible error string.
// Uses user_message() to avoid leaking internal details.
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.user_message().to_string()
    }
}

impl From<rust_xlsxwriter::XlsxError> for AppError {
    fn from(err: rust_xlsxwriter::XlsxError) -> Self {
        AppError::Internal(format!("XLSX error: {err}"))
    }
}
