use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreatePatientDTO, UpdatePatientDTO};
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
) -> Result<ApiResponse<Patient>, String> {
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
) -> Result<ApiResponse<Vec<Patient>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .patient_service
        .search(&query)
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
