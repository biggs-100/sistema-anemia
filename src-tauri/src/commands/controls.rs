use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreateControlDTO};
use crate::models::Control;
use crate::AppState;

#[tauri::command]
pub async fn create_control(
    app: AppHandle,
    dto: CreateControlDTO,
    usuario_id: Option<i64>,
) -> Result<ApiResponse<Control>, String> {
    let state: State<AppState> = app.state();
    state
        .control_service
        .create(dto, usuario_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_control(
    app: AppHandle,
    id: i64,
    dto: CreateControlDTO,
    usuario_id: Option<i64>,
) -> Result<ApiResponse<Control>, String> {
    let state: State<AppState> = app.state();
    state
        .control_service
        .update(id, dto, usuario_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_controls(
    app: AppHandle,
    paciente_id: i64,
) -> Result<ApiResponse<Vec<Control>>, String> {
    let state: State<AppState> = app.state();
    state
        .control_service
        .get_by_paciente(paciente_id)
        .await
        .map_err(|e| e.to_string())
}
