use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreateTreatmentDTO};
use crate::models::Treatment;
use crate::AppState;

#[tauri::command]
pub async fn create_treatment(
    app: AppHandle,
    dto: CreateTreatmentDTO,
    usuario_id: Option<i64>,
) -> Result<ApiResponse<Treatment>, String> {
    let state: State<AppState> = app.state();
    state
        .treatment_service
        .create(dto, usuario_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn finish_treatment(
    app: AppHandle,
    id: i64,
    usuario_id: Option<i64>,
) -> Result<ApiResponse<Treatment>, String> {
    let state: State<AppState> = app.state();
    state
        .treatment_service
        .finish(id, usuario_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_treatments(
    app: AppHandle,
    paciente_id: i64,
) -> Result<ApiResponse<Vec<Treatment>>, String> {
    let state: State<AppState> = app.state();
    state
        .treatment_service
        .get_by_paciente(paciente_id)
        .await
        .map_err(|e| e.to_string())
}
