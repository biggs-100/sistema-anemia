use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreatePatientDTO, UpdatePatientDTO};
use crate::models::Patient;
use crate::AppState;

#[tauri::command]
pub async fn create_patient(
    app: AppHandle,
    dto: CreatePatientDTO,
    usuario_id: Option<i64>,
) -> Result<ApiResponse<Patient>, String> {
    let state: State<AppState> = app.state();
    state
        .patient_service
        .create(dto, usuario_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_patient(
    app: AppHandle,
    id: i64,
    dto: UpdatePatientDTO,
    usuario_id: Option<i64>,
) -> Result<ApiResponse<Patient>, String> {
    let state: State<AppState> = app.state();
    state
        .patient_service
        .update(id, dto, usuario_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_patient(
    app: AppHandle,
    id: i64,
) -> Result<ApiResponse<Patient>, String> {
    let state: State<AppState> = app.state();
    state
        .patient_service
        .get_by_id(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn search_patients(
    app: AppHandle,
    query: String,
) -> Result<ApiResponse<Vec<Patient>>, String> {
    let state: State<AppState> = app.state();
    state
        .patient_service
        .search(&query)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn deactivate_patient(
    app: AppHandle,
    id: i64,
    usuario_id: Option<i64>,
) -> Result<ApiResponse<()>, String> {
    let state: State<AppState> = app.state();
    state
        .patient_service
        .deactivate(id, usuario_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(ApiResponse::success(()))
}
