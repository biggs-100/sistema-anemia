use crate::audit::AuditService;
use crate::dto::{ApiResponse, CreateTreatmentDTO};
use crate::errors::AppError;
use crate::models::Treatment;
use crate::repositories::treatment_repository::TreatmentRepository;

/// Treatment service for treatment plan business logic.
pub struct TreatmentService {
    repo: Box<dyn TreatmentRepository>,
    audit: AuditService,
}

impl TreatmentService {
    pub fn new(repo: Box<dyn TreatmentRepository>, audit: AuditService) -> Self {
        Self { repo, audit }
    }

    /// Creates a new treatment with validation.
    ///
    /// Validates:
    /// - Date format
    /// - No active treatments for this patient (warns, does not block)
    pub async fn create(
        &self,
        dto: CreateTreatmentDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<Treatment>, AppError> {
        self.validate_date(&dto.fecha_inicio)?;

        // Warn about existing active treatments (not blocking)
        let active = self.repo.find_active_by_paciente(dto.paciente_id).await?;
        if !active.is_empty() {
            tracing::warn!(
                "Patient {} already has {} active treatment(s)",
                dto.paciente_id,
                active.len(),
            );
        }

        let treatment = self.repo.create(&dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "CREATE",
                "tratamientos",
                Some(treatment.id),
                None,
                Some(&serde_json::to_string(&dto).unwrap_or_default()),
                None,
            )
            .await?;

        Ok(ApiResponse::success(treatment))
    }

    /// Finishes (marks as completed) a treatment.
    pub async fn finish(
        &self,
        id: i64,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<Treatment>, AppError> {
        let treatment = self.repo.finish(id).await?;

        self.audit
            .log_event(
                usuario_id,
                "FINISH",
                "tratamientos",
                Some(id),
                None,
                None,
                None,
            )
            .await?;

        Ok(ApiResponse::success(treatment))
    }

    /// Returns all treatments for a given patient.
    pub async fn get_by_paciente(
        &self,
        paciente_id: i64,
    ) -> Result<ApiResponse<Vec<Treatment>>, AppError> {
        let treatments = self.repo.find_by_paciente(paciente_id).await?;
        Ok(ApiResponse::success(treatments))
    }

    /// Returns active treatments for a patient.
    pub async fn get_active_by_paciente(
        &self,
        paciente_id: i64,
    ) -> Result<ApiResponse<Vec<Treatment>>, AppError> {
        let treatments = self.repo.find_active_by_paciente(paciente_id).await?;
        Ok(ApiResponse::success(treatments))
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    fn validate_date(&self, date: &str) -> Result<(), AppError> {
        // Basic date format validation YYYY-MM-DD
        if date.len() != 10 {
            return Err(AppError::Validation(format!(
                "Invalid date format: {date}. Expected YYYY-MM-DD"
            )));
        }
        // Check it parses
        if chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d").is_err() {
            return Err(AppError::Validation(format!(
                "Invalid date: {date}. Expected YYYY-MM-DD"
            )));
        }
        Ok(())
    }
}
