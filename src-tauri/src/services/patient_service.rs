use regex::Regex;

use crate::audit::AuditService;
use crate::dto::{ApiResponse, CreatePatientDTO, UpdatePatientDTO};
use crate::errors::AppError;
use crate::models::Patient;
use crate::repositories::patient_repository::PatientRepository;

/// Patient service for business logic and validation.
pub struct PatientService {
    repo: Box<dyn PatientRepository>,
    audit: AuditService,
}

impl PatientService {
    pub fn new(repo: Box<dyn PatientRepository>, audit: AuditService) -> Self {
        Self { repo, audit }
    }

    /// Creates a new patient with validation.
    ///
    /// Validates:
    /// - DNI: exactly 8 digits
    /// - Required fields: nombres, apellidos, fecha_nacimiento, sexo
    /// - DNI uniqueness
    /// - Historia clínica uniqueness
    pub async fn create(
        &self,
        dto: CreatePatientDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<Patient>, AppError> {
        self.validate_create(&dto)?;

        // Check DNI uniqueness
        if self.repo.find_by_dni(&dto.dni).await?.is_some() {
            return Err(AppError::Validation(format!(
                "DNI {} already registered",
                dto.dni
            )));
        }

        // Check historia_clinica uniqueness
        if !dto.historia_clinica.is_empty()
            && self
                .repo
                .find_by_historia(&dto.historia_clinica)
                .await?
                .is_some()
        {
            return Err(AppError::Validation(format!(
                "Historia clínica {} already registered",
                dto.historia_clinica
            )));
        }

        let patient = self.repo.create(&dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "CREATE",
                "patients",
                Some(patient.id),
                None,
                Some(&serde_json::to_string(&dto).unwrap_or_default()),
                None,
            )
            .await?;

        tracing::info!(
            "Patient created: {} {} (DNI: {})",
            patient.nombres,
            patient.apellido_paterno,
            patient.dni,
        );
        Ok(ApiResponse::success(patient))
    }

    /// Updates a patient with partial field support.
    pub async fn update(
        &self,
        id: i64,
        dto: UpdatePatientDTO,
        usuario_id: Option<i64>,
    ) -> Result<ApiResponse<Patient>, AppError> {
        // Fetch existing for audit
        let existing = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Patient {id} not found")))?;

        // Validate DNI if changing
        if let Some(ref dni) = dto.dni {
            if dni != &existing.dni {
                validate_dni(dni)?;
                if self.repo.find_by_dni(dni).await?.is_some() {
                    return Err(AppError::Validation(format!("DNI {dni} already registered")));
                }
            }
        }

        let patient = self.repo.update(id, &dto).await?;

        self.audit
            .log_event(
                usuario_id,
                "UPDATE",
                "patients",
                Some(id),
                Some(&serde_json::to_string(&existing).unwrap_or_default()),
                Some(&serde_json::to_string(&dto).unwrap_or_default()),
                None,
            )
            .await?;

        Ok(ApiResponse::success(patient))
    }

    /// Retrieves a single patient by ID.
    pub async fn get_by_id(&self, id: i64) -> Result<ApiResponse<Patient>, AppError> {
        let patient = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Patient {id} not found")))?;

        Ok(ApiResponse::success(patient))
    }

    /// Searches patients by query string (matches nombres, apellidos, DNI, historia_clínica).
    pub async fn search(&self, query: &str) -> Result<ApiResponse<Vec<Patient>>, AppError> {
        if query.trim().is_empty() {
            return Err(AppError::Validation("Search query is required".to_string()));
        }

        let patients = self.repo.search(query).await?;
        Ok(ApiResponse::success(patients))
    }

    /// Deactivates a patient (soft delete).
    pub async fn deactivate(
        &self,
        id: i64,
        usuario_id: Option<i64>,
    ) -> Result<(), AppError> {
        let existing = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Patient {id} not found")))?;

        self.repo.deactivate(id).await?;

        self.audit
            .log_event(
                usuario_id,
                "DEACTIVATE",
                "patients",
                Some(id),
                Some(&serde_json::to_string(&existing).unwrap_or_default()),
                None,
                None,
            )
            .await?;

        Ok(())
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    fn validate_create(&self, dto: &CreatePatientDTO) -> Result<(), AppError> {
        validate_dni(&dto.dni)?;

        if dto.nombres.trim().is_empty() {
            return Err(AppError::Validation("Nombres is required".to_string()));
        }
        if dto.apellido_paterno.trim().is_empty() {
            return Err(AppError::Validation(
                "Apellido paterno is required".to_string(),
            ));
        }
        if dto.apellido_materno.trim().is_empty() {
            return Err(AppError::Validation(
                "Apellido materno is required".to_string(),
            ));
        }
        if dto.fecha_nacimiento.trim().is_empty() {
            return Err(AppError::Validation(
                "Fecha de nacimiento is required".to_string(),
            ));
        }
        if dto.sexo.trim().is_empty() {
            return Err(AppError::Validation("Sexo is required".to_string()));
        }
        if dto.sexo != "M" && dto.sexo != "F" {
            return Err(AppError::Validation("Sexo must be 'M' or 'F'".to_string()));
        }

        Ok(())
    }
}

fn validate_dni(dni: &str) -> Result<(), AppError> {
    let re = Regex::new(r"^\d{8}$").unwrap();
    if !re.is_match(dni) {
        return Err(AppError::Validation(
            "DNI must be exactly 8 digits".to_string(),
        ));
    }
    Ok(())
}
