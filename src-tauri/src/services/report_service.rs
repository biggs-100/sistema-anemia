use crate::errors::AppError;

/// Stub — Report service for PDF and Excel report generation.
pub struct ReportService;

impl ReportService {
    pub async fn generate_pdf(_paciente_id: i64) -> Result<String, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }

    pub async fn generate_excel(_fecha_inicio: &str, _fecha_fin: &str) -> Result<String, AppError> {
        Err(AppError::Internal("Not implemented".to_string()))
    }
}
