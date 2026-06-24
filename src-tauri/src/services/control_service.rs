use crate::audit::AuditService;
use crate::dto::{ApiResponse, CreateControlDTO};
use crate::errors::AppError;
use crate::models::{classify_hemoglobina, Control, HemoglobinaClasificacion};
use crate::repositories::control_repository::ControlRepository;

/// Control service for follow-up appointment business logic.
pub struct ControlService {
    repo: Box<dyn ControlRepository>,
    audit: AuditService,
}

impl ControlService {
    pub fn new(repo: Box<dyn ControlRepository>, audit: AuditService) -> Self {
        Self { repo, audit }
    }

    /// Creates a new control with validation.
    ///
    /// Validates:
    /// - No future dates
    /// - Weight > 0 if provided
    /// - Height > 0 if provided
    /// - Hemoglobin 0.0–25.0 if provided
    /// - Auto-generates alert for critical hemoglobin values
    pub async fn create(
        &self,
        dto: CreateControlDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<Control>, AppError> {
        self.validate(&dto)?;

        // Check for critical hemoglobin and set alert
        if let Some(hb) = dto.hemoglobina {
            let classification = classify_hemoglobina(hb);
            if classification != HemoglobinaClasificacion::Normal {
                tracing::warn!(
                    "Patient {} has {} hemoglobin ({:.1})",
                    dto.paciente_id,
                    classification_name(classification),
                    hb,
                );
            }
        }

        let mut create_dto = dto;
        create_dto.usuario_id = usuario_id;
        let control = self.repo.create(&create_dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "CREATE",
                "controles",
                Some(control.id),
                None,
                Some(&serde_json::to_string(&create_dto).unwrap_or_default()),
                None,
            )
            .await?;

        Ok(ApiResponse::success(control))
    }

    /// Updates an existing control.
    pub async fn update(
        &self,
        id: i64,
        dto: CreateControlDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<Control>, AppError> {
        self.validate(&dto)?;

        let control = self.repo.update(id, &dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "UPDATE",
                "controles",
                Some(id),
                None,
                Some(&serde_json::to_string(&control).unwrap_or_default()),
                None,
            )
            .await?;

        Ok(ApiResponse::success(control))
    }

    /// Returns all controls for a given patient.
    pub async fn get_by_paciente(
        &self,
        paciente_id: i64,
    ) -> Result<ApiResponse<Vec<Control>>, AppError> {
        let controles = self.repo.find_by_paciente(paciente_id).await?;
        Ok(ApiResponse::success(controles))
    }

    /// Returns controls within a date range.
    pub async fn get_by_date_range(
        &self,
        fecha_inicio: &str,
        fecha_fin: &str,
    ) -> Result<ApiResponse<Vec<Control>>, AppError> {
        let controles = self
            .repo
            .find_by_date_range(fecha_inicio, fecha_fin)
            .await?;
        Ok(ApiResponse::success(controles))
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    fn validate(&self, dto: &CreateControlDTO) -> Result<(), AppError> {
        // No future dates
        let today = chrono::Local::now().format("%Y-%m-%d").to_string();
        if dto.fecha_control > today {
            return Err(AppError::Validation(
                "Control date cannot be in the future".to_string(),
            ));
        }

        // Weight > 0
        if let Some(w) = dto.peso {
            if w <= 0.0 {
                return Err(AppError::Validation("Weight must be greater than 0".to_string()));
            }
        }

        // Height > 0
        if let Some(h) = dto.talla {
            if h <= 0.0 {
                return Err(AppError::Validation("Height must be greater than 0".to_string()));
            }
        }

        // Hemoglobin range
        if let Some(hb) = dto.hemoglobina {
            if hb < 0.0 || hb > 25.0 {
                return Err(AppError::Validation(
                    "Hemoglobin must be between 0.0 and 25.0".to_string(),
                ));
            }
        }

        Ok(())
    }
}

fn classification_name(c: HemoglobinaClasificacion) -> &'static str {
    match c {
        HemoglobinaClasificacion::Normal => "Normal",
        HemoglobinaClasificacion::Leve => "Leve",
        HemoglobinaClasificacion::Moderada => "Moderada",
        HemoglobinaClasificacion::Severa => "Severa",
    }
}
