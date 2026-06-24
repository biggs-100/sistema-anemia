use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreateControlDTO};
use crate::models::Control;
use crate::services::auth_service::{CLINICAL_ROLES, ALL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn create_control(
    app: AppHandle,
    token: String,
    dto: CreateControlDTO,
) -> Result<ApiResponse<Control>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .control_service
        .create(dto, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_control(
    app: AppHandle,
    token: String,
    id: i64,
    dto: CreateControlDTO,
) -> Result<ApiResponse<Control>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .control_service
        .update(id, dto, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_controls(
    app: AppHandle,
    token: String,
    paciente_id: i64,
) -> Result<ApiResponse<Vec<Control>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .control_service
        .get_by_paciente(paciente_id)
        .await
        .map_err(|e| e.to_string())
}
