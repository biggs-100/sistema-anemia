use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, ControlResponse, CreateControlDTO, CreateControlResponse, SearchResult};
use crate::services::auth_service::{ALL_ROLES, CLINICAL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn create_control(
    app: AppHandle,
    token: String,
    dto: CreateControlDTO,
) -> Result<ApiResponse<CreateControlResponse>, String> {
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
) -> Result<ApiResponse<ControlResponse>, String> {
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
    page: Option<i64>,
    page_size: Option<i64>,
) -> Result<ApiResponse<SearchResult<ControlResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    let page = page.unwrap_or(1);
    let page_size = page_size.unwrap_or(20);

    state
        .control_service
        .get_by_paciente(paciente_id, page, page_size)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_controls_by_date_range(
    app: AppHandle,
    token: String,
    paciente_id: i64,
    inicio: String,
    fin: String,
) -> Result<ApiResponse<Vec<ControlResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .control_service
        .get_by_paciente_date_range(paciente_id, &inicio, &fin)
        .await
        .map_err(|e| e.to_string())
}
