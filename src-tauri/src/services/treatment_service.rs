use sqlx::SqlitePool;

use crate::audit::AuditService;
use crate::dto::{
    ApiResponse, CreateTreatmentDTO, MedicamentoResponse, TreatmentResponse, UpdateTreatmentDTO,
};
use crate::errors::AppError;
use crate::models::Medicamento;
use crate::repositories::treatment_repository::TreatmentRepository;

/// Treatment service for treatment plan business logic.
pub struct TreatmentService {
    repo: Box<dyn TreatmentRepository>,
    audit: AuditService,
    pool: SqlitePool,
}

impl TreatmentService {
    pub fn new(repo: Box<dyn TreatmentRepository>, audit: AuditService, pool: SqlitePool) -> Self {
        Self { repo, audit, pool }
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
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
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

    /// Updates mutable fields of a treatment (dosis, frecuencia, observaciones).
    pub async fn update(
        &self,
        id: i64,
        dto: UpdateTreatmentDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
        let treatment = self.repo.update(id, &dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "UPDATE",
                "tratamientos",
                Some(id),
                None,
                Some(&serde_json::to_string(&dto).unwrap_or_default()),
                None,
            )
            .await?;

        Ok(ApiResponse::success(treatment))
    }

    /// Finishes (marks as completed) an active treatment.
    pub async fn finish(
        &self,
        id: i64,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
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

    /// Suspends an active treatment.
    pub async fn suspend(
        &self,
        id: i64,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<TreatmentResponse>, AppError> {
        let treatment = self.repo.suspend(id).await?;

        self.audit
            .log_event(
                usuario_id,
                "SUSPEND",
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
    ) -> Result<ApiResponse<Vec<TreatmentResponse>>, AppError> {
        let treatments = self.repo.find_by_paciente(paciente_id).await?;
        Ok(ApiResponse::success(treatments))
    }

    /// Returns active treatments for a patient.
    pub async fn get_active_by_paciente(
        &self,
        paciente_id: i64,
    ) -> Result<ApiResponse<Vec<TreatmentResponse>>, AppError> {
        let treatments = self.repo.find_active_by_paciente(paciente_id).await?;
        Ok(ApiResponse::success(treatments))
    }

    /// Returns all active medicamentos.
    pub async fn get_medicamentos(&self) -> Result<ApiResponse<Vec<MedicamentoResponse>>, AppError> {
        let rows = sqlx::query_as::<_, Medicamento>(
            "SELECT id, nombre, activo FROM medicamentos WHERE activo = 1 ORDER BY nombre",
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| AppError::Database(format!("query medicamentos: {e}")))?;

        let medicamentos: Vec<MedicamentoResponse> = rows
            .into_iter()
            .map(|m| MedicamentoResponse {
                id: m.id,
                nombre: m.nombre,
            })
            .collect();

        Ok(ApiResponse::success(medicamentos))
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    fn validate_date(&self, date: &str) -> Result<(), AppError> {
        if date.len() != 10 {
            return Err(AppError::Validation(format!(
                "Invalid date format: {date}. Expected YYYY-MM-DD"
            )));
        }
        if chrono::NaiveDate::parse_from_str(date, "%Y-%m-%d").is_err() {
            return Err(AppError::Validation(format!(
                "Invalid date: {date}. Expected YYYY-MM-DD"
            )));
        }
        Ok(())
    }
}
