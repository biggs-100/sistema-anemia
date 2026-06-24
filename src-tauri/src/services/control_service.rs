use sqlx::SqlitePool;

use crate::audit::AuditService;
use crate::dto::{ApiResponse, ControlResponse, CreateControlDTO, SearchResult};
use crate::errors::AppError;
use crate::models::{classify_hemoglobina, ClasificacionAnemia, Control, HemoglobinaClasificacion};
use crate::repositories::control_repository::ControlRepository;

/// Control service for follow-up appointment business logic.
pub struct ControlService {
    repo: Box<dyn ControlRepository>,
    audit: AuditService,
    pool: SqlitePool,
}

impl ControlService {
    pub fn new(repo: Box<dyn ControlRepository>, audit: AuditService, pool: SqlitePool) -> Self {
        Self { repo, audit, pool }
    }

    /// Converts a `Control` model into the public `ControlResponse` DTO,
    /// computing the `clasificacion` from the hemoglobin value.
    fn to_response(&self, c: Control) -> ControlResponse {
        let hb = c.hemoglobina.unwrap_or(0.0);
        let clasificacion = ClasificacionAnemia::from_hemoglobina(hb).as_str().to_string();
        ControlResponse {
            id: c.id,
            paciente_id: c.paciente_id,
            fecha_control: c.fecha_control,
            edad_meses: c.edad_meses.map(|v| v as i64),
            peso: c.peso.unwrap_or(0.0),
            talla: c.talla.unwrap_or(0.0),
            hemoglobina: hb,
            clasificacion,
            temperatura: c.temperatura,
            observaciones: c.observaciones,
            usuario_id: c.usuario_id.unwrap_or(0),
            creado_en: c.creado_en.map(|dt| dt.format("%Y-%m-%dT%H:%M:%S").to_string()),
        }
    }

    /// Creates a new control with validation.
    ///
    /// Validates:
    /// - No future dates
    /// - Weight > 0 if provided
    /// - Height > 0 if provided
    /// - Hemoglobin 0.0–25.0 if provided
    /// - Auto-generates alert for critical hemoglobin values (< 7.0)
    pub async fn create(
        &self,
        dto: CreateControlDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<ControlResponse>, AppError> {
        self.validate(&dto)?;

        // Check for critical hemoglobin and log warning + insert alert
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

            // Insert alert for critical Hb (Severa — < 7.0)
            if classification == HemoglobinaClasificacion::Severa {
                sqlx::query(
                    "INSERT INTO alertas (paciente_id, tipo, descripcion, fecha_generada, resuelta) \
                     VALUES (?1, 'HEMOGLOBINA_CRITICA', ?2, datetime('now'), 0)",
                )
                .bind(dto.paciente_id)
                .bind(format!(
                    "Hemoglobina crítica: {:.1} g/dL - Requiere atención inmediata",
                    hb
                ))
                .execute(&self.pool)
                .await
                .map_err(|e| AppError::Database(format!("Failed to insert alert: {e}")))?;

                tracing::info!(
                    "Alert inserted for patient {}: critical Hb ({:.1})",
                    dto.paciente_id,
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

        Ok(ApiResponse::success(self.to_response(control)))
    }

    /// Updates an existing control.
    pub async fn update(
        &self,
        id: i64,
        dto: CreateControlDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<ControlResponse>, AppError> {
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

        Ok(ApiResponse::success(self.to_response(control)))
    }

    /// Returns paginated controls for a given patient.
    pub async fn get_by_paciente(
        &self,
        paciente_id: i64,
        page: i64,
        page_size: i64,
    ) -> Result<ApiResponse<SearchResult<ControlResponse>>, AppError> {
        let total = self.repo.count_by_paciente(paciente_id).await?;
        let controles = self
            .repo
            .find_by_paciente_paginated(paciente_id, page, page_size)
            .await?;
        let data: Vec<ControlResponse> = controles.into_iter().map(|c| self.to_response(c)).collect();

        Ok(ApiResponse::success(SearchResult {
            data,
            total,
            page,
            page_size,
        }))
    }

    /// Returns controls within a date range.
    pub async fn get_by_date_range(
        &self,
        fecha_inicio: &str,
        fecha_fin: &str,
    ) -> Result<ApiResponse<Vec<ControlResponse>>, AppError> {
        let controles = self
            .repo
            .find_by_date_range(fecha_inicio, fecha_fin)
            .await?;
        let data: Vec<ControlResponse> = controles.into_iter().map(|c| self.to_response(c)).collect();
        Ok(ApiResponse::success(data))
    }

    /// Returns controls for a specific patient filtered by date range.
    pub async fn get_by_paciente_date_range(
        &self,
        paciente_id: i64,
        fecha_inicio: &str,
        fecha_fin: &str,
    ) -> Result<ApiResponse<Vec<ControlResponse>>, AppError> {
        let controles = self
            .repo
            .find_by_paciente_date_range(paciente_id, fecha_inicio, fecha_fin)
            .await?;
        let data: Vec<ControlResponse> = controles.into_iter().map(|c| self.to_response(c)).collect();
        Ok(ApiResponse::success(data))
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
