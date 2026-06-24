use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::services::auth_service::ALL_ROLES;
use crate::services::ReportService;
use crate::AppState;

#[tauri::command]
pub async fn generate_pdf(
    app: AppHandle,
    token: String,
    paciente_id: i64,
) -> Result<String, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    ReportService::generate_pdf(paciente_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_excel(
    app: AppHandle,
    token: String,
    fecha_inicio: String,
    fecha_fin: String,
) -> Result<String, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    ReportService::generate_excel(&fecha_inicio, &fecha_fin)
        .await
        .map_err(|e| e.to_string())
}
