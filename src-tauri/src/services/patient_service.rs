use chrono::{Datelike, NaiveDate, Utc};
use regex::Regex;
use std::collections::HashMap;

use crate::audit::AuditService;
use crate::dto::{ApiResponse, CreatePatientDTO, PatientResponse, SearchResult, UpdatePatientDTO};
use crate::errors::AppError;
use crate::models::Patient;
use crate::repositories::centro_poblado_repository::CentroPobladoRepository;
use crate::repositories::patient_repository::PatientRepository;

/// Patient service for business logic and validation.
pub struct PatientService {
    repo: Box<dyn PatientRepository>,
    centro_repo: Box<dyn CentroPobladoRepository>,
    audit: AuditService,
}

impl PatientService {
    pub fn new(
        repo: Box<dyn PatientRepository>,
        centro_repo: Box<dyn CentroPobladoRepository>,
        audit: AuditService,
    ) -> Self {
        Self {
            repo,
            centro_repo,
            audit,
        }
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

    /// Retrieves a single patient by ID with computed edad and centro_poblado name.
    pub async fn get_by_id(&self, id: i64) -> Result<ApiResponse<PatientResponse>, AppError> {
        let patient = self
            .repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Patient {id} not found")))?;

        let centro_map = self.build_centro_map().await?;
        let response = self.map_to_response(&patient, &centro_map);

        Ok(ApiResponse::success(response))
    }

    /// Searches patients with pagination, returning a search result with total count.
    ///
    /// Empty query returns ALL active patients paginated (not an error).
    pub async fn search(
        &self,
        query: &str,
        page: i64,
        page_size: i64,
    ) -> Result<ApiResponse<SearchResult<PatientResponse>>, AppError> {
        let (patients, total) = self.repo.search(query, page, page_size).await?;

        let centro_map = self.build_centro_map().await?;
        let data: Vec<PatientResponse> = patients
            .iter()
            .map(|p| self.map_to_response(p, &centro_map))
            .collect();

        Ok(ApiResponse::success(SearchResult {
            data,
            total,
            page,
            page_size,
        }))
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
    // Helpers
    // -----------------------------------------------------------------------

    /// Builds a map of centro_poblado_id → nombre for quick lookup.
    async fn build_centro_map(&self) -> Result<HashMap<i64, String>, AppError> {
        let centros = self.centro_repo.list_all().await?;
        Ok(centros.into_iter().map(|c| (c.id, c.nombre)).collect())
    }

    /// Maps a Patient domain model to a PatientResponse DTO with computed edad.
    fn map_to_response(&self, patient: &Patient, centro_map: &HashMap<i64, String>) -> PatientResponse {
        let edad = calcular_edad(&patient.fecha_nacimiento).unwrap_or_default();
        let centro_poblado_nombre = patient
            .centro_poblado_id
            .and_then(|id| centro_map.get(&id).cloned());

        PatientResponse {
            id: patient.id,
            historia_clinica: patient.historia_clinica.clone(),
            dni: patient.dni.clone(),
            nombres: patient.nombres.clone(),
            apellido_paterno: patient.apellido_paterno.clone(),
            apellido_materno: patient.apellido_materno.clone(),
            fecha_nacimiento: patient.fecha_nacimiento.clone(),
            sexo: patient.sexo.clone(),
            edad,
            direccion: patient.direccion.clone(),
            centro_poblado_id: patient.centro_poblado_id,
            centro_poblado_nombre,
            nombre_apoderado: patient.nombre_apoderado.clone(),
            celular_apoderado: patient.celular_apoderado.clone(),
            fecha_registro: patient.fecha_registro.clone(),
            activo: patient.activo,
        }
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

/// Computes age from a date string in "YYYY-MM-DD" format.
///
/// Returns "X años Y meses" for ≥ 1 year, "X meses" for infants.
pub fn calcular_edad(fecha_nacimiento: &str) -> Result<String, AppError> {
    let birth = NaiveDate::parse_from_str(fecha_nacimiento, "%Y-%m-%d")
        .map_err(|e| AppError::Validation(format!("Fecha de nacimiento inválida: {e}")))?;
    let today = Utc::now().date_naive();

    let mut years = today.year() - birth.year();
    let mut months = today.month() as i32 - birth.month() as i32;

    // Borrow a month if the current day is before the birth day
    if today.day() < birth.day() {
        months -= 1;
    }

    // Normalize negative months by borrowing a year
    if months < 0 {
        years -= 1;
        months += 12;
    }

    if years > 0 {
        Ok(format!("{} años {} meses", years, months))
    } else {
        Ok(format!("{} meses", months))
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calcular_edad_adult() {
        // Person born 15 years ago
        let today = Utc::now().date_naive();
        let birth_year = today.year() - 15;
        let birth_date = format!("{}-01-15", birth_year);
        let result = calcular_edad(&birth_date).unwrap();
        assert!(result.contains("15 años"), "Expected '15 años', got: {result}");
    }

    #[test]
    fn test_calcular_edad_infant() {
        // Person born 8 months ago
        let today = Utc::now().date_naive();
        let mut birth_month = today.month() as i32 - 8;
        let mut birth_year = today.year();
        if birth_month <= 0 {
            birth_month += 12;
            birth_year -= 1;
        }
        let birth_date = format!("{}-{:02}-15", birth_year, birth_month);
        let result = calcular_edad(&birth_date).unwrap();
        assert!(
            result.contains("meses"),
            "Expected 'X meses', got: {result}"
        );
        assert!(!result.contains("años"), "Should not contain 'años'");
    }

    #[test]
    fn test_calcular_edad_exact_one_year() {
        let today = Utc::now().date_naive();
        let birth_date = format!(
            "{}-{:02}-{:02}",
            today.year() - 1,
            today.month(),
            today.day()
        );
        let result = calcular_edad(&birth_date).unwrap();
        assert_eq!(result, "1 años 0 meses");
    }

    #[test]
    fn test_calcular_edad_invalid_date() {
        let result = calcular_edad("not-a-date");
        assert!(result.is_err());
    }
}
