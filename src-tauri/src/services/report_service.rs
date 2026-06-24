use crate::errors::AppError;

/// Report service for PDF and Excel report generation.
///
/// NOTE: This is a STUB — full implementation will be delivered in a
/// dedicated feature sprint. Currently returns a placeholder message.
pub struct ReportService;

impl ReportService {
    /// Generates a PDF report for a specific patient.
    ///
    /// Returns a file path to the generated PDF.
    pub async fn generate_pdf(_paciente_id: i64) -> Result<String, AppError> {
        Err(AppError::Internal(
            "PDF generation not yet implemented — feature sprint".to_string(),
        ))
    }

    /// Generates an Excel report for a date range.
    ///
    /// Returns a file path to the generated Excel file.
    pub async fn generate_excel(_fecha_inicio: &str, _fecha_fin: &str) -> Result<String, AppError> {
        Err(AppError::Internal(
            "Excel generation not yet implemented — feature sprint".to_string(),
        ))
    }
}
