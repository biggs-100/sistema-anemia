use tauri::AppHandle;
use tauri::State;
use tauri::Manager;

use crate::dto::{ApiResponse, CentroPobladoResponse};
use crate::services::auth_service::ALL_ROLES;
use crate::AppState;

#[tauri::command]
pub async fn list_centros_poblados(
    app: AppHandle,
    token: String,
) -> Result<ApiResponse<Vec<CentroPobladoResponse>>, String> {
    let state: State<AppState> = app.state();
    let _user = state
        .auth_service
        .require_role(&token, ALL_ROLES)
        .await
        .map_err(|e| e.to_string())?;

    state
        .centro_poblado_service
        .list_all()
        .await
        .map_err(|e| e.to_string())
}
