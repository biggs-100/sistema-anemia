use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreateTreatmentDTO};
use crate::models::Treatment;
use crate::services::auth_service::{CLINICAL_ROLES, ALL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn create_treatment(
    app: AppHandle,
    token: String,
    dto: CreateTreatmentDTO,
) -> Result<ApiResponse<Treatment>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .treatment_service
        .create(dto, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn finish_treatment(
    app: AppHandle,
    token: String,
    id: i64,
) -> Result<ApiResponse<Treatment>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .treatment_service
        .finish(id, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_treatments(
    app: AppHandle,
    token: String,
    paciente_id: i64,
) -> Result<ApiResponse<Vec<Treatment>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .treatment_service
        .get_by_paciente(paciente_id)
        .await
        .map_err(|e| e.to_string())
}
