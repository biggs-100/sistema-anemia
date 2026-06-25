use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreatePatientDTO, ImportResult, PatientResponse, SearchResult, UpdatePatientDTO};
use crate::models::Patient;
use crate::services::auth_service::{CLINICAL_ROLES, ALL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn create_patient(
    app: AppHandle,
    token: String,
    dto: CreatePatientDTO,
) -> Result<ApiResponse<Patient>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .patient_service
        .create(dto, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_patient(
    app: AppHandle,
    token: String,
    id: i64,
    dto: UpdatePatientDTO,
) -> Result<ApiResponse<Patient>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .patient_service
        .update(id, dto, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_patient(
    app: AppHandle,
    token: String,
    id: i64,
) -> Result<ApiResponse<PatientResponse>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .patient_service
        .get_by_id(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_patients(
    app: AppHandle,
    token: String,
    query: String,
    page: Option<i64>,
    page_size: Option<i64>,
) -> Result<ApiResponse<SearchResult<PatientResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .patient_service
        .search(&query, page.unwrap_or(1), page_size.unwrap_or(20))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn deactivate_patient(
    app: AppHandle,
    token: String,
    id: i64,
) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .patient_service
        .deactivate(id, Some(user.id))
        .await
        .map_err(|e| e.to_string())?;
    Ok(ApiResponse::success(()))
}

/// CSV row structure matching the expected import format.
#[derive(serde::Deserialize)]
#[serde(rename_all = "snake_case")]
struct CsvPatientRow {
    historia_clinica: String,
    dni: String,
    nombres: String,
    apellido_paterno: String,
    apellido_materno: String,
    fecha_nacimiento: String,
    sexo: String,
    nombre_apoderado: Option<String>,
}

#[tauri::command]
pub async fn import_patients_csv(
    app: AppHandle,
    token: String,
    csv_content: String,
) -> Result<ApiResponse<ImportResult>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    // Parse CSV content
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .trim(csv::Trim::All)
        .from_reader(csv_content.as_bytes());

    let mut patients = Vec::new();
    let mut parse_errors: Vec<String> = Vec::new();

    for (i, result) in reader.deserialize::<CsvPatientRow>().enumerate() {
        match result {
            Ok(row) => {
                let dto = CreatePatientDTO {
                    historia_clinica: row.historia_clinica,
                    dni: row.dni,
                    nombres: row.nombres,
                    apellido_paterno: row.apellido_paterno,
                    apellido_materno: row.apellido_materno,
                    fecha_nacimiento: row.fecha_nacimiento,
                    sexo: row.sexo,
                    nombre_apoderado: row.nombre_apoderado,
                    direccion: None,
                    centro_poblado_id: None,
                    celular_apoderado: None,
                };
                patients.push(dto);
            }
            Err(e) => {
                parse_errors.push(format!("Fila {}: Error de formato — {}", i + 1, e));
            }
        }
    }

    if patients.is_empty() && !parse_errors.is_empty() {
        return Ok(ApiResponse::success(ImportResult {
            imported: 0,
            errors: parse_errors.len() as i64,
            details: parse_errors,
        }));
    }

    let result = state
        .patient_service
        .import_batch(patients, Some(user.id))
        .await;

    // Merge parse errors into result details
    let total_errors = parse_errors.len() as i64 + result.errors;
    let mut all_details = parse_errors;
    all_details.extend(result.details);

    Ok(ApiResponse::success(ImportResult {
        imported: result.imported,
        errors: total_errors,
        details: all_details,
    }))
}
