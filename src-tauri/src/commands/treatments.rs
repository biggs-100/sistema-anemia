use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CreateTreatmentDTO, TreatmentResponse, UpdateTreatmentDTO};
use crate::services::auth_service::{CLINICAL_ROLES, ALL_ROLES};
use crate::AppState;

#[tauri::command]
pub async fn create_treatment(
    app: AppHandle,
    token: String,
    paciente_id: i64,
    medicamento_id: i64,
    dosis: Option<String>,
    frecuencia: Option<String>,
    fecha_inicio: String,
    observaciones: Option<String>,
) -> Result<ApiResponse<TreatmentResponse>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    let dto = CreateTreatmentDTO {
        paciente_id,
        medicamento_id,
        dosis,
        frecuencia,
        fecha_inicio,
        observaciones,
    };

    state
        .treatment_service
        .create(dto, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_treatment(
    app: AppHandle,
    token: String,
    id: i64,
    dosis: Option<String>,
    frecuencia: Option<String>,
    observaciones: Option<String>,
) -> Result<ApiResponse<TreatmentResponse>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    let dto = UpdateTreatmentDTO {
        dosis,
        frecuencia,
        observaciones,
    };

    state
        .treatment_service
        .update(id, dto, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn finish_treatment(
    app: AppHandle,
    token: String,
    id: i64,
) -> Result<ApiResponse<TreatmentResponse>, String> {
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
pub async fn suspend_treatment(
    app: AppHandle,
    token: String,
    id: i64,
) -> Result<ApiResponse<TreatmentResponse>, String> {
    let state: State<AppState> = app.state();
    let user = state
        .auth_service
        .require_role(&token, CLINICAL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .treatment_service
        .suspend(id, Some(user.id))
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_treatments(
    app: AppHandle,
    token: String,
    paciente_id: i64,
) -> Result<ApiResponse<Vec<TreatmentResponse>>, String> {
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
