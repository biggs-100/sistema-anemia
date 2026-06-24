use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::services::ReportService;
use crate::AppState;

#[tauri::command]
pub async fn generate_pdf(app: AppHandle, paciente_id: i64) -> Result<String, String> {
    let _state: State<AppState> = app.state();
    ReportService::generate_pdf(paciente_id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn generate_excel(
    app: AppHandle,
    fecha_inicio: String,
    fecha_fin: String,
) -> Result<String, String> {
    let _state: State<AppState> = app.state();
    ReportService::generate_excel(&fecha_inicio, &fecha_fin)
        .await
        .map_err(|e| e.to_string())
}
