use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, MedicamentoResponse};
use crate::services::auth_service::ALL_ROLES;
use crate::AppState;

#[tauri::command]
pub async fn list_medicamentos(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<Vec<MedicamentoResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .treatment_service
        .get_medicamentos()
        .await
        .map_err(|e| e.to_string())
}
